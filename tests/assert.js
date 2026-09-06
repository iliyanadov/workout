/* A test fails by throwing. Every assertion says what it expected and what it got,
   because a failure four months from now has to be readable without the author. */
class Fail extends Error {}

function fail(msg, expected, actual) {
  throw new Fail(msg + "\n      expected: " + JSON.stringify(expected) +
                       "\n      actual:   " + JSON.stringify(actual));
}

const eq = (actual, expected, msg) => {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) fail(msg || "not equal", expected, actual);
};
const ok = (v, msg) => { if (!v) fail(msg || "expected truthy", true, v); };
const no = (v, msg) => { if (v) fail(msg || "expected falsy", false, v); };
const near = (actual, expected, tol, msg) => {
  if (typeof actual !== "number" || Math.abs(actual - expected) > (tol == null ? 0.001 : tol))
    fail(msg || "not within tolerance", expected, actual);
};
const has = (hay, needle, msg) => {
  if (String(hay || "").indexOf(needle) < 0)
    fail(msg || "substring not found", "…" + needle + "…", hay);
};
const hasNot = (hay, needle, msg) => {
  if (String(hay || "").indexOf(needle) >= 0)
    fail(msg || "substring should be absent", "not …" + needle + "…", hay);
};
const throws = (fn, msg) => {
  try { fn(); } catch (e) { return; }
  fail(msg || "expected a throw", "throw", "no throw");
};
module.exports = { Fail, eq, ok, no, near, has, hasNot, throws };
