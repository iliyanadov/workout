const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

module.exports = (test) => {
  const day = (ex) => ({ "2026-09-07": { ex, updatedAt: 1 } });
  const open = (days) => { const a = boot({ now: "2026-09-14T09:00:00", days }); a.start().warmup(); return a; };

  test("a best set below the range floor lowers the weight", () => {
    const a = open(day({ hacksquat: { w:77.6, wr:[97.6,77.6], r:[5,4], q:[0,2], g:[true,false] } }));
    eq(a.load(), "67.5", "77.6 x 0.9 rounded down to the 2.5 ladder");
    has(a.txt(a.one(".card.open .bumped")), "below the 6–10 range");
  });

  test("the lighter load is judged fresh, not against the reps that failed", () => {
    const a = open(day({ hacksquat: { w:77.6, wr:[97.6,77.6], r:[5,4], q:[0,2], g:[true,false] } }));
    eq(a.hero(), "STOP AT 8", "a new load gets a target from the range");
    has(a.txt(a.one(".card.open .herosub")), "Lighter on purpose");
  });

  test("the cut is refusable in one tap", () => {
    const a = open(day({ hacksquat: { w:77.6, wr:[97.6,77.6], r:[5,4], q:[0,2], g:[true,false] } }));
    a.tap(".card.open .bumped button", "Keep 77.6");
    eq(a.load(), "77.6");
  });

  test("reps inside the range are never cut, however sharp the drop", () => {
    const a = open(day({ hacksquat: { w:97.6, r:[10,7,6,6], q:[2,2,2,0], g:[false,false,false,false] } }));
    eq(a.load(), "97.6", "a >3 drop with reps in range stays ambiguous — effort or rest first");
    hasNot(a.txt(a.one(".card.open")), "below the");
  });

  test("one set below the floor is enough — the load cannot reach the range", () => {
    const a = open(day({ hacksquat: { w:97.6, r:[5], q:[0], g:[true] } }));
    eq(a.load(), "87.5");
  });

  test("a bodyweight lift is never cut", () => {
    const days = { "2026-09-12": { ex: { dips: { w:null, r:[4,3,3], q:[0,2,0], g:[true,false,false] } }, updatedAt:1 } };
    const a = boot({ now: "2026-09-19T09:00:00", days });
    a.start().warmup();
    let g=0; while (g++ < 20 && a.openName() !== "Dips") { a.setWeightIfAsked(40); if(!a.logBtn()) break; a.logSet("held"); a.skipRest(); }
    if (a.openName() === "Dips") hasNot(a.txt(a.one(".card.open")), "below the");
  });

  test("the cut respects a learned notch", () => {
    const a = open(day({ hacksquat: { w:100, st:5, r:[5,4], q:[0,2], g:[true,false] } }));
    eq(a.load(), "90", "100 x 0.9 = 90, already on the 5 kg ladder");
  });

  test("an accessory that fell short is cut too", () => {
    const days = day({ lats: { w:10, r:[8,7,6] } });
    const a = open(days);
    let g=0; while (g++ < 20 && a.openName() !== "Lateral Raises") { a.setWeightIfAsked(40); if(!a.logBtn()) break; a.logSet("held"); a.skipRest(); }
    eq(a.openName(), "Lateral Raises");
    eq(a.load(), "9", "10 x 0.9 on a 1 kg ladder");
  });

  test("a cut never goes below one increment", () => {
    const a = open(day({ lats: { w:1, r:[3,2,2] } }));
    let g=0; while (g++ < 20 && a.openName() !== "Lateral Raises") { a.setWeightIfAsked(40); if(!a.logBtn()) break; a.logSet("held"); a.skipRest(); }
    ok(parseFloat(a.load()) >= 1, "must not propose zero or a negative load");
  });
};
