const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* The calibration engine is the product. These assert its arithmetic through the
   real UI, because that is where a wrong number would actually reach the user. */
module.exports = (test) => {
  const hackDay = (r, q, extra) => ({
    "2026-09-07": { ex: { hacksquat: Object.assign(
      { w: 97.6, r, q, g: q.map((v, i) => v === 0 && i < 3) }, extra || {}) }, updatedAt: 1 }
  });
  const openOn = (when, days) => {
    const a = boot({ now: when + "T09:00:00", days });
    a.start().warmup();
    return a;
  };

  test("with no history the target is one off the top of the range", () => {
    eq(openOn("2026-09-07").hero(), "STOP AT 9");            // hack squat 6-10
  });

  test("held back at 9 keeps the target at 9", () => {
    eq(openOn("2026-09-14", hackDay([9,9,8,8],[2,2,2,0])).hero(), "STOP AT 9");
  });

  test("set 1 taken to failure pulls the target down", () => {
    eq(openOn("2026-09-14", hackDay([9,5,4,4],[0,2,2,0])).hero(), "STOP AT 7");
  });

  test("more than two left pushes the target up", () => {
    eq(openOn("2026-09-14", hackDay([9,9,9,9],[3,3,3,0])).hero(), "STOP AT 10");
  });

  test("a target after a failure is always strictly below what failed", () => {
    for (const first of [6, 7, 9, 10, 13]) {
      const a = openOn("2026-09-14", hackDay([first, 4, 4, 4], [0,2,2,0]));
      const n = parseInt(a.hero().replace(/\D/g, ""), 10);
      ok(n < first, `after failing at ${first} the target was ${n}`);
    }
  });

  test("a commitment from the drop-off card overrides the derived target", () => {
    eq(openOn("2026-09-14", hackDay([9,5,4,4],[0,2,2,0],{ nt: 7 })).hero(), "STOP AT 7");
  });

  test("the last set of a big lift goes to failure, not to a number", () => {
    const a = openOn("2026-09-07");
    for (let i = 0; i < 3; i++) { a.logSet("held"); a.skipRest(); }
    eq(a.hero(), "GO TO FAILURE");
  });

  test("accessories go to failure on every set", () => {
    const a = openOn("2026-09-07");
    for (let i = 0; i < 4; i++) { a.logSet("held"); a.skipRest(); }
    eq(a.openName(), "Seated Leg Curl");
    eq(a.hero(), "TO FAILURE");
  });

  test("hitting the top of the range earns a bump", () => {
    const a = openOn("2026-09-14", hackDay([10,10,10,10],[2,2,2,0],{ st: 5 }));
    eq(a.load(), "102.6");
    has(a.txt(a.one(".card.open .bumped")), "Earned it");
  });

  test("racking the last set early forfeits the bump", () => {
    const a = openOn("2026-09-14", hackDay([10,10,10,10],[2,2,2,2],{ st: 5 }));
    eq(a.load(), "97.6");
  });

  test("a bodyweight lift never earns a weight increase", () => {
    const days = { "2026-09-11": { ex: { dips: { w: null, r: [12,12,12], q: [2,2,0], g: [false,false,false] } }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-18T09:00:00", days });
    a.tab("week");
    hasNot(a.txt(a.one("#weekbody")), "Dips");
  });

  test("one logged set is not enough to judge calibration", () => {
    const a = boot({ now: "2026-09-07T20:00:00",
      days: { "2026-09-07": { ex: { hacksquat: { w: 97.6, r: [9], q: [2], g: [false] } }, updatedAt: 1 } } });
    a.tab("week");
    eq(a.txt(a.one("#weekbody .bignum")), "0 / 0");
  });

  test("the same reps score differently depending on the honest answer", () => {
    const held  = boot({ now: "2026-09-07T20:00:00", days: hackDay([9,9,8,8],[2,2,2,0]) });
    const flunk = boot({ now: "2026-09-07T20:00:00", days: hackDay([9,9,8,8],[0,0,0,0]) });
    held.tab("week"); flunk.tab("week");
    eq(held.txt(held.one("#weekbody .bignum")), "1 / 1");
    eq(flunk.txt(flunk.one("#weekbody .bignum")), "0 / 1");
  });

  test("a layoff eases the load instead of bumping it", () => {
    const soon = openOn("2026-09-14", hackDay([10,10,10,10],[2,2,2,0]));
    const late = openOn("2026-09-28", hackDay([10,10,10,10],[2,2,2,0]));
    eq(soon.load(), "97.6", "one week later: asks for the notch, holds the weight");
    eq(late.load(), "87.5", "three weeks later: eased to 90%");
  });

  test("a layoff also lowers the target", () => {
    eq(openOn("2026-09-28", hackDay([9,9,8,8],[2,2,2,0])).hero(), "STOP AT 8");
  });

  test("one weightless session cannot erase the carried load", () => {
    const days = {
      "2026-09-07": { ex: { legext: { w: 40, r: [15,13] } }, updatedAt: 1 },
      "2026-09-14": { ex: { legext: { w: null, r: [14,12] } }, updatedAt: 2 }
    };
    const a = openOn("2026-09-21", days);
    for (let i = 0; i < 4; i++) { a.logSet("held"); a.skipRest(); }
    for (let i = 0; i < 3; i++) { a.logSet("held"); a.skipRest(); }
    eq(a.openName(), "Leg Extension");
    eq(a.load(), "40", "should carry 40 forward, not fall back to nothing");
  });
};
