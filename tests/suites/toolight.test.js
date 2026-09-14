const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* The mirror of the too-heavy cut, and the plan's own rule: "If you could get 15
   on a set with an 8-12 range, the weight is too light." */
module.exports = (test) => {
  const day = (ex) => ({ "2026-09-07": { ex, updatedAt: 1 } });
  const open = (days) => { const a = boot({ now: "2026-09-14T09:00:00", days }); a.start().warmup(); return a; };
  const walkTo = (a, name) => {
    let g = 0;
    while (g++ < 20 && a.openName() !== name) {
      const n = a.openName();
      a.setWeightIfAsked(40);
      if (!a.logBtn()) break;
      let g2 = 0; while (a.openName() === n && a.logBtn() && g2++ < 8) { a.logSet("held"); a.skipRest(); }
      if (a.one(".card.drop")) a.tap(".card.drop .runbtn");
      if (a.openName() === n) break;
    }
    return a;
  };

  test("a best set well past the top of the range raises the weight", () => {
    const a = walkTo(open(day({ legcurl: { w: 59, r: [16,14,10] } })), "Seated Leg Curl");
    eq(a.load(), "65", "59 x 1.1 rounded up to the 2.5 ladder");
    has(a.txt(a.one(".card.open .bumped")), "past the top of 8–12");
  });

  test("it fires even when the last set landed inside the range", () => {
    // 16 on set 1 fatiguing to 10 by set 3 is exactly what earnsBump missed
    const a = walkTo(open(day({ legcurl: { w: 59, r: [16,14,10] } })), "Seated Leg Curl");
    ok(parseFloat(a.load()) > 59);
  });

  test("two past the top is not enough — that is just a good session", () => {
    const a = walkTo(open(day({ legcurl: { w: 59, r: [14,13,12] } })), "Seated Leg Curl");
    eq(a.load(), "59", "14 on an 8-12 stays put; the normal bump rule owns this");
  });

  test("the raised load is judged fresh, from the range", () => {
    // the row lives in Upper A (Tue) and Upper B (Sat), not in Lower A
    const days = { "2026-09-08": { ex: { csrow: { w: 40, r: [17,15,14],
      q: [2,2,0], g: [false,false,false] } }, updatedAt: 1 } };
    const b = boot({ now: "2026-09-15T09:00:00", days });
    b.start().warmup();
    const a = walkTo(b, "Seated Row · Chest Pad");
    eq(a.load(), "45", "40 x 1.1 = 44, rounded UP to the 2.5 ladder");
    eq(a.hero(), "STOP AT 11", "one off the top, not derived from 17 reps");
    has(a.txt(a.one(".card.open .herosub")), "Heavier on purpose");
  });

  test("the raise is refusable in one tap", () => {
    const a = walkTo(open(day({ legcurl: { w: 59, r: [16,14,10] } })), "Seated Leg Curl");
    a.tap(".card.open .bumped button", "Keep 59");
    eq(a.load(), "59");
  });

  test("a bodyweight lift is never raised", () => {
    const days = { "2026-09-12": { ex: { dips: { w: null, r: [20,18,17], q: [2,2,0], g: [false,false,false] } }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-19T09:00:00", days });
    a.start().warmup();
    walkTo(a, "Dips");
    if (a.openName() === "Dips") hasNot(a.txt(a.one(".card.open")), "past the top");
  });

  test("too light and too heavy cannot both fire", () => {
    const a = walkTo(open(day({ legcurl: { w: 59, r: [16,3,2] } })), "Seated Leg Curl");
    const pill = a.txt(a.one(".card.open .bumped")) || "";
    no(/past the top/.test(pill) && /below the/.test(pill));
  });

  test("the raise respects a learned notch", () => {
    const a = walkTo(open(day({ legcurl: { w: 60, st: 5, r: [16,14,10] } })), "Seated Leg Curl");
    eq(a.load(), "70", "60 x 1.1 = 66, rounded up to the 5 kg ladder");
  });
};
