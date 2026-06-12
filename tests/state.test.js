const test = require('node:test');
const assert = require('node:assert/strict');
const {
    STORAGE_VERSION,
    addCheckIn,
    addVillageNote,
    acceptTesterCode,
    completeOnboarding,
    createInitialState,
    createCheckIn,
    createVillageNote,
    deleteVillageNote,
    getChallengeProgress,
    getProfileStats,
    getTodayLatestCheckIn,
    isTesterCodeAllowed,
    listVillageNotes,
    listCheckIns,
    normalizeState,
    normalizeTesterCode,
    saveCheckIn,
    saveReflection,
    toggleChallengeDay,
    toggleFavorite,
    toggleResourceComplete,
    toggleResourceFavorite,
    markResourceComplete,
    recordResetSession,
    resetOnboarding,
    toggleChallengeStep
} = require('../src/state.js');
const MessStorage = require('../src/storage.js');

const fixedDate = new Date('2026-06-08T12:00:00.000Z');
const allowedTesterCodes = ['MESS-LH-01', 'MESS-LH-02', 'MESS-TEST-01'];

const createLocalStorageMock = () => {
    const values = new Map();
    return {
        getItem: (key) => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
        clear: () => values.clear()
    };
};

test('createInitialState returns the expected local state shape', () => {
    const state = createInitialState(fixedDate);

    assert.equal(state.version, STORAGE_VERSION);
    assert.deepEqual(state.checkIns, []);
    assert.deepEqual(state.reflections, {});
    assert.deepEqual(state.resetSessions, []);
    assert.deepEqual(state.favorites, []);
    assert.deepEqual(state.completedResources, []);
    assert.deepEqual(state.challengeProgress, {});
    assert.deepEqual(state.villageNotes, []);
    assert.equal(state.onboardingCompleted, false);
});

test('normalizeState repairs invalid saved state', () => {
    const state = normalizeState({ favorites: ['a', 'a', ''], checkIns: null }, fixedDate);

    assert.deepEqual(state.favorites, ['a']);
    assert.deepEqual(state.checkIns, []);
    assert.equal(state.version, STORAGE_VERSION);
    assert.equal(state.onboardingCompleted, false);
});

test('createVillageNote builds a valid local village note', () => {
    const note = createVillageNote({
        category: 'Wins',
        prompt: 'What small win deserves to be seen?',
        body: 'I made the call I was avoiding.'
    }, fixedDate);

    assert.equal(note.category, 'Wins');
    assert.equal(note.prompt, 'What small win deserves to be seen?');
    assert.equal(note.body, 'I made the call I was avoiding.');
    assert.equal(note.createdAt, fixedDate.toISOString());
});

test('createVillageNote safely returns null for empty note body', () => {
    assert.equal(createVillageNote({ category: 'Wins', body: '   ' }, fixedDate), null);
});

test('listVillageNotes sorts newest village notes first', () => {
    const firstDate = new Date('2026-06-08T09:00:00.000Z');
    const secondDate = new Date('2026-06-08T18:00:00.000Z');
    const first = addVillageNote(createInitialState(firstDate), {
        category: 'Coffee Chat',
        prompt: 'What do you wish someone understood today?',
        body: 'The morning was a lot.'
    }, firstDate);
    const second = addVillageNote(first, {
        category: 'Wins',
        prompt: 'What small win deserves to be seen?',
        body: 'I took a real lunch.'
    }, secondDate);

    assert.deepEqual(listVillageNotes(second).map((note) => note.body), ['I took a real lunch.', 'The morning was a lot.']);
});

test('deleteVillageNote removes a saved village note', () => {
    const state = addVillageNote(createInitialState(fixedDate), {
        category: 'Ask the Village',
        prompt: 'What would you ask the village if they were here?',
        body: 'How do you ask for help without spiraling?'
    }, fixedDate);
    const removed = deleteVillageNote(state, state.villageNotes[0].id, fixedDate);

    assert.deepEqual(removed.villageNotes, []);
});

test('village notes preserve check-ins, vault state, and challenge progress', () => {
    const checkedIn = addCheckIn(createInitialState(fixedDate), { mood: 'Hopeful' }, fixedDate);
    const favorited = toggleResourceFavorite(checkedIn, 'roles-vs-me', ['roles-vs-me'], fixedDate);
    const challenged = toggleChallengeDay(favorited, 'finding-yourself-again', 'day-1-heavy', ['day-1-heavy'], fixedDate);
    const withNote = addVillageNote(challenged, {
        category: 'Coffee Chat',
        prompt: 'What do you wish someone understood today?',
        body: 'I need softer mornings.'
    }, fixedDate);

    assert.equal(withNote.checkIns.length, 1);
    assert.deepEqual(withNote.favorites, ['roles-vs-me']);
    assert.deepEqual(withNote.challengeProgress['finding-yourself-again'], ['day-1-heavy']);
    assert.equal(withNote.villageNotes.length, 1);
});

