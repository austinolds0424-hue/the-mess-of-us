const test = require('node:test');
const assert = require('node:assert/strict');
const {
    STORAGE_VERSION,
    addCheckIn,
    createInitialState,
    createCheckIn,
    getTodayLatestCheckIn,
    listCheckIns,
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
    assert.deepEqual(state.checkIns, []);
    assert.deepEqual(state.reflections, {});
    assert.deepEqual(state.resetSessions, []);
    assert.deepEqual(state.favorites, []);
    assert.deepEqual(state.completedResources, []);
    assert.deepEqual(state.challengeProgress, {});
});

test('normalizeState repairs invalid saved state', () => {
    const state = normalizeState({ favorites: ['a', 'a', ''], checkIns: null }, fixedDate);

    assert.deepEqual(state.favorites, ['a']);
    assert.deepEqual(state.checkIns, []);
    assert.equal(state.version, STORAGE_VERSION);
});

test('createCheckIn builds a valid check-in entry', () => {
    const checkIn = createCheckIn({
        mood: ' Overwhelmed ',
        needToday: ' Drink water first. ',
        feelsHeavy: 'The morning pileup.',
        nextStep: 'Fill my cup.'
    }, fixedDate);

    assert.equal(checkIn.date, '2026-06-08');
    assert.equal(checkIn.mood, 'Overwhelmed');
    assert.equal(checkIn.needToday, 'Drink water first.');
    assert.equal(checkIn.nextStep, 'Fill my cup.');
});

test('createCheckIn safely returns null for empty check-in data', () => {
    assert.equal(createCheckIn({}, fixedDate), null);
});

test('addCheckIn preserves existing state when adding a check-in', () => {
    const initial = toggleFavorite(createInitialState(fixedDate), 'three-breath-reset', fixedDate);
    const state = addCheckIn(initial, {
        mood: 'Hopeful',
        needToday: 'A quiet start.'
    }, fixedDate);

    assert.deepEqual(state.favorites, ['three-breath-reset']);
    assert.equal(state.checkIns.length, 1);
    assert.equal(state.checkIns[0].mood, 'Hopeful');
});

test('addCheckIn safely ignores empty check-in data', () => {
    const initial = createInitialState(fixedDate);
    const state = addCheckIn(initial, {}, fixedDate);

    assert.deepEqual(state, initial);
});

test('listCheckIns sorts latest check-ins first', () => {
    const firstDate = new Date('2026-06-08T09:00:00.000Z');
    const secondDate = new Date('2026-06-08T18:00:00.000Z');
    const first = addCheckIn(createInitialState(firstDate), { mood: 'Stuck' }, firstDate);
    const second = addCheckIn(first, { mood: 'Okay, but tired' }, secondDate);

    assert.deepEqual(listCheckIns(second).map((entry) => entry.mood), ['Okay, but tired', 'Stuck']);
});

test('getTodayLatestCheckIn returns today latest saved check-in', () => {
    const yesterday = new Date('2026-06-07T20:00:00.000Z');
    const morning = new Date('2026-06-08T08:00:00.000Z');
    const evening = new Date('2026-06-08T21:00:00.000Z');
    const withYesterday = addCheckIn(createInitialState(yesterday), { mood: 'Exhausted' }, yesterday);
    const withMorning = addCheckIn(withYesterday, { mood: 'Hopeful' }, morning);
    const withEvening = addCheckIn(withMorning, { mood: 'Okay, but tired' }, evening);

    assert.equal(getTodayLatestCheckIn(withEvening, morning).mood, 'Okay, but tired');
});

test('saveCheckIn remains an alias for adding a check-in', () => {
    const state = saveCheckIn(createInitialState(fixedDate), {
        feeling: ' Overwhelmed ',
        intention: ' Drink water first. '
    }, fixedDate);

    assert.equal(state.checkIns[0].mood, 'Overwhelmed');
    assert.equal(state.checkIns[0].needToday, 'Drink water first.');
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
