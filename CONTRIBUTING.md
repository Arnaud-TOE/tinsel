# Contributing to Tinsel

Thanks for helping fewer gifts end up in the bin.

## Getting set up

Follow **Run it locally** in the [README](README.md): a PayPal sandbox app, a Channel3 key, `npm install`, `npm run dev`.

## Before you open a pull request

```bash
npm run lint
npm run typecheck
npm test
```

CI runs the same three checks on every push, and a pre-push hook runs them first.

## Ground rules

- **Sandbox only.** Never commit a key, a secret or a real person's data. Configuration lives in `.env.local`, which git ignores.
- **The model never learns who drew whom.** Anything a tool tells it about a slot goes through `anonymousRecipient`, and the tests check for names.
- **No tool names an amount.** The charge route takes the price from Channel3 and the ceiling from PayPal.
- **New agent tools** go in `lib/exchange/tools.ts` as plain functions, with tests.
- **Small, focused changes** with a clear commit message are easiest to review.

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md).
