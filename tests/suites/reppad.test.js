const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* The pad ran lo-4 .. hi+5 and stopped dead, so a real set of 32 on the hip
   abduction machine could only be entered as 20 — flattening the exact figure
   the too-light rule reads. The grid still covers the ordinary set in one tap;
   anything else is typed. */
module.exports = (test) => {
  const open = () => {
    const a = boot({ now: "2026-10-05T09:00:00" });   // Lower A
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
  // exclude the escape tile — a label that reads as a number is a label that
  // can be misread as a rep count, which is how this very helper tripped.
  const nums = (a) => a.all("#padgrid .padbtn:not(.more)").map(b => a.txt(b))
                       .filter(t => /^\d+$/.test(t)).map(Number);
  const logged = (a) => ((a.exRec("2026-10-05", "legcurl") || {}).r || []).filter(x => x != null && x !== "");

  test("the grid stays tight around the rep range", () => {
    const a = open();
    eq(a.openName(), "Seated Leg Curl");              // 8-12
    a.tap(a.logBtn());
    const v = nums(a);
    eq(v[0], 4); eq(v[v.length - 1], 17);
  });

  test("there is a way out of the grid", () => {
    const a = open();
    a.tap(a.logBtn());
    const t = a.all("#padgrid .padbtn.more")[0];
    ok(t, "the grid must not be the only option");
    eq(a.txt(t), "Type", "and it must not read as a rep count");
  });

  test("a number past the old ceiling can be typed and logs", () => {
    const a = open();
    a.tap(a.logBtn());
    a.tap(a.all("#padgrid .padbtn.more")[0]);
    ok(a.one("#padgrid .padnum"), "a number field appears");
    a.type("#padgrid .padnum", 32);
    const go = a.all("#padgrid .runbtn")[0];
    has(a.txt(go), "32");
    a.tap(go);
    eq(logged(a)[0], 32);
  });

  test("the Log button stays dead until the number is sane", () => {
    const a = open();
    a.tap(a.logBtn());
    a.tap(a.all("#padgrid .padbtn.more")[0]);
    const go = () => a.all("#padgrid .runbtn")[0];
    ok(go().disabled, "disabled with nothing typed");
    a.type("#padgrid .padnum", 0);      ok(go().disabled, "0 reps is not a set");
    a.type("#padgrid .padnum", 999);    ok(go().disabled, "999 is a typo, not a set");
    a.type("#padgrid .padnum", 26);     no(go().disabled);
  });

  test("you can go back to the grid without logging anything", () => {
    const a = open();
    a.tap(a.logBtn());
    a.tap(a.all("#padgrid .padbtn.more")[0]);
    a.tap(a.all("#padgrid .quietbtn").find(b => /Back to the pad/.test(a.txt(b))));
    ok(nums(a).length > 5, "the grid is back");
    eq(logged(a).length, 0, "nothing was written on the way through");
  });

  test("an ordinary set still takes one tap", () => {
    const a = open();
    a.tap(a.logBtn());
    a.tap(a.all("#padgrid .padbtn").find(b => a.txt(b) === "11"));
    eq(logged(a)[0], 11);
  });
};
