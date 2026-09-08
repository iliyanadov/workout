const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* 24 kg total and 24 kg in each hand are different exercises. The app used to
   print "24 kg" for both a machine stack and a pair of dumbbells. */
module.exports = (test) => {
  const DB = ["Incline DB Press", "Hammer Curl", "Bench Bicep Curl", "Lateral Raises"];

  test("a dumbbell load says 'each' where it is set, in the guided card", () => {
    const a = boot({ now: "2026-09-08T09:00:00" });
    a.start().warmup();
    let g = 0, units = {};
    while (g++ < 20) {
      const n = a.openName(); if (!n) break;
      a.setWeightIfAsked(20);
      units[n] = a.txt(a.one(".card.open .wunit"));
      if (!a.logBtn()) break;
      let g2 = 0; while (a.openName() === n && a.logBtn() && g2++ < 8) { a.logSet("held"); a.skipRest(); }
      if (a.one(".card.drop")) a.tap(".card.drop .runbtn");
    }
    eq(units["Incline DB Press"], "kg each");
    eq(units["Hammer Curl"], "kg each");
    eq(units["Machine Chest Press"], "kg", "a stack is not per hand");
    eq(units["Seated Row · Chest Pad"], "kg");
  });

  test("the list card says 'per hand' in the prescription", () => {
    const a = boot({ now: "2026-09-08T09:00:00" });
    a.listMode();
    const cards = a.all(".ex");
    const incline = cards.find(c => /Incline DB Press/.test(a.txt(c)));
    has(a.txt(incline.querySelector(".prescr")), "per hand");
    const press = cards.find(c => /Machine Chest Press/.test(a.txt(c)));
    hasNot(a.txt(press.querySelector(".prescr")), "per hand");
  });

  test("every dumbbell exercise is marked, and no machine is", () => {
    const days = { "2026-09-07": { ex: {}, updatedAt: 1 } };
    for (const day of ["2026-09-07", "2026-09-08", "2026-09-10", "2026-09-11"]) {
      const a = boot({ now: day + "T09:00:00", days });
      a.listMode();
      a.all(".ex").forEach(card => {
        const name = a.txt(card.querySelector(".exname"));
        const pres = a.txt(card.querySelector(".prescr"));
        if (DB.includes(name)) has(pres, "per hand", name + " is dumbbells");
        else hasNot(pres, "per hand", name + " is not");
      });
    }
  });

  test("the dumbbell ladder still steps in whole dumbbells", () => {
    const earned = { "2026-09-08": { ex: { incline: { w: 24, st: 2,
      r: [12,12,12], q: [2,2,0], g: [false,false,false] } }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-15T09:00:00", days: earned });
    a.start().warmup();
    let g = 0;
    while (g++ < 20 && a.openName() !== "Incline DB Press") {
      a.setWeightIfAsked(20); if (!a.logBtn()) break; a.logSet("held"); a.skipRest();
    }
    eq(a.openName(), "Incline DB Press");
    eq(a.load(), "26", "22, 24, 26 — the rack, not a 2.5 kg stack");
  });
};
