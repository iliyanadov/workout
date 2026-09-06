# Tests

```
cd tests && npm install && npm test        # everything
node run.js engine                         # one suite
```

Exits non-zero on any failure, so it can gate a deploy.

`harness.js` loads the real `index.html` + `app.js` into jsdom with a frozen clock and
drives the app the way a thumb does — real click and input events at real elements —
then asserts on rendered output and on `localStorage`.

## Suites

| file | covers |
|---|---|
| `dates` | anchoring, the seven-day strip, week numbering across DST and the year boundary, navigation bounds |
| `engine` | stopTarget, planned, the four judgements, layoffs, bumps, carried loads |
| `guided` | the session as a state machine, all four sessions, start to done |
| `persistence` | what is written and when, quarantine, delete/undo, export, sync honesty |
| `week-plan` | calibration, goes-up, watch, history, the weekly paste, the Plan tab |
| `regressions` | one test per defect found in the three audit rounds, named by the build that fixed it |
| `copy` | text that must be true rather than merely nice |

## What this cannot cover

Real Safari layout and safe-area insets. Real iOS behaviour: the wake lock, the audio
chime's unlock rules, the share sheet, standalone mode. The service worker. Real
Supabase. Anything about how it feels to use in a gym.

A jsdom gotcha worth knowing: `localStorage`, `navigator.onLine` and `Storage.prototype`
members are read-only on the window. Assigning to them silently does nothing and the
test then passes for the wrong reason. Go through `Object.defineProperty` or the
prototype — `harness.js` has `breakStorage()` for the common case.