test('valid tester code is accepted case-insensitively and normalized', () => {
    const result = acceptTesterCode(' mess-lh-01 ', allowedTesterCodes);

    assert.equal(result.accepted, true);
    assert.equal(result.code, 'MESS-LH-01');
    assert.equal(normalizeTesterCode(' mess-test-01 '), 'MESS-TEST-01');
    assert.equal(isTesterCodeAllowed('mess-lh-02', allowedTesterCodes), true);
});

test('invalid tester code is rejected', () => {
    const result = acceptTesterCode('mess-nope', allowedTesterCodes);

    assert.equal(result.accepted, false);
    assert.equal(result.code, 'MESS-NOPE');
});

test('namespaced storage key is derived safely', () => {
    assert.equal(MessStorage.getStateKey(' mess-lh-01 '), 'the-mess-of-us:state:MESS-LH-01');
    assert.equal(MessStorage.getStateKey(''), MessStorage.LEGACY_STORAGE_KEY);
});

test('state for one tester does not overwrite another tester', () => {
    const originalStorage = global.localStorage;
    global.localStorage = createLocalStorageMock();

    try {
        const testerOne = addCheckIn(createInitialState(fixedDate), { mood: 'Hopeful' }, fixedDate);
        const testerTwo = addCheckIn(createInitialState(fixedDate), { mood: 'Stuck' }, fixedDate);

        MessStorage.saveState(testerOne, 'MESS-LH-01');
        MessStorage.saveState(testerTwo, 'MESS-LH-02');

        assert.equal(MessStorage.loadState(createInitialState(fixedDate), 'MESS-LH-01').checkIns[0].mood, 'Hopeful');
        assert.equal(MessStorage.loadState(createInitialState(fixedDate), 'MESS-LH-02').checkIns[0].mood, 'Stuck');
    } finally {
        global.localStorage = originalStorage;
    }
});

test('switching tester code does not delete tester data', () => {
    const originalStorage = global.localStorage;
    global.localStorage = createLocalStorageMock();

    try {
        const testerState = addCheckIn(createInitialState(fixedDate), { mood: 'Hopeful' }, fixedDate);
        MessStorage.saveActiveTesterCode('MESS-LH-01');
        MessStorage.saveState(testerState, 'MESS-LH-01');
        MessStorage.clearActiveTesterCode();

        assert.equal(MessStorage.loadActiveTesterCode(allowedTesterCodes), '');
        assert.equal(MessStorage.loadState(createInitialState(fixedDate), 'MESS-LH-01').checkIns[0].mood, 'Hopeful');
    } finally {
        global.localStorage = originalStorage;
    }
});

test('onboarding defaults to incomplete for new state', () => {
    const state = createInitialState(fixedDate);

    assert.equal(state.onboardingCompleted, false);
});

test('completeOnboarding marks onboarding complete', () => {
    const state = completeOnboarding(createInitialState(fixedDate), fixedDate);

    assert.equal(state.onboardingCompleted, true);
});

test('resetOnboarding marks onboarding incomplete for replay', () => {
    const completed = completeOnboarding(createInitialState(fixedDate), fixedDate);
    const replay = resetOnboarding(completed, fixedDate);

    assert.equal(replay.onboardingCompleted, false);
});

