const { boot } = require("../harness.js");
const { eq, ok, no, has } = require("../assert.js");

module.exports = (test) => {
  const SESSIONS = [
    ["Lower A","2026-09-07","Hack Squat",  ["50","72.5"], "97.6"],
    ["Upper A","2026-09-08","Machine Chest Press", ["30","45"], "59"],
    ["Lower B","2026-09-10","Leg Press",   ["75","110"], "145.7"],
    ["Upper B","2026-09-11","Lat Pulldown",["37.5","55"], "73"],
  ];

  for (const [name, day, ex, loads, top] of SESSIONS) {
    test(name + ": two ramp sets, both labelled 'about', ending at the working weight", () => {
      const a = boot({ now: day + "T09:00:00" });
      a.start();
      const rows = a.all(".card.warm .warmmain").map(a.txt);
      eq(rows.length, 2);
      loads.forEach((w, i) => {
        has(rows[i], ex);
        has(rows[i], "about " + w + " kg");
      });
      has(a.txt(a.one(".card.warm .warmthen")), top + " kg");
    });

    test(name + ": every ramp set says how long to rest after it", () => {
      const a = boot({ now: day + "T09:00:00" });
      a.start();
      const rests = a.all(".card.warm .warmrest").map(a.txt);
      eq(rests.length, 2, "both ramp sets must state a rest");
      has(rests[0], "45 seconds");
      has(rests[0], "next one");
      has(rests[1], "45 seconds");
      has(rests[1], "working set");
    });
  }

  test("ticking a ramp set starts a real 45-second countdown", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start();
    a.tap(a.all(".card.warm .runbtn")[0]);
    ok(a.one("#rest").classList.contains("on"), "the rest bar must appear");
    eq(a.txt(a.one("#clock")), "0:45");
    has(a.txt(a.one("#restsub")), "Then");
    eq(a.runState().restExId, "__warm");
  });

  test("the warm-up countdown says what comes next", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start();
    a.tap(a.all(".card.warm .runbtn")[0]);
    has(a.txt(a.one("#restsub")), "72.5 kg", "after ramp 1 it names ramp 2");
    a.tap(a.all(".card.warm .runbtn")[0]);
    has(a.txt(a.one("#restsub")), "97.6 kg", "after ramp 2 it names the working weight");
  });

  test("a warm-up rest records nothing against any exercise", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start();
    a.tap(a.all(".card.warm .runbtn")[0]);
    a.tap("#restskip");
    eq(a.exRec("2026-09-07", "hacksquat"), null, "the ramp must never touch the log");
  });

  test("a warm-up rest survives a reload", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start();
    a.tap(a.all(".card.warm .runbtn")[0]);
    const b = boot({ now: "2026-09-07T09:00:20", days: a.store() ? a.store().days : null, run: a.runState() });
    ok(b.one("#rest").classList.contains("on"), "the countdown should still be running");
    eq(b.txt(b.one("#clock")), "0:25");
  });

  test("the card says why the warm-up rest is short", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start();
    has(a.txt(a.one(".card.warm")), "preparation, not work");
  });

  test("ticking both closes the card and opens the first exercise", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    no(a.one(".card.warm"));
    eq(a.openName(), "Hack Squat");
  });

  test("the warm-up can be skipped and writes nothing to the log", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup(true);
    no(a.one(".card.warm"));
    eq(a.exRec("2026-09-07", "hacksquat"), null, "ramp sets must never reach the log");
  });
};
