(function (global) {
    const LEGACY_STORAGE_KEY = 'the-mess-of-us:v1';
    const ACTIVE_TESTER_KEY = 'the-mess-of-us:activeTesterCode';
    const STATE_KEY_PREFIX = 'the-mess-of-us:state:';

    const normalizeTesterCode = (testerCode) => global.MessState.normalizeTesterCode(testerCode);

    const getStateKey = (testerCode) => {
        const code = normalizeTesterCode(testerCode);
        return code ? `${STATE_KEY_PREFIX}${code}` : LEGACY_STORAGE_KEY;
    };

    const loadActiveTesterCode = (allowedCodes = []) => {
        if (!global.localStorage) return '';

        try {
            const saved = normalizeTesterCode(global.localStorage.getItem(ACTIVE_TESTER_KEY));
            return global.MessState.isTesterCodeAllowed(saved, allowedCodes) ? saved : '';
        } catch (error) {
            console.warn('The Mess of Us tester code could not be loaded.', error.message);
            return '';
        }
    };

    const saveActiveTesterCode = (testerCode) => {
        if (!global.localStorage) return;

        try {
            global.localStorage.setItem(ACTIVE_TESTER_KEY, normalizeTesterCode(testerCode));
        } catch (error) {
            console.warn('The Mess of Us tester code could not be saved.', error.message);
        }
    };

    const clearActiveTesterCode = () => {
        if (!global.localStorage) return;

        try {
            global.localStorage.removeItem(ACTIVE_TESTER_KEY);
        } catch (error) {
            console.warn('The Mess of Us tester code could not be cleared.', error.message);
        }
    };

    const loadState = (fallbackState, testerCode = '') => {
        if (!global.localStorage) return fallbackState;

        try {
            const saved = global.localStorage.getItem(getStateKey(testerCode));
            if (!saved) return fallbackState;
            return global.MessState.normalizeState(JSON.parse(saved));
        } catch (error) {
            console.warn('The Mess of Us state could not be loaded.', error.message);
            return fallbackState;
        }
    };

    const saveState = (state, testerCode = '') => {
        if (!global.localStorage) return;

        try {
            global.localStorage.setItem(getStateKey(testerCode), JSON.stringify(state));
        } catch (error) {
            console.warn('The Mess of Us state could not be saved.', error.message);
        }
    };

    const clearState = (testerCode = '') => {
        if (!global.localStorage) return;

        try {
            global.localStorage.removeItem(getStateKey(testerCode));
        } catch (error) {
            console.warn('The Mess of Us state could not be cleared.', error.message);
        }
    };

    const api = {
        STORAGE_KEY: LEGACY_STORAGE_KEY,
        LEGACY_STORAGE_KEY,
        ACTIVE_TESTER_KEY,
        STATE_KEY_PREFIX,
        getStateKey,
        loadActiveTesterCode,
        saveActiveTesterCode,
        clearActiveTesterCode,
        loadState,
        saveState,
        clearState
    };
    global.MessStorage = api;

    if (typeof module !== 'undefined') {
        module.exports = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
