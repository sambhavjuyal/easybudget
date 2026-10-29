# Contributing

Thanks for helping! Small, focused pull requests are easiest to review.

1. Fork the repo and run `npm install`.
2. Make your change. Use `npm run dev` for quick UI work or `npm run desktop` to test the real app.
3. Before opening a pull request, run `npm run lint` and `npm test`. Both must pass. If you change the money math in `src/hooks/useBudget.ts`, add or update a test.
4. Keep accessibility in mind: every control needs a label, a visible focus ring and a touch target of at least 44px.

Please don't commit API keys or `.env` files.
