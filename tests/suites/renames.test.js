const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* Renaming the display must not touch the identity: every stored record, every
   learned notch and every carried weight is keyed on the id. */
module.exports = (test) => {
  const history = { "2026-09-08": { ex: {
    csrow:    { w: 61.5, st: 2.5, wr: [61.5,61.5,61.5], r: [12,11,10], q: [2,2,0], g: [false,false,false] },
    pushdown: { w: 25,   wr: [25,25,25],   r: [14,12,11] },
    reardelt: { w: 15,   wr: [15,15,15],   r: [18,16,15] } }, updatedAt: 1 } };

  test("the cards read the new names", () => {
    const a = boot({ now: "2026-09-08T09:00:00" });
    a.listMode();
    const names = a.all(".ex .exname").map(a.txt);
    has(names.join(" | "), "Seated Row · Chest Pad");
    has(names.join(" | "), "Triceps Rope Pushdown");
    has(names.join(" | "), "Reverse Pec Deck");
    hasNot(names.join(" | "), "Chest Support Row");
    hasNot(names.join(" | "), "Rear Delt Flye");
  });

  test("history logged under the old names still carries its weights forward", () => {
    const a = boot({ now: "2026-09-15T09:00:00", days: history });
    a.start().warmup();
    let g = 0, seen = {};
    while (g++ < 20) {
      const n = a.openName(); if (!n) break;
      seen[n] = (a.one(".card.open .winput") || {}).value;
      a.setWeightIfAsked(20);
      if (!a.logBtn()) break;
      let g2 = 0; while (a.openName() === n && a.logBtn() && g2++ < 8) { a.logSet("held"); a.skipRest(); }
      if (a.one(".card.drop")) a.tap(".card.drop .runbtn");
    }
    eq(seen["Seated Row · Chest Pad"], "61.5", "the row keeps the weight it climbed to");
    eq(seen["Triceps Rope Pushdown"], "25", "no longer asks to find a weight");
    eq(seen["Reverse Pec Deck"], "15");
  });

  test("a learned notch survives the rename", () => {
    const earned = { "2026-09-08": { ex: { csrow: { w: 59, st: 2.5,
      r: [12,12,12], q: [2,2,0], g: [false,false,false] } }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-15T09:00:00", days: earned });
    a.start().warmup();
    let g = 0;
    while (g++ < 20 && a.openName() !== "Seated Row · Chest Pad") {
      a.setWeightIfAsked(20); if (!a.logBtn()) break; a.logSet("held"); a.skipRest();
    }
    eq(a.openName(), "Seated Row · Chest Pad");
    eq(a.load(), "61.5", "59 + the learned 2.5 notch, applied under the new name");
  });

  test("the Plan tab and the weekly paste use the new names", () => {
    const a = boot({ now: "2026-09-08T20:00:00", days: history });
    a.tab("plan");
    has(a.txt(a.one("#view-plan")), "Seated Row · Chest Pad");
    has(a.txt(a.one("#view-plan")), "Reverse Pec Deck");
    a.tab("week");
    let copied = null;
    a.w.navigator.clipboard = { writeText: t => { copied = t; return Promise.resolve(); } };
    a.tap(".copybtn", "Copy week for review");
    has(copied, "Seated Row · Chest Pad");
    has(copied, "Triceps Rope Pushdown");
  });

  test("the row is still a big lift and the other two are still accessories", () => {
    const a = boot({ now: "2026-09-08T09:00:00" });
    a.start().warmup();
    let g = 0, heroes = {};
    while (g++ < 20) {
      const n = a.openName(); if (!n) break;
      a.setWeightIfAsked(20);          // two of these need a weight before the rule shows
      heroes[n] = a.hero();
      if (!a.logBtn()) break;
      let g2 = 0; while (a.openName() === n && a.logBtn() && g2++ < 8) { a.logSet("held"); a.skipRest(); }
      if (a.one(".card.drop")) a.tap(".card.drop .runbtn");
    }
    has(heroes["Seated Row · Chest Pad"], "STOP AT", "a big lift gets a number");
    eq(heroes["Triceps Rope Pushdown"], "TO FAILURE");
    eq(heroes["Reverse Pec Deck"], "TO FAILURE");
  });
};
