# Guided setup wizard (approved 2026-10-27)
Goal: first-time users answer three questions before seeing results, instead of facing six inputs at once.
- Steps: 1 Income, 2 Bills (rent, food, utilities, EMIs), 3 Savings (presets 10/20/30%, slider 0-40%) -> results.
- New users start from an empty budget; "Skip, use sample numbers" loads the sample budget. Saved/returning users land on results.
- "Edit answers step by step" on the results page reopens the wizard with their numbers.
- Data flow: wizard writes through `useBudget` (same persistence + advisor context). `onboarded` flag is saved only once finished.
- A11y: progressbar, focus moves to each step heading, Enter advances, 44px targets. Tests: vitest on `calculateBudget`.
Theme "Ledger Ink": ink-blue #1e3a8a, saffron #f59e0b, paper #fbf8f3, Fraunces + Figtree.
