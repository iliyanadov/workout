const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* The pad used to run lo-4 .. hi+5 and stop dead. A real set of 32 on the hip
   abduction machine could only be entered as 20, which silently flattened the
   exact number the too-light rule reads. */
module.exports = (test) => {
  const open = () => {                       // Lower A, walk to an accessory
    const a = boot({ now: "2026-10-05T09:00:00" });
    a.start().warmup();
    let g = 0;
    while (g++ < 10 && a.openName() !== "Seated Leg Curl") {
      const n = a.openName();
      a.setWeightIfAsked(40);
      if (!a.logBtn()) break;
      let g2 = 0; while (a.openName() === n && a.logBtn() && g2++ < 8) { a.logSet("held"); a.skipRest(); }
      if (a.one(".card.drop")) a.tap(".card.drop .runbtn");
      if (a.openName() === n) break;
    }
    return a;
  };
  const nums = (a) => a.all("#padgrid .padbtn").map(b => a.txt(b)).filter(t => /^\d+$/.test(t)).map(Number);

  test("the pad opens on a tight grid around the rep range", () => {
    const a = open();
    eq(a.openName(), "Seated Leg Curl");          // 8-12
    a.tap(a.logBtn());
    const v = nums(a);
    eq(v[0], 4, "lo - 4");
    eq(v[v.length - 1], 17, "hi + 5");
  });

  test("but it no longer stops there — +15 widens it", () => {
    const a = open();
    a.tap(a.logBtn());
    const more = a.all("#padgrid .padbtn.more")[0];
    ok(more, "there must be a way past the ceiling");
    eq(a.txt(more), "+15");
    a.tap(more);
    const v = nums(a);
    eq(v[v.length - 1], 32, "hi + 5 + 15");
  });

  test("it widens again, so no honest number is unreachable", () => {
    const a = open();
    a.tap(a.logBtn());
    for (let i = 0; i < 3; i++) {
      const m = a.all("#padgrid .padbtn.more")[0];
      if (m) a.tap(m);
    }
    const v = nums(a);
    ok(v[v.length - 1] >= 60, "reached " + v[v.length - 1]);
  });

  test("a number past the old ceiling actually logs", () => {
    const a = open();
    a.tap(a.logBtn());
    a.tap(a.all("#padgrid .padbtn.more")[0]);
    const btn = a.all("#padgrid .padbtn").find(b => a.txt(b) === "32");
    ok(btn, "32 must be tappable");
    a.tap(btn);
    const rec = a.exRec("2026-10-05", "legcurl");
    eq((rec.r || []).filter(x => x != null && x !== "")[0], 32);
  });

  test("the widening stops somewhere — it is a pad, not a scroll of integers", () => {
    const a = open();
    a.tap(a.logBtn());
    let taps = 0;
    while (a.all("#padgrid .padbtn.more")[0] && taps++ < 12) a.tap(a.all("#padgrid .padbtn.more")[0]);
    ok(taps < 12, "the +15 tile disappears once the grid is absurd");
  });
};
