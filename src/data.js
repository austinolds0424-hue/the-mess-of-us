(function (global) {
    const moodChoices = [
        'Overwhelmed',
        'Exhausted',
        'Hopeful',
        'Stuck',
        'Okay, but tired'
    ];

    const checkInPrompts = [
        {
            id: 'needToday',
            label: 'What do you need today?'
        },
        {
            id: 'feelsHeavy',
            label: 'What feels heavy right now?'
        },
        {
            id: 'nextStep',
            label: 'What is one small thing you can do next?'
        }
    ];

    const resetSteps = [
        {
            title: 'Breathe',
            description: 'Take three slow breaths and let your shoulders drop.'
        },
        {
            title: 'Name what is real',
            description: 'Say what is happening without judging yourself for it.'
        },
        {
            title: 'Choose one next step',
            description: 'Pick one small thing you can do in the next few minutes.'
        }
    ];

    const vaultResources = [
        {
            id: 'three-minute-reset',
            title: '3-Minute Reset',
            category: 'Reset',
            time: '3 min',
            description: 'A tiny pause for the moment before everything spills over.',
            prompt: 'What changed in your body after three slower breaths?'
        },
        {
            id: 'what-do-i-need-today',
            title: 'What Do I Need Today?',
            category: 'Reflection',
            time: '4 min',
            description: 'A simple check-in for naming the support, space, or care you need.',
            prompt: 'If you could ask for one thing without apologizing, what would it be?'
        },
        {
            id: 'roles-vs-me',
            title: 'Roles vs Me',
            category: 'Identity',
            time: '8 min',
            description: 'A gentle prompt to separate who you are from everything you carry.',
            prompt: 'What part of you exists outside the jobs, roles, and responsibilities?'
        },
        {
            id: 'tiny-win-list',
            title: 'The Tiny Win List',
            category: 'Confidence',
            time: '5 min',
            description: 'A confidence builder for noticing the small things you are already doing.',
            prompt: 'What are three tiny wins you would normally dismiss?'
        },
        {
            id: 'when-i-feel-invisible',
            title: 'When I Feel Invisible',
            category: 'Overwhelm',
            time: '6 min',
            description: 'A grounding reflection for the moments when nobody seems to notice you.',
            prompt: 'What do you wish someone could see about your day?'
        },
        {
            id: 'before-i-burn-out',
            title: 'Before I Burn Out',
            category: 'Overwhelm',
            time: '7 min',
            description: 'A quiet way to spot the early signals and choose one protective next step.',
            prompt: 'What is one boundary or pause that would help before you hit empty?'
        }
    ];

    const vaultCategories = ['All', 'Reset', 'Identity', 'Confidence', 'Overwhelm', 'Reflection'];

    const starterChallenge = {
        id: 'finding-yourself-again',
        title: 'Finding Yourself Again',
        description: 'A 5-day starter challenge for returning to yourself in small, honest steps.',
        days: [
            {
                id: 'day-1-heavy',
                label: 'Day 1',
                title: 'Name what feels heavy',
                body: 'Start by telling the truth about what you are carrying.',
                prompt: 'What feels heavier than it should today?'
            },
            {
                id: 'day-2-need',
                label: 'Day 2',
                title: 'Notice what you need',
                body: 'Let your needs be information, not an inconvenience.',
                prompt: 'What do you need that you keep pushing aside?'
            },
            {
                id: 'day-3-win',
                label: 'Day 3',
                title: 'Find one tiny win',
                body: 'Look for proof that you are still showing up, even imperfectly.',
                prompt: 'What small thing did you do that counts?'
            },
            {
                id: 'day-4-roles',
                label: 'Day 4',
                title: 'Remember who you are outside the roles',
                body: 'Make room for the person underneath all the doing.',
                prompt: 'What part of you wants to be remembered?'
            },
            {
                id: 'day-5-promise',
                label: 'Day 5',
                title: 'Choose one small promise',
                body: 'End with one doable promise you can keep for yourself.',
                prompt: 'What small promise would feel kind and realistic?'
            }
        ]
    };

    global.MessData = {
        moodChoices,
        checkInPrompts,
        resetSteps,
        vaultResources,
        vaultCategories,
        starterChallenge
    };

    if (typeof module !== 'undefined') {
        module.exports = {
            moodChoices,
            checkInPrompts,
            resetSteps,
            vaultResources,
            vaultCategories,
            starterChallenge
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);
