(function (global) {
    const STORAGE_KEY = 'the-mess-of-us:v1';

    const loadState = (fallbackState) => {
        if (!global.localStorage) return fallbackState;

        try {
            const saved = global.localStorage.getItem(STORAGE_KEY);
            if (!saved) return fallbackState;
            return global.MessState.normalizeState(JSON.parse(saved));
        } catch (error) {
            console.warn('The Mess of Us state could not be loaded.', error.message);
            return fallbackState;
        }
    };

    const saveState = (state) => {
        if (!global.localStorage) return;

        try {
            global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('The Mess of Us state could not be saved.', error.message);
        }
    };

    const api = { STORAGE_KEY, loadState, saveState };
    global.MessStorage = api;

    if (typeof module !== 'undefined') {
        module.exports = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
