(function () {
    const { MessData, MessState, MessStorage } = window;
    const app = document.querySelector('#app');
    let state = MessStorage.loadState(MessState.createInitialState());

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

    const render = () => {
        const checkIn = state.checkIns[today()] || {};
        const reflection = state.reflections[today()] || {};
        const resetCount = state.resetSessions.length;

        app.innerHTML = `
            <section class="hero-band">
                <p class="eyebrow">Daily reset</p>
                <h1>The Mess of Us</h1>
                <p class="tagline">Where Chaos Is Welcome and the Coffee Is Always On</p>
                <p class="intro">A quiet place to pause, check in, and choose one small next step before the day swallows you.</p>
            </section>

            <section class="dashboard-grid" aria-label="Today">
                <article class="panel check-in-panel">
                    <p class="eyebrow">Morning check-in</p>
                    <h2>How are you arriving?</h2>
                    <form data-form="check-in" class="stacked-form">
                        <label>
                            Feeling
                            <select name="feeling">
                                <option value="">Choose one</option>
                                ${['Energized', 'Overwhelmed', 'Exhausted', 'Hopeful', 'Stuck'].map((feeling) => `<option value="${feeling}" ${checkIn.feeling === feeling ? 'selected' : ''}>${feeling}</option>`).join('')}
                            </select>
                        </label>
                        <label>
                            What matters most today?
                            <textarea name="intention" rows="3" placeholder="One honest sentence is enough.">${escapeHtml(checkIn.intention || '')}</textarea>
                        </label>
                        <button class="primary-button" type="submit">Save check-in</button>
                    </form>
                </article>

                <article class="panel reset-panel">
                    <p class="eyebrow">3-minute reset</p>
                    <h2>Put one hand on the day.</h2>
                    <p>Take three slower breaths. Unclench your jaw. Name one thing you can do next.</p>
                    <button class="primary-button" type="button" data-action="complete-reset">I took the reset</button>
                    <p class="quiet-note">Resets saved: ${resetCount}</p>
                </article>
            </section>

            <section class="panel reflection-panel">
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
                    <button class="primary-button" type="submit">Save reflection</button>
                </form>
            </section>

            <section class="content-grid">
                <div>
                    <p class="eyebrow">Vault preview</p>
                    <h2>Small tools for messy days</h2>
                    <div class="resource-list">${renderVaultCards()}</div>
                </div>

                <aside class="panel challenge-panel">
                    <p class="eyebrow">Starter challenge</p>
                    <h2>${escapeHtml(MessData.starterChallenge.title)}</h2>
                    <p>${escapeHtml(MessData.starterChallenge.description)}</p>
                    <div class="challenge-steps">${renderChallengeSteps()}</div>
                </aside>
            </section>
        `;
    };

    document.addEventListener('submit', (event) => {
        const form = event.target.closest('form[data-form]');
        if (!form) return;
        event.preventDefault();
        const formData = new FormData(form);

        if (form.dataset.form === 'check-in') {
            saveAndRender(MessState.saveCheckIn(state, {
                feeling: formData.get('feeling'),
                intention: formData.get('intention')
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
