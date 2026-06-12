(function () {
    const { MessData, MessState, MessStorage } = window;
    const app = document.querySelector('#app');
    const ui = {
        activeTab: 'home',
        vaultCategory: 'All',
        testerCodeError: ''
    };
    let activeTesterCode = MessStorage.loadActiveTesterCode(MessData.allowedTesterCodes);
    let state = MessStorage.loadState(MessState.createInitialState(), activeTesterCode);

    const escapeHtml = (value) => String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const today = () => MessState.todayKey(new Date());

    const formatNoteDate = (value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Saved locally';
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const saveAndRender = (nextState) => {
        state = MessState.normalizeState(nextState);
        MessStorage.saveState(state, activeTesterCode);
        render();
    };

    const vaultResourceIds = () => MessData.vaultResources.map((resource) => resource.id);

    const challengeDayIds = () => MessData.starterChallenge.days.map((day) => day.id);

    const feedbackHref = () => {
        const subject = `The Mess of Us Feedback - ${activeTesterCode || 'No tester code'}`;
        const body = [
            `Tester code: ${activeTesterCode || 'Not set'}`,
            '',
            ...MessData.feedbackLink.questions.flatMap((question) => [question, ''])
        ].join('\n');
        return `mailto:${MessData.feedbackLink.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const renderFeedbackLink = (className = 'feedback-link') => `
        <a class="${className}" href="${escapeHtml(feedbackHref())}">${escapeHtml(MessData.feedbackLink.label)}</a>
    `;

    const renderTesterGate = () => `
        <section class="tester-gate" aria-label="Tester code">
            <div class="onboarding-intro">
                <p class="eyebrow">Early tester access</p>
                <h2>Enter your tester code</h2>
                <p>This keeps your test notes and progress separate on this device.</p>
            </div>
            <form data-form="tester-code" class="tester-form">
                <label>
                    Tester code
                    <input name="testerCode" type="text" autocomplete="off" autocapitalize="characters" placeholder="MESS-LH-01" aria-describedby="tester-code-help">
                </label>
                <p id="tester-code-help" class="quiet-note">Use the code you were given for this preview.</p>
                ${ui.testerCodeError ? `<p class="form-error" role="alert">${escapeHtml(ui.testerCodeError)}</p>` : ''}
                <button class="primary-button full-button" type="submit">Continue</button>
            </form>
        </section>
    `;

    const renderReflectionSummary = (reflection) => {
        if (!reflection.savedAt) {
            return '<p class="quiet-note">No evening reflection saved yet. The Journal is here when you want to close the loop gently.</p>';
        }

        return `
            <div class="today-summary">
                <p class="eyebrow">Latest reflection</p>
                <h3>${escapeHtml(reflection.win || 'You made room for your day.')}</h3>
                <p>${escapeHtml(reflection.wentWell || reflection.challenged || 'A saved reflection is waiting in your Journal.')}</p>
            </div>
        `;
    };

    const renderVaultFilters = () => `
        <div class="filter-row" aria-label="Vault categories">
            ${MessData.vaultCategories.map((category) => `
                <button class="filter-chip ${ui.vaultCategory === category ? 'active' : ''}" type="button" data-action="vault-filter" data-category="${escapeHtml(category)}">
                    ${escapeHtml(category)}
                </button>
            `).join('')}
        </div>
    `;

    const renderVaultCards = () => {
        const resources = ui.vaultCategory === 'All'
            ? MessData.vaultResources
            : MessData.vaultResources.filter((resource) => resource.category === ui.vaultCategory);

        return resources.map((resource) => {
        const favorite = state.favorites.includes(resource.id);
        const complete = state.completedResources.includes(resource.id);
        return `
            <article class="resource-card ${complete ? 'complete' : ''}">
                <div>
                    <p class="eyebrow">${escapeHtml(resource.category)} · ${escapeHtml(resource.time)}</p>
                    <h3>${escapeHtml(resource.title)}</h3>
                    <p>${escapeHtml(resource.description)}</p>
                    <div class="prompt-box">
                        <span>Prompt</span>
                        <p>${escapeHtml(resource.prompt)}</p>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="ghost-button ${favorite ? 'selected' : ''}" type="button" data-action="favorite" data-id="${escapeHtml(resource.id)}">${favorite ? 'Favorited' : 'Favorite'}</button>
                    <button class="text-button ${complete ? 'selected' : ''}" type="button" data-action="complete-resource" data-id="${escapeHtml(resource.id)}">${complete ? 'Complete' : 'Mark complete'}</button>
                </div>
            </article>
        `;
        }).join('');
    };

    const renderChallengeSteps = () => {
        const challenge = MessData.starterChallenge;
        const done = MessState.getChallengeProgress(state, challenge.id, challengeDayIds()).completedIds;
        return challenge.days.map((day) => `
            <article class="challenge-day ${done.includes(day.id) ? 'complete' : ''}">
                <div>
                    <p class="eyebrow">${escapeHtml(day.label)}</p>
                    <h3>${escapeHtml(day.title)}</h3>
                    <p>${escapeHtml(day.body)}</p>
                    <div class="prompt-box">
                        <span>Prompt</span>
                        <p>${escapeHtml(day.prompt)}</p>
                    </div>
                </div>
                <button class="text-button ${done.includes(day.id) ? 'selected' : ''}" type="button" data-action="challenge-day" data-id="${escapeHtml(day.id)}">
                    ${done.includes(day.id) ? 'Complete' : 'Complete day'}
                </button>
            </article>
        `).join('');
    };

    const renderStarterChallenge = () => {
        const challenge = MessData.starterChallenge;
        const progress = MessState.getChallengeProgress(state, challenge.id, challengeDayIds());
        return `
            <article class="panel challenge-panel">
                <p class="eyebrow">Starter challenge</p>
                <h2>${escapeHtml(challenge.title)}</h2>
                <p>${escapeHtml(challenge.description)}</p>
                <div class="challenge-progress" aria-label="Challenge progress">
                    <span>${progress.completed} of ${progress.total} days complete</span>
                    <div><i style="width: ${progress.total ? (progress.completed / progress.total) * 100 : 0}%"></i></div>
                </div>
                <div class="challenge-steps">${renderChallengeSteps()}</div>
            </article>
        `;
    };

    const renderChallengeCadences = () => `
        <div class="placeholder-grid">
            ${MessData.challengeCadences.map((cadence) => `
                <article class="placeholder-card">
                    <p class="eyebrow">${escapeHtml(cadence.id)}</p>
                    <h3>${escapeHtml(cadence.title)}</h3>
                    <p>${escapeHtml(cadence.description)}</p>
                </article>
            `).join('')}
        </div>
    `;

    const renderOnboarding = () => `
        <section class="onboarding-screen" aria-label="Welcome to The Mess of Us">
            <div class="onboarding-intro">
                <p class="eyebrow">Welcome</p>
                <h2>A daily reset space for the overwhelmed middle.</h2>
                <p>The Mess of Us is for women and moms who need a softer place to pause, tell the truth, and choose one small next step.</p>
            </div>
            <div class="onboarding-cards">
                ${MessData.onboardingCards.map((card, index) => `
                    <article class="onboarding-card">
                        <span>${index + 1}</span>
                        <div>
                            <h3>${escapeHtml(card.title)}</h3>
                            <p>${escapeHtml(card.body)}</p>
                        </div>
                    </article>
                `).join('')}
            </div>
            <div class="onboarding-actions">
                <button class="primary-button full-button" type="button" data-action="finish-onboarding" data-next-tab="checkin">Start my reset</button>
                <button class="text-button full-button" type="button" data-action="finish-onboarding" data-next-tab="home">Skip for now</button>
            </div>
        </section>
    `;

    const renderVillagePreview = () => `
        <section class="screen-panel">
            <section class="village-intro">
                <p class="eyebrow">Private village notes</p>
                <h2>Speak to the Village</h2>
                <p>Write what you would say if the village was gathered around the table. For now, this stays private on this device.</p>
            </section>
            <form data-form="village-note" class="village-composer">
                <label>
                    Category
                    <select name="category">
                        ${MessData.villageCategories.map((category) => `<option value="${escapeHtml(category.title)}">${escapeHtml(category.title)}</option>`).join('')}
                    </select>
                </label>
                <fieldset>
                    <legend>Choose a prompt</legend>
                    <div class="prompt-choice-grid">
                        ${MessData.villagePrompts.map((prompt, index) => `
                            <label class="prompt-choice">
                                <input type="radio" name="prompt" value="${escapeHtml(prompt)}" ${index === 0 ? 'checked' : ''}>
                                <span>${escapeHtml(prompt)}</span>
                            </label>
                        `).join('')}
                    </div>
                </fieldset>
                <label>
                    Your note
                    <textarea name="body" rows="5" placeholder="Write it here..."></textarea>
                </label>
                <button class="primary-button full-button" type="submit">Save village note</button>
                <p class="quiet-note">These notes are local to ${escapeHtml(activeTesterCode)} on this device.</p>
            </form>
            <section class="village-notes">
                <p class="eyebrow">Recent notes</p>
                ${renderVillageNotes()}
            </section>
        </section>
    `;

    const renderVillageNotes = () => {
        const notes = MessState.listVillageNotes(state).slice(0, 6);
        if (!notes.length) {
            return '<p class="quiet-note">No Village notes saved yet. Write one thing you would say out loud if the table felt safe.</p>';
        }

        return `
            <div class="village-note-list">
                ${notes.map((note) => `
                    <article class="village-note">
                        <div class="village-note-meta">
                            <span>${escapeHtml(note.category)}</span>
                            <time>${escapeHtml(formatNoteDate(note.createdAt))}</time>
                        </div>
                        ${note.prompt ? `<p class="village-note-prompt">${escapeHtml(note.prompt)}</p>` : ''}
                        <p>${escapeHtml(note.body)}</p>
                        <div class="village-note-footer">
                            <span>Saved privately</span>
                            <button class="text-button danger-text" type="button" data-action="delete-village-note" data-id="${escapeHtml(note.id)}">Delete</button>
                        </div>
                    </article>
                `).join('')}
            </div>
        `;
    };

    const renderProfile = () => {
        const stats = MessState.getProfileStats(state, {
            resourceIds: vaultResourceIds(),
            challengeId: MessData.starterChallenge.id,
            challengeDayIds: challengeDayIds()
        });

        return `
            <section class="screen-panel">
                <article class="status-card profile-hero">
                    <div class="profile-photo" aria-hidden="true">TM</div>
                    <div>
                    <p class="eyebrow">Local profile</p>
                    <h2>Your quiet progress</h2>
                        <p>Tester code: ${escapeHtml(activeTesterCode)}. Real accounts and synced profiles will come later.</p>
                    </div>
                </article>
                <section class="stats-grid" aria-label="Local stats">
                    <article><span>${stats.checkInsCompleted}</span><p>check-ins completed</p></article>
                    <article><span>${stats.villageNotes}</span><p>Village notes</p></article>
                    <article><span>${stats.vaultFavorites}</span><p>Vault favorites</p></article>
                    <article><span>${stats.vaultCompletions}</span><p>Vault completions</p></article>
                    <article><span>${stats.challengeCompleted}/${stats.challengeTotal}</span><p>challenge progress</p></article>
                </section>
                <article class="panel">
                    <p class="eyebrow">Coming profile pieces</p>
                    <div class="placeholder-list">
                        ${MessData.profilePlaceholders.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}
                    </div>
                    <p class="quiet-note">These are placeholders only. No login, accounts, notifications, or synced trackers have been added.</p>
                </article>
                <div class="profile-actions">
                    ${renderFeedbackLink('feedback-link primary-feedback')}
                    <button class="ghost-button full-button" type="button" data-action="replay-onboarding">Replay welcome</button>
                    <button class="ghost-button full-button" type="button" data-action="switch-tester">Switch tester code</button>
                    <button class="danger-button full-button" type="button" data-action="reset-tester-data">Reset this tester's local data</button>
                </div>
            </section>
        `;
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
            const favoriteCount = state.favorites.filter((id) => vaultResourceIds().includes(id)).length;
            const completedCount = state.completedResources.filter((id) => vaultResourceIds().includes(id)).length;
            return `
                <section class="screen-panel">
                    <p class="eyebrow">Vault</p>
                    <h2>Small tools for messy days</h2>
                    <p class="section-copy">Favorites, completions, and filters stay local for now. Personalization from Daily Reset and challenge patterns will come later.</p>
                    <div class="vault-stats">
                        <span>${favoriteCount} favorites</span>
                        <span>${completedCount} completed</span>
                    </div>
                    ${renderVaultFilters()}
                    <div class="resource-list">${renderVaultCards()}</div>
                </section>
            `;
        }

        if (ui.activeTab === 'village') {
            return renderVillagePreview();
        }

        if (ui.activeTab === 'challenges') {
            return `
                <section class="screen-panel">
                    ${renderStarterChallenge()}
                    <section class="section-block">
                        <p class="eyebrow">Challenge library preview</p>
                        <h2>More rhythms are on the way.</h2>
                        <p class="section-copy">Daily, weekly, and monthly challenges are placeholders for now. No publishing, discussion threads, or backend research tools have been added.</p>
                        ${renderChallengeCadences()}
                    </section>
                </section>
            `;
        }

        if (ui.activeTab === 'profile') {
            return renderProfile();
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
                    <button class="quick-card" type="button" data-action="tab" data-tab="journal">
                        <span>Journal</span>
                        <strong>Look back softly</strong>
                    </button>
                    <button class="quick-card" type="button" data-action="tab" data-tab="challenges">
                        <span>Challenge</span>
                        <strong>Keep finding you</strong>
                    </button>
                </section>

                <article class="panel compact-panel">
                    <p class="eyebrow">Latest check-in</p>
                    ${renderTodaySummary(checkIn)}
                </article>

                <article class="panel compact-panel">
                    <p class="eyebrow">Encouragement</p>
                    <h2>You are allowed to begin small.</h2>
                    <p class="section-copy">One honest check-in, one reset, one tiny promise. That counts here.</p>
                </article>

                <article class="panel compact-panel">
                    <p class="eyebrow">Saved reflection</p>
                    ${renderReflectionSummary(reflection)}
                </article>

                <div class="home-footer">
                    <span>Early preview</span>
                    ${renderFeedbackLink()}
                </div>
            </section>
        `;
    };

    const renderBottomNav = () => {
        const tabs = [
            ['home', 'Home'],
            ['village', 'Village'],
            ['challenges', 'Challenges'],
            ['vault', 'Vault'],
            ['profile', 'Profile']
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
        const hasTesterCode = MessState.isTesterCodeAllowed(activeTesterCode, MessData.allowedTesterCodes);
        const onboarded = state.onboardingCompleted === true;

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
                    ${hasTesterCode ? (onboarded ? renderTabContent({ checkIn, reflection, resetCount }) : renderOnboarding()) : renderTesterGate()}
                </main>

                ${hasTesterCode && onboarded ? renderBottomNav() : ''}
            </div>
        `;
    };

    document.addEventListener('submit', (event) => {
        const form = event.target.closest('form[data-form]');
        if (!form) return;
        event.preventDefault();
        const formData = new FormData(form);

        if (form.dataset.form === 'tester-code') {
            const result = MessState.acceptTesterCode(formData.get('testerCode'), MessData.allowedTesterCodes);
            if (!result.accepted) {
                ui.testerCodeError = 'That tester code is not on the preview list. Check the code and try again.';
                render();
                return;
            }

            activeTesterCode = result.code;
            ui.testerCodeError = '';
            ui.activeTab = 'home';
            MessStorage.saveActiveTesterCode(activeTesterCode);
            state = MessStorage.loadState(MessState.createInitialState(), activeTesterCode);
            render();
            return;
        }

        if (form.dataset.form === 'check-in') {
            saveAndRender(MessState.addCheckIn(state, {
                mood: formData.get('mood'),
                needToday: formData.get('needToday'),
                feelsHeavy: formData.get('feelsHeavy'),
                nextStep: formData.get('nextStep')
            }));
        }

        if (form.dataset.form === 'village-note') {
            saveAndRender(MessState.addVillageNote(state, {
                category: formData.get('category'),
                prompt: formData.get('prompt'),
                body: formData.get('body')
            }));
            return;
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

        if (button.dataset.action === 'finish-onboarding') {
            ui.activeTab = button.dataset.nextTab || 'home';
            saveAndRender(MessState.completeOnboarding(state));
            return;
        }

        if (button.dataset.action === 'replay-onboarding') {
            saveAndRender(MessState.resetOnboarding(state));
            return;
        }

        if (button.dataset.action === 'switch-tester') {
            activeTesterCode = '';
            ui.activeTab = 'home';
            ui.testerCodeError = '';
            state = MessState.createInitialState();
            MessStorage.clearActiveTesterCode();
            render();
            return;
        }

        if (button.dataset.action === 'reset-tester-data') {
            if (!window.confirm('Reset local data for this tester code only? Other tester codes will not be changed.')) return;
            state = MessState.createInitialState();
            MessStorage.clearState(activeTesterCode);
            render();
            return;
        }

        if (button.dataset.action === 'delete-village-note') {
            if (!window.confirm('Delete this private Village note?')) return;
            saveAndRender(MessState.deleteVillageNote(state, button.dataset.id));
            return;
        }

        if (button.dataset.action === 'vault-filter') {
            ui.vaultCategory = button.dataset.category || 'All';
            render();
            return;
        }

        if (button.dataset.action === 'complete-reset') {
            saveAndRender(MessState.recordResetSession(state));
        }

        if (button.dataset.action === 'favorite') {
            saveAndRender(MessState.toggleResourceFavorite(state, button.dataset.id, vaultResourceIds()));
        }

        if (button.dataset.action === 'complete-resource') {
            saveAndRender(MessState.toggleResourceComplete(state, button.dataset.id, vaultResourceIds()));
        }

        if (button.dataset.action === 'challenge-day') {
            saveAndRender(MessState.toggleChallengeDay(
                state,
                MessData.starterChallenge.id,
                button.dataset.id,
                challengeDayIds()
            ));
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
