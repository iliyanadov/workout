# Two In Reserve

Daily training log for a 4-day upper/lower block. Static PWA — no build step.

- `index.html` — the whole app
- `config.js` — Supabase URL + anon key (public; row-level security protects the data)
- `sw.js` — offline shell. **Bump `CACHE` on every deploy** or clients keep the old build
- `vendor/supabase.js` — vendored so the app opens with no signal

## Install on iPhone
Open the Pages URL in Safari → Share → Add to Home Screen.

## Data
One row per day in `public.days`, keyed `(user_id, day)`, payload as JSONB.
RLS restricts every row to its owner. Writes go to `localStorage` first and sync
when there is signal, so the gym never needs a connection.
