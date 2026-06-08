(function (global) {
    const vaultResources = [
        {
            id: 'three-breath-reset',
            title: 'Three Breath Reset',
            category: 'Resets',
            time: '3 min',
            description: 'A tiny pause for the moment before everything spills over.'
        },
        {
            id: 'roles-vs-me',
            title: 'Roles vs. Me',
            category: 'Self Discovery',
            time: '8 min',
            description: 'A gentle prompt to separate who you are from everything you carry.'
        },
        {
            id: 'one-good-enough-plan',
            title: 'One Good Enough Plan',
            category: 'Planning',
            time: '5 min',
            description: 'Choose one small next step without turning today into a project.'
        }
    ];

    const starterChallenge = {
        id: 'five-day-soft-reset',
        title: '5 Day Soft Reset',
        description: 'Five small check-ins for coming back to yourself without pressure.',
        steps: [
            'Notice what feels loud today.',
            'Name one thing you need.',
            'Take a three-minute reset.',
            'Write one honest sentence.',
            'Choose one small act of care.'
        ]
    };

    global.MessData = { vaultResources, starterChallenge };

    if (typeof module !== 'undefined') {
        module.exports = { vaultResources, starterChallenge };
    }
})(typeof window !== 'undefined' ? window : globalThis);
