(function (global) {
    const STORAGE_VERSION = 1;

    const todayKey = (date = new Date()) => date.toISOString().slice(0, 10);

    const createInitialState = (date = new Date()) => ({
        version: STORAGE_VERSION,
        createdAt: date.toISOString(),
        checkIns: {},
        reflections: {},
        resetSessions: [],
        favorites: [],
        completedResources: [],
        challengeProgress: {}
    });

    const unique = (items) => Array.from(new Set(items.filter(Boolean)));

    const normalizeState = (state, date = new Date()) => {
        const initial = createInitialState(date);
        if (!state || typeof state !== 'object') return initial;

        return {
            ...initial,
            ...state,
            version: STORAGE_VERSION,
            checkIns: state.checkIns && typeof state.checkIns === 'object' ? state.checkIns : {},
            reflections: state.reflections && typeof state.reflections === 'object' ? state.reflections : {},
            resetSessions: Array.isArray(state.resetSessions) ? state.resetSessions : [],
            favorites: Array.isArray(state.favorites) ? unique(state.favorites) : [],
            completedResources: Array.isArray(state.completedResources) ? unique(state.completedResources) : [],
            challengeProgress: state.challengeProgress && typeof state.challengeProgress === 'object'
                ? state.challengeProgress
                : {}
        };
    };

    const saveCheckIn = (state, entry, date = new Date()) => {
        const current = normalizeState(state, date);
        const key = todayKey(date);
        return {
            ...current,
            checkIns: {
                ...current.checkIns,
                [key]: {
                    feeling: String(entry.feeling || '').trim(),
                    intention: String(entry.intention || '').trim(),
                    savedAt: date.toISOString()
                }
            }
        };
    };

    const saveReflection = (state, entry, date = new Date()) => {
        const current = normalizeState(state, date);
        const key = todayKey(date);
        return {
            ...current,
            reflections: {
                ...current.reflections,
                [key]: {
                    wentWell: String(entry.wentWell || '').trim(),
                    challenged: String(entry.challenged || '').trim(),
                    win: String(entry.win || '').trim(),
                    savedAt: date.toISOString()
                }
            }
        };
    };

    const toggleFavorite = (state, resourceId, date = new Date()) => {
        const current = normalizeState(state, date);
        const id = String(resourceId || '').trim();
        if (!id) return current;
        const favorites = current.favorites.includes(id)
            ? current.favorites.filter((item) => item !== id)
            : [...current.favorites, id];
        return { ...current, favorites };
    };

    const markResourceComplete = (state, resourceId, date = new Date()) => {
        const current = normalizeState(state, date);
        const id = String(resourceId || '').trim();
        if (!id || current.completedResources.includes(id)) return current;
        return { ...current, completedResources: [...current.completedResources, id] };
    };

    const recordResetSession = (state, resetId = 'three-minute-reset', date = new Date()) => {
        const current = normalizeState(state, date);
        return {
            ...current,
            resetSessions: [
                ...current.resetSessions,
                { id: resetId, completedAt: date.toISOString() }
            ]
        };
    };

    const toggleChallengeStep = (state, challengeId, stepIndex, date = new Date()) => {
        const current = normalizeState(state, date);
        const id = String(challengeId || '').trim();
        const index = Number(stepIndex);
        if (!id || !Number.isInteger(index) || index < 0) return current;

        const existing = Array.isArray(current.challengeProgress[id]) ? current.challengeProgress[id] : [];
        const next = existing.includes(index)
            ? existing.filter((item) => item !== index)
            : [...existing, index].sort((a, b) => a - b);

        return {
            ...current,
            challengeProgress: {
                ...current.challengeProgress,
                [id]: next
            }
        };
    };

    const api = {
        STORAGE_VERSION,
        todayKey,
        createInitialState,
        normalizeState,
        saveCheckIn,
        saveReflection,
        toggleFavorite,
        markResourceComplete,
        recordResetSession,
        toggleChallengeStep
    };

    global.MessState = api;

    if (typeof module !== 'undefined') {
        module.exports = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
