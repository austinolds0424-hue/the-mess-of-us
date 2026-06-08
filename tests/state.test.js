const test = require('node:test');
const assert = require('node:assert/strict');
const {
    STORAGE_VERSION,
    createInitialState,
    normalizeState,
    saveCheckIn,
    saveReflection,
    toggleFavorite,
    markResourceComplete,
    recordResetSession,
    toggleChallengeStep
} = require('../src/state.js');

const fixedDate = new Date('2026-06-08T12:00:00.000Z');

test('createInitialState returns the expected local state shape', () => {
    const state = createInitialState(fixedDate);

    assert.equal(state.version, STORAGE_VERSION);
    assert.deepEqual(state.checkIns, {});
    assert.deepEqual(state.reflections, {});
    assert.deepEqual(state.resetSessions, []);
    assert.deepEqual(state.favorites, []);
    assert.deepEqual(state.completedResources, []);
    assert.deepEqual(state.challengeProgress, {});
});

test('normalizeState repairs invalid saved state', () => {
    const state = normalizeState({ favorites: ['a', 'a', ''], checkIns: null }, fixedDate);

    assert.deepEqual(state.favorites, ['a']);
    assert.deepEqual(state.checkIns, {});
    assert.equal(state.version, STORAGE_VERSION);
});

test('saveCheckIn stores today feeling and intention', () => {
    const state = saveCheckIn(createInitialState(fixedDate), {
        feeling: ' Overwhelmed ',
        intention: ' Drink water first. '
    }, fixedDate);

    assert.equal(state.checkIns['2026-06-08'].feeling, 'Overwhelmed');
    assert.equal(state.checkIns['2026-06-08'].intention, 'Drink water first.');
});

test('saveReflection stores the evening prompts for today', () => {
    const state = saveReflection(createInitialState(fixedDate), {
        wentWell: 'We got outside.',
        challenged: 'Too much noise.',
        win: 'I asked for help.'
    }, fixedDate);

    assert.equal(state.reflections['2026-06-08'].win, 'I asked for help.');
});

test('toggleFavorite adds and removes a resource id', () => {
    const initial = createInitialState(fixedDate);
    const saved = toggleFavorite(initial, 'three-breath-reset', fixedDate);
    const removed = toggleFavorite(saved, 'three-breath-reset', fixedDate);

    assert.deepEqual(saved.favorites, ['three-breath-reset']);
    assert.deepEqual(removed.favorites, []);
});

test('markResourceComplete records a resource only once', () => {
    const initial = createInitialState(fixedDate);
    const once = markResourceComplete(initial, 'roles-vs-me', fixedDate);
    const twice = markResourceComplete(once, 'roles-vs-me', fixedDate);

    assert.deepEqual(twice.completedResources, ['roles-vs-me']);
});

test('recordResetSession appends a completed reset', () => {
    const state = recordResetSession(createInitialState(fixedDate), 'three-minute-reset', fixedDate);

    assert.equal(state.resetSessions.length, 1);
    assert.equal(state.resetSessions[0].id, 'three-minute-reset');
});

test('toggleChallengeStep keeps sorted challenge progress', () => {
    const initial = createInitialState(fixedDate);
    const second = toggleChallengeStep(initial, 'five-day-soft-reset', 2, fixedDate);
    const first = toggleChallengeStep(second, 'five-day-soft-reset', 0, fixedDate);
    const removed = toggleChallengeStep(first, 'five-day-soft-reset', 2, fixedDate);

    assert.deepEqual(first.challengeProgress['five-day-soft-reset'], [0, 2]);
    assert.deepEqual(removed.challengeProgress['five-day-soft-reset'], [0]);
});
