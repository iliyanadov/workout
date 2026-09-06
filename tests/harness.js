/* Loads the real index.html + app.js into jsdom with a frozen clock, so a test can
   drive the app the way a thumb does: real click and input events at real elements. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const APP = path.resolve(__dirname, "..");

function boot({ now = "2026-09-07T09:00:00", days = null, run = null, online = false, local = {} } = {}) {
  const html = fs.readFileSync(APP + "/index.html", "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true,
                                url: "https://x.test/workout/" });
  const w = dom.window;

  let clock = new Date(now).getTime();
  const RealDate = w.Date;
  class FakeDate extends RealDate {
    constructor(...a) { if (!a.length) super(clock); else super(...a); }
    static now() { return clock; }
  }
  w.Date = FakeDate;
  w.advance = ms => { clock += ms; };

  // jsdom's localStorage and navigator.onLine are read-only properties: assigning
  // to them silently does nothing, which once made a test pass for the wrong reason.
  try { w.localStorage.clear(); } catch (e) {}
  if (days) w.localStorage.setItem("workout.v2", JSON.stringify({ v: 2, days, pending: {} }));
  if (run) w.localStorage.setItem("workout.run.v1", JSON.stringify(run));
  Object.keys(local).forEach(k => w.localStorage.setItem(k, local[k]));
  Object.defineProperty(w.navigator, "onLine", { value: online, configurable: true });

  w.scrollTo = () => {};                 // jsdom has no layout; the app calls it on tab change
  if (!w.Element.prototype.scrollIntoView) w.Element.prototype.scrollIntoView = function () {};
  w.fetch = () => Promise.reject(new Error("no network in the harness"));
  w.crypto = { subtle: { digest: () => Promise.resolve(new ArrayBuffer(32)) } };
  w.TextEncoder = require("util").TextEncoder;
  w.AudioContext = function () {
    return { state: "running", currentTime: 0, resume() {},
      createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: {}, type: "" }),
      createGain: () => ({ connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }),
      destination: {} };
  };
  w.CONFIG = { url: "https://x.test", anonKey: "k", blockStart: "2026-09-07", salt: "s" };
  const sbStub = {
    auth: { getSession: () => Promise.resolve({ data: {} }),
            signInWithPassword: () => Promise.resolve({ error: { message: "offline" } }),
            signOut: () => Promise.resolve({}) },
    from: () => ({ upsert: () => Promise.resolve({ error: null }),
                   select: () => ({ gte: () => Promise.resolve({ data: [] }) }) })
  };
  w.supabase = { createClient: () => sbStub };

  w.eval(fs.readFileSync(APP + "/app.js", "utf8"));
  const doc = w.document;

  const api = {
    dom, w, doc,
    txt: el => (el ? el.textContent.replace(/\s+/g, " ").trim() : null),
    all: sel => [...doc.querySelectorAll(sel)],
    one: sel => doc.querySelector(sel),
    store: () => JSON.parse(w.localStorage.getItem("workout.v2") || "null"),
    dayRec: d => (api.store() || { days: {} }).days[d] || null,
    exRec: (d, id) => ((api.dayRec(d) || { ex: {} }).ex || {})[id] || null,
    runState: () => JSON.parse(w.localStorage.getItem("workout.run.v1") || "null"),

    tap(selOrEl, match) {
      const el = typeof selOrEl === "string"
        ? api.all(selOrEl).find(e => match == null || api.txt(e).includes(match))
        : selOrEl;
      if (!el) throw new Error("nothing to tap: " + selOrEl + (match ? " ~ " + match : ""));
      el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      return el;
    },
    type(selOrEl, value) {
      const el = typeof selOrEl === "string" ? api.one(selOrEl) : selOrEl;
      if (!el) throw new Error("no field: " + selOrEl);
      el.value = String(value);
      el.dispatchEvent(new w.Event("input", { bubbles: true }));
      return el;
    },
    tab: name => api.tap("#tab-" + name),

    /* jsdom's localStorage/navigator members are read-only: a plain assignment
       silently does nothing and the test then passes for the wrong reason.
       Go through the prototype. */
    breakStorage() {
      w.Storage.prototype.setItem = function () { throw new Error("QuotaExceededError"); };
      return api;
    },

    /* --- session driving --- */
    start() { api.tap(".card.start .runbtn"); return api; },
    warmup(skip) {
      if (skip) { const s = api.all(".card.warm .quietbtn")[0]; if (s) api.tap(s); return api; }
      let g = 0;
      while (api.one(".card.warm") && g++ < 8) {
        const b = api.all(".card.warm .runbtn")[0];
        if (!b) break;
        api.tap(b);
      }
      return api;
    },
    openName: () => api.txt(api.one(".card.open .cardname")),
    hero: () => api.txt(api.one(".card.open .hero")),
    load: () => (api.one(".card.open .winput") || {}).value,
    logBtn: () => api.all(".card.open .runbtn").find(b => /Done — log/.test(api.txt(b))),
    /* answer: 'held' | 'failed' | a number */
    logSet(answer) {
      const b = api.logBtn();
      if (!b) throw new Error("no log button on " + api.openName());
      api.tap(b);
      const opts = api.all("#padgrid .bigopt");
      if (opts.length) { api.tap(opts[answer === "failed" ? 1 : 0]); return api; }
      const nums = api.all("#padgrid .padbtn");
      const target = typeof answer === "number"
        ? nums.find(n => api.txt(n) === String(answer))
        : api.all("#padgrid .padbtn.inrange")[0] || nums[0];
      api.tap(target);
      const q = api.all("#padgrid .bigopt");
      if (q.length) api.tap(q[answer === "failed" ? (q.length > 2 ? 2 : 0) : (q.length > 2 ? 1 : 0)]);
      return api;
    },
    skipRest() {
      const s = api.all(".card.open .quietbtn").find(b => /Skip rest|Clear/.test(api.txt(b)));
      if (s && api.one(".restpanel")) api.tap(s);
      return api;
    },
    setWeightIfAsked(v) {
      if (api.all(".card.open .runbtn").some(b => /Set a weight first/.test(api.txt(b)))) {
        api.type(".card.open .winput", v == null ? 40 : v);
      }
      return api;
    }
  };
  return api;
}
module.exports = { boot };
