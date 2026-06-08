(function () {
    const { MessData, MessState, MessStorage } = window;
    const app = document.querySelector('#app');
    let state = MessStorage.loadState(MessState.createInitialState());
    const ui = {
        activeTab: 'home'
    };

    const escapeHtml = (value) => String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const today = () => MessState.todayKey(new Date());

    const saveAndRender = (nextState) => {
        state = MessState.normalizeState(nextState);
        MessStorage.saveState(state);
        render();
    };

    const renderVaultCards = () => MessData.vaultResources.map((resource) => {
        const favorite = state.favorites.includes(resource.id);
        const complete = state.completedResources.includes(resource.id);
        return `
            <article class="resource-card">
                <div>
                    <p class="eyebrow">${escapeHtml(resource.category)} · ${escapeHtml(resource.time)}</p>
                    <h3>${escapeHtml(resource.title)}</h3>
                    <p>${escapeHtml(resource.description)}</p>
                </div>
                <div class="card-actions">
                    <button class="ghost-button" type="button" data-action="favorite" data-id="${escapeHtml(resource.id)}">${favorite ? 'Saved' : 'Save'}</button>
                    <button class="text-button" type="button" data-action="complete-resource" data-id="${escapeHtml(resource.id)}">${complete ? 'Done' : 'Mark done'}</button>
                </div>
            </article>
        `;
    }).join('');

    const renderChallengeSteps = () => {
        const challenge = MessData.starterChallenge;
        const done = state.challengeProgress[challenge.id] || [];
        return challenge.steps.map((step, index) => `
            <label class="step-row">
                <input type="checkbox" data-action="challenge-step" data-index="${index}" ${done.includes(index) ? 'checked' : ''}>
                <span>${escapeHtml(step)}</span>
            </label>
        `).join('');
    };

    const renderMoodChoices = (selectedMood = '') => MessData.moodChoices.map((mood) => `
        <label class="mood-choice">
            <input type="radio" name="mood" value="${escapeHtml(mood)}" ${selectedMood === mood ? 'checked' : ''}>
            <span>${escapeHtml(mood)}</span>
        </label>
    `).join('');

    const renderCheckInHistory = () => {
        const entries = MessState.listCheckIns(state).slice(0, 3);
        if (!entries.length) {
            return '<p class="quiet-note">No check-ins saved yet. Start with one honest sentence.</p>';
        }

        return `
            <div class="history-list">
                ${entries.map((entry) => `
                    <article class="history-item">
                        <p class="history-date">${escapeHtml(entry.date)} · ${escapeHtml(entry.mood || 'Checked in')}</p>
                        <p>${escapeHtml(entry.nextStep || entry.needToday || entry.feelsHeavy || 'You paused for yourself today.')}</p>
                    </article>
                `).join('')}
            </div>
        `;
    };

    const renderTodaySummary = (checkIn) => checkIn.savedAt ? `
        <div class="today-summary">
            <p class="eyebrow">Latest today</p>
            <h3>${escapeHtml(checkIn.mood || 'Checked in')}</h3>
            <p>${escapeHtml(checkIn.nextStep || checkIn.needToday || 'You made a little room for yourself today.')}</p>
        </div>
    ` : `
        <div class="empty-summary">
            <p>No check-in saved yet today.</p>
        </div>
    `;

    const renderCheckInForm = (checkIn) => `
        <form data-form="check-in" class="stacked-form">
            <fieldset class="mood-field">
                <legend>How are you feeling?</legend>
                <div class="mood-grid">${renderMoodChoices(checkIn.mood)}</div>
            </fieldset>
            <label>
                What do you need today?
                <textarea name="needToday" rows="2" placeholder="A break, help, quiet, food, a minute to breathe...">${escapeHtml(checkIn.needToday || '')}</textarea>
            </label>
            <label>
                What feels heavy right now?
                <textarea name="feelsHeavy" rows="2" placeholder="Name it without fixing it yet.">${escapeHtml(checkIn.feelsHeavy || '')}</textarea>
            </label>
            <label>
                What is one small thing you can do next?
                <textarea name="nextStep" rows="2" placeholder="Keep it tiny and doable.">${escapeHtml(checkIn.nextStep || '')}</textarea>
            </label>
            <button class="primary-button full-button" type="submit">Save check-in</button>
        </form>
    `;

    const renderResetCard = (resetCount) => `
        <article class="panel reset-panel">
            <p class="eyebrow">3-minute reset</p>
            <h2>Come back to right now.</h2>
            <div class="reset-steps">
                ${MessData.resetSteps.map((step, index) => `
                    <article class="reset-step">
                        <span>${index + 1}</span>
                        <div>
                            <h3>${escapeHtml(step.title)}</h3>
                            <p>${escapeHtml(step.description)}</p>
                        </div>
                    </article>
                `).join('')}
            </div>
            <button class="primary-button full-button" type="button" data-action="complete-reset">I took the reset</button>
            <p class="quiet-note">Resets saved: ${resetCount}</p>
        </article>
    `;

    const renderTabContent = ({ checkIn, reflection, resetCount }) => {
        if (ui.activeTab === 'checkin') {
            return `
                <section class="screen-panel">
                    <p class="eyebrow">Daily check-in</p>
                    <h2>Pause before the day takes over.</h2>
                    ${renderTodaySummary(checkIn)}
                    ${renderCheckInForm(checkIn)}
                </section>
            `;
        }

        if (ui.activeTab === 'reset') {
            return `
                <section class="screen-panel">
                    ${renderResetCard(resetCount)}
                </section>
            `;
        }

        if (ui.activeTab === 'vault') {
            return `
                <section class="screen-panel">
                    <p class="eyebrow">Vault preview</p>
                    <h2>Small tools for messy days</h2>
                    <div class="resource-list">${renderVaultCards()}</div>
                    <aside class="panel challenge-panel">
                        <p class="eyebrow">Starter challenge</p>
                        <h2>${escapeHtml(MessData.starterChallenge.title)}</h2>
                        <p>${escapeHtml(MessData.starterChallenge.description)}</p>
                        <div class="challenge-steps">${renderChallengeSteps()}</div>
                    </aside>
                </section>
            `;
        }

        if (ui.activeTab === 'journal') {
            return `
                <section class="screen-panel">
                    <p class="eyebrow">Journal</p>
                    <h2>Recent check-ins</h2>
                    ${renderCheckInHistory()}
                    <article class="panel reflection-panel">
                        <p class="eyebrow">Evening reflection</p>
                        <h2>Close the loop gently.</h2>
                        <form data-form="reflection" class="reflection-grid">
                            <label>
                                What went well?
                                <textarea name="wentWell" rows="3">${escapeHtml(reflection.wentWell || '')}</textarea>
                            </label>
                            <label>
                                What challenged me?
                                <textarea name="challenged" rows="3">${escapeHtml(reflection.challenged || '')}</textarea>
                            </label>
                            <label>
                                One win from today
                                <textarea name="win" rows="3">${escapeHtml(reflection.win || '')}</textarea>
                            </label>
                            <button class="primary-button full-button" type="submit">Save reflection</button>
                        </form>
                    </article>
                </section>
            `;
        }

        return `
            <section class="home-stack">
                <article class="status-card">
                    <p class="eyebrow">Today</p>
                    <h2>${checkIn.savedAt ? escapeHtml(checkIn.mood || 'Checked in') : 'Start with a small pause.'}</h2>
                    <p>${escapeHtml(checkIn.nextStep || checkIn.needToday || 'Check in with yourself, take one reset, and let the rest wait a minute.')}</p>
                </article>

                <section class="quick-actions" aria-label="Quick actions">
                    <button class="quick-card" type="button" data-action="tab" data-tab="checkin">
                        <span>Check-In</span>
                        <strong>Tell the truth gently</strong>
                    </button>
                    <button class="quick-card" type="button" data-action="tab" data-tab="reset">
                        <span>Reset</span>
                        <strong>Take 3 minutes</strong>
                    </button>
                </section>

                <article class="panel compact-panel">
                    <p class="eyebrow">Latest check-in</p>
                    ${renderTodaySummary(checkIn)}
                </article>

                <article class="panel compact-panel">
                    <p class="eyebrow">Journal</p>
                    <h2>Recent check-ins</h2>
                    ${renderCheckInHistory()}
                </article>
            </section>
        `;
    };

    const renderBottomNav = () => {
        const tabs = [
            ['home', 'Home'],
            ['checkin', 'Check-In'],
            ['reset', 'Reset'],
            ['vault', 'Vault'],
            ['journal', 'Journal']
        ];

        return `
            <nav class="bottom-nav" aria-label="Primary">
                ${tabs.map(([id, label]) => `
                    <button class="nav-tab ${ui.activeTab === id ? 'active' : ''}" type="button" data-action="tab" data-tab="${id}">
                        <span>${escapeHtml(label)}</span>
                    </button>
                `).join('')}
            </nav>
        `;
    };

    const render = () => {
        const checkIn = MessState.getTodayLatestCheckIn(state, new Date()) || {};
        const reflection = state.reflections[today()] || {};
        const resetCount = state.resetSessions.length;

        app.innerHTML = `
            <div class="phone-frame">
                <header class="app-header">
                    <div>
                        <p class="eyebrow">Daily reset</p>
                        <h1>The Mess of Us</h1>
                    </div>
                    <p>Chaos welcome. Coffee optional.</p>
                </header>

                <main class="app-content">
                    ${renderTabContent({ checkIn, reflection, resetCount })}
                </main>

                ${renderBottomNav()}
            </div>
        `;
    };

    document.addEventListener('submit', (event) => {
        const form = event.target.closest('form[data-form]');
        if (!form) return;
        event.preventDefault();
        const formData = new FormData(form);

        if (form.dataset.form === 'check-in') {
            saveAndRender(MessState.addCheckIn(state, {
                mood: formData.get('mood'),
                needToday: formData.get('needToday'),
                feelsHeavy: formData.get('feelsHeavy'),
                nextStep: formData.get('nextStep')
            }));
        }

        if (form.dataset.form === 'reflection') {
            saveAndRender(MessState.saveReflection(state, {
                wentWell: formData.get('wentWell'),
                challenged: formData.get('challenged'),
                win: formData.get('win')
            }));
        }
    });

    document.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        if (button.dataset.action === 'tab') {
            ui.activeTab = button.dataset.tab || 'home';
            render();
            return;
        }

        if (button.dataset.action === 'complete-reset') {
            saveAndRender(MessState.recordResetSession(state));
        }

        if (button.dataset.action === 'favorite') {
            saveAndRender(MessState.toggleFavorite(state, button.dataset.id));
        }

        if (button.dataset.action === 'complete-resource') {
            saveAndRender(MessState.markResourceComplete(state, button.dataset.id));
        }
    });

    document.addEventListener('change', (event) => {
        const checkbox = event.target.closest('input[data-action="challenge-step"]');
        if (!checkbox) return;
        saveAndRender(MessState.toggleChallengeStep(
            state,
            MessData.starterChallenge.id,
            Number(checkbox.dataset.index)
        ));
    });

    render();
})();
