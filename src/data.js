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

    const villageCategories = [
        {
            id: 'coffee-chat',
            title: 'Coffee Chat',
            description: 'Light conversation starters for the moments when you just want company.'
        },
        {
            id: 'wins',
            title: 'Wins',
            description: 'A place to notice tiny victories, soft progress, and proof you showed up.'
        },
        {
            id: 'ask-the-village',
            title: 'Ask the Village',
            description: 'Future support threads for questions, encouragement, and shared wisdom.'
        },
        {
            id: 'challenge-discussions',
            title: 'Challenge Discussions',
            description: 'A future home for talking through challenge prompts together.'
        }
    ];

    const challengeCadences = [
        {
            id: 'daily',
            title: 'Daily Challenges',
            description: 'Short daily prompts will live here when challenge publishing is ready.'
        },
        {
            id: 'weekly',
            title: 'Weekly Challenges',
            description: 'Longer weekly themes will help members explore one need at a time.'
        },
        {
            id: 'monthly',
            title: 'Monthly Challenges',
            description: 'Monthly arcs will support deeper reflection without rushing the process.'
        }
    ];

    const profilePlaceholders = [
        'Profile photo',
        'Bio',
        'Achievements',
        'Mood tracker',
        'Water tracker',
        'Self-care tracker',
        'Goals',
        'Routines',
        'Boundaries'
    ];

    const onboardingCards = [
        {
            title: 'Welcome to The Mess of Us',
            body: 'A cozy reset space for the messy middle of real life.'
        },
        {
            title: 'Start with today',
            body: 'Check in with how you feel, what you need, and one small next step.'
        },
        {
            title: 'Find what helps',
            body: 'Use the Vault and Challenges when you need a prompt, reset tool, or gentle way back to yourself.'
        },
        {
            title: 'Come back anytime',
            body: 'The Village is a community preview for now, and your progress stays on this device.'
        }
    ];

    const feedbackLink = {
        label: 'Give feedback',
        href: 'mailto:lheariehl@gmail.com?subject=The%20Mess%20of%20Us%20Feedback&body=What%20felt%20good%3F%0A%0AWhat%20felt%20confusing%3F%0A%0AWhat%20would%20make%20you%20come%20back%3F%0A%0AAny%20other%20thoughts%3F'
    };

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
        villageCategories,
        challengeCadences,
        profilePlaceholders,
        onboardingCards,
        feedbackLink,
        starterChallenge
    };

    if (typeof module !== 'undefined') {
        module.exports = {
            moodChoices,
            checkInPrompts,
            resetSteps,
            vaultResources,
            vaultCategories,
            villageCategories,
            challengeCadences,
            profilePlaceholders,
            onboardingCards,
            feedbackLink,
            starterChallenge
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);
