# The Mess of Us

The Mess of Us is a static-first personal reset app for overwhelmed moms.

Tagline: Where Chaos Is Welcome and the Coffee Is Always On

This first version is intentionally small. It is a warm daily dashboard with a check-in prompt, a 3-minute reset entry point, evening reflection, Vault previews, one starter challenge, and local progress state.

## Current Scope

- Static HTML, CSS, and vanilla JavaScript
- Local state saved in `localStorage`
- No backend
- No Firebase
- No Stripe
- No login
- No real community feed
- No dependencies or build system yet

## Project Structure

```text
index.html
src/
  app.js       DOM rendering and events
  data.js      Static Vault and challenge content
  state.js     Pure state/domain logic
  storage.js   localStorage helpers
tests/
  state.test.js
```

## Checks

Run these from the project root:

```powershell
node --check src/app.js
node --check src/state.js
node --check src/storage.js
node --check src/data.js
node --test tests/*.test.js
```
