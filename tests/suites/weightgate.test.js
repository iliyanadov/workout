const { boot } = require("../harness.js");
const { eq, ok, no, has } = require("../assert.js");

/* On 8 Sep two exercises were logged with w=null and wr=[null,null,null],
   because b29 made the set boxes tappable and never gated them. */
module.exports = (test) => {
  const toPushdown = (a) => {
    let g = 0;
    while (g++ < 20 && a.openName() !== "Triceps Rope Pushdown") {
      const n = a.openName();
      let g2 = 0; while (a.openName() === n && a.logBtn() && g2++ < 8) { a.logSet("held"); a.skipRest(); }
      if (a.one(".card.drop")) a.tap(".card.drop .runbtn");
      if (a.openName() === n) break;
    }
    return a;
  };

  test("tapping a set box cannot log against a weight that does not exist", () => {
    const a = boot({ now: "2026-09-08T09:00:00" });
    a.start().warmup();
    toPushdown(a);
    eq(a.openName(), "Triceps Rope Pushdown");
    ok(a.all(".card.open .s2").every(b => b.disabled), "every box must be inert");
    a.all(".card.open .s2").forEach(b => a.tap(b));
    no(a.one("#pad").classList.contains("on"), "the sheet must not open");
    eq(a.exRec("2026-09-08", "pushdown"), null, "nothing may be written");
  });

  test("the log button is gated too", () => {
    const a = boot({ now: "2026-09-08T09:00:00" });
    a.start().warmup();
    toPushdown(a);
    const gate = a.all(".card.open .runbtn").find(b => /Set a weight first/.test(a.txt(b)));
    ok(gate && gate.disabled);
    a.tap(gate);
    no(a.one("#pad").classList.contains("on"));
  });

  test("the empty field is marked as something to tap", () => {
    const a = boot({ now: "2026-09-08T09:00:00" });
    a.start().warmup();
    toPushdown(a);
    const f = a.one(".card.open .winput");
    ok(f.className.includes("needw"), "the field must stand out while a weight is owed");
    eq(f.placeholder, "tap");
  });

  test("typing a weight releases the boxes and the button together", () => {
    const a = boot({ now: "2026-09-08T09:00:00" });
    a.start().warmup();
    toPushdown(a);
    a.type(".card.open .winput", 21.6);
    no(a.all(".card.open .s2").some(b => b.disabled), "boxes must come alive");
    ok(a.logBtn(), "and so must the log button");
    no(a.one(".card.open .winput").className.includes("needw"));
    a.logSet(14);
    const r = a.exRec("2026-09-08", "pushdown");
    eq(r.w, 21.6);
    eq(r.wr, [21.6], "the per-set load is recorded, not null");
  });

  test("clearing the weight again re-locks it", () => {
    const a = boot({ now: "2026-09-08T09:00:00" });
    a.start().warmup();
    toPushdown(a);
    a.type(".card.open .winput", 21.6);
    ok(a.logBtn());
    a.type(".card.open .winput", "");
    ok(a.all(".card.open .s2").every(b => b.disabled), "back to inert with no weight");
  });

  test("a future day is inert whatever you tap", () => {
    const a = boot({ now: "2026-09-08T20:00:00",
      days: { "2026-09-08": { ex: { chestpress: { w:59, r:[11,11,8,5], q:[2,2,0,0], g:[false,false,true,false] } },
              run: { st:1, en:2 }, updatedAt: 1 } } });
    a.tap(a.all("#daystrip .day")[4]);          // Friday, still ahead
    a.all(".ex .slotbtn").forEach(b => a.tap(b));
    eq(a.dayRec("2026-09-11"), null);
  });
};