test('onboarding changes preserve existing local progress', () => {
    const allowedResources = ['three-minute-reset'];
    const allowedDays = ['day-1-heavy'];
    const checkedIn = addCheckIn(createInitialState(fixedDate), { mood: 'Hopeful' }, fixedDate);
    const favorited = toggleResourceFavorite(checkedIn, 'three-minute-reset', allowedResources, fixedDate);
    const challenged = toggleChallengeDay(favorited, 'finding-yourself-again', 'day-1-heavy', allowedDays, fixedDate);
    const onboarded = completeOnboarding(challenged, fixedDate);
    const replay = resetOnboarding(onboarded, fixedDate);

    assert.equal(replay.checkIns.length, 1);
    assert.deepEqual(replay.favorites, ['three-minute-reset']);
    assert.deepEqual(replay.challengeProgress['finding-yourself-again'], ['day-1-heavy']);
    assert.equal(replay.onboardingCompleted, false);
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

test('toggleResourceFavorite safely toggles a known Vault resource', () => {
    const allowed = ['three-minute-reset'];
    const initial = createInitialState(fixedDate);
    const saved = toggleResourceFavorite(initial, 'three-minute-reset', allowed, fixedDate);
    const removed = toggleResourceFavorite(saved, 'three-minute-reset', allowed, fixedDate);

    assert.deepEqual(saved.favorites, ['three-minute-reset']);
    assert.deepEqual(removed.favorites, []);
});

test('toggleResourceFavorite ignores unknown resource ids', () => {
    const initial = createInitialState(fixedDate);
    const state = toggleResourceFavorite(initial, 'unknown-resource', ['three-minute-reset'], fixedDate);

    assert.deepEqual(state, initial);
});

test('markResourceComplete records a resource only once', () => {
    const initial = createInitialState(fixedDate);
    const once = markResourceComplete(initial, 'roles-vs-me', fixedDate);
    const twice = markResourceComplete(once, 'roles-vs-me', fixedDate);

    assert.deepEqual(twice.completedResources, ['roles-vs-me']);
});

test('toggleResourceComplete safely toggles a known Vault resource', () => {
    const allowed = ['before-i-burn-out'];
    const initial = createInitialState(fixedDate);
    const complete = toggleResourceComplete(initial, 'before-i-burn-out', allowed, fixedDate);
    const incomplete = toggleResourceComplete(complete, 'before-i-burn-out', allowed, fixedDate);

    assert.deepEqual(complete.completedResources, ['before-i-burn-out']);
    assert.deepEqual(incomplete.completedResources, []);
});

test('toggleResourceComplete preserves check-ins while updating Vault state', () => {
    const checkedIn = addCheckIn(createInitialState(fixedDate), {
        mood: 'Hopeful',
        nextStep: 'Drink coffee slowly.'
    }, fixedDate);
    const state = toggleResourceComplete(checkedIn, 'tiny-win-list', ['tiny-win-list'], fixedDate);

    assert.equal(state.checkIns.length, 1);
    assert.equal(state.checkIns[0].nextStep, 'Drink coffee slowly.');
    assert.deepEqual(state.completedResources, ['tiny-win-list']);
});

test('toggleResourceComplete ignores unknown resource ids', () => {
    const initial = createInitialState(fixedDate);
    const state = toggleResourceComplete(initial, 'unknown-resource', ['tiny-win-list'], fixedDate);

    assert.deepEqual(state, initial);
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

test('toggleChallengeDay completes a starter challenge day', () => {
    const allowed = ['day-1-heavy', 'day-2-need'];
    const initial = createInitialState(fixedDate);
    const state = toggleChallengeDay(initial, 'finding-yourself-again', 'day-1-heavy', allowed, fixedDate);

    assert.deepEqual(state.challengeProgress['finding-yourself-again'], ['day-1-heavy']);
});

test('toggleChallengeDay ignores unknown day ids', () => {
    const initial = createInitialState(fixedDate);
    const state = toggleChallengeDay(initial, 'finding-yourself-again', 'missing-day', ['day-1-heavy'], fixedDate);

    assert.deepEqual(state, initial);
});

test('getChallengeProgress counts completed known days only', () => {
    const allowed = ['day-1-heavy', 'day-2-need', 'day-3-win'];
    const withFirst = toggleChallengeDay(createInitialState(fixedDate), 'finding-yourself-again', 'day-1-heavy', allowed, fixedDate);
    const withSecond = toggleChallengeDay(withFirst, 'finding-yourself-again', 'day-2-need', allowed, fixedDate);
    const progress = getChallengeProgress(withSecond, 'finding-yourself-again', allowed, fixedDate);

    assert.equal(progress.completed, 2);
    assert.equal(progress.total, 3);
    assert.deepEqual(progress.completedIds, ['day-1-heavy', 'day-2-need']);
});

test('getProfileStats calculates local profile totals', () => {
    const allowedResources = ['three-minute-reset', 'roles-vs-me'];
    const allowedDays = ['day-1-heavy', 'day-2-need', 'day-3-win'];
    const checkedIn = addCheckIn(createInitialState(fixedDate), {
        mood: 'Hopeful',
        needToday: 'A clear table.'
    }, fixedDate);
    const favorited = toggleResourceFavorite(checkedIn, 'three-minute-reset', allowedResources, fixedDate);
    const completed = toggleResourceComplete(favorited, 'roles-vs-me', allowedResources, fixedDate);
    const challenged = toggleChallengeDay(completed, 'finding-yourself-again', 'day-1-heavy', allowedDays, fixedDate);

    const stats = getProfileStats(challenged, {
        resourceIds: allowedResources,
        challengeId: 'finding-yourself-again',
        challengeDayIds: allowedDays
    }, fixedDate);

    assert.equal(stats.checkInsCompleted, 1);
    assert.equal(stats.villageNotes, 0);
    assert.equal(stats.vaultFavorites, 1);
    assert.equal(stats.vaultCompletions, 1);
    assert.equal(stats.challengeCompleted, 1);
    assert.equal(stats.challengeTotal, 3);
    assert.equal(stats.challengePercent, 33);
});

test('getProfileStats safely handles unknown and empty state', () => {
    const stats = getProfileStats(null, {}, fixedDate);

    assert.deepEqual(stats, {
        checkInsCompleted: 0,
        vaultFavorites: 0,
        vaultCompletions: 0,
        villageNotes: 0,
        challengeCompleted: 0,
        challengeTotal: 0,
        challengePercent: 0
    });
});
