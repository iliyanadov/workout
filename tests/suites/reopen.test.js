const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

module.exports = (test) => {
  // Monday as it actually happened: calf press skipped, hack squat stopped at 2 of 4
  const real = { "2026-09-07": { ex: {
    hacksquat: { w:77.6, wr:[97.6,77.6], r:[5,4], q:[0,2], g:[true,false] },
    legcurl:   { w:59, wr:[59,59,59], r:[16,14,10] },
    legext:    { w:45, wr:[45,45], r:[12,12] },
    lats:      { w:10, wr:[10,10,10], r:[8,10,8] } },
    skip: { calf: 1 }, note: "Pain · Machine taken",
    run: { st: 1, en: 2 }, updatedAt: 1 } };

  test("a finished session shows the done card, not the guided flow", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: real });
    ok(a.one(".card.donecard"));
    no(a.one(".card.open"), "there is no session left to guide");
  });

  test("a finished session with unfinished work offers to carry on", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: real });
    const btn = a.all(".card.donecard .quietbtn").find(b => /Carry on/.test(a.txt(b)));
    ok(btn, "no way back into a session you left short");
    has(a.txt(btn), "2 exercises left short",
        "hack squat stopped at 2 of 4, calf press skipped");
  });

  test("carrying on returns to the column with the skipped work reachable", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: real });
    a.tap(a.all(".card.donecard .quietbtn").find(b => /Carry on/.test(a.txt(b))));
    no(a.one(".card.donecard"), "should be back in the session");
    const line = a.all("#exlist .line").find(l => /Calf Press/.test(a.txt(l)));
    has(a.txt(line), "tap to put back");
    a.tap(line);
    eq(a.openName(), "Calf Press");
  });

  test("carrying on does not make you redo the warm-up", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: real });
    a.tap(a.all(".card.donecard .quietbtn").find(b => /Carry on/.test(a.txt(b))));
    no(a.one(".card.warm"), "the warm-up was done an hour ago");
  });

  test("a session finished with nothing outstanding offers no carry-on", () => {
    const clean = { "2026-09-07": { ex: {
      hacksquat: { w:97.6, r:[9,9,8,8], q:[2,2,2,0], g:[false,false,false,false] },
      legcurl:   { w:73, r:[12,11,10] }, legext: { w:45, r:[15,13] },
      calf:      { w:100.4, r:[14,12,11] }, lats: { w:10, r:[13,11,10] } },
      run: { st:1, en:2 }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-07T20:00:00", days: clean });
    ok(a.one(".card.donecard"));
    no(a.all(".card.donecard .quietbtn").some(b => /Carry on/.test(a.txt(b))));
  });

  test("finishing again closes the day properly", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: real });
    a.tap(a.all(".card.donecard .quietbtn").find(b => /Carry on/.test(a.txt(b))));
    a.tap(".endrow .quietbtn", "End session here");
    a.tap(".card.finish .runbtn");
    a.tap(".card.captures .runbtn", "Finish");
    ok(a.one(".card.donecard"));
    ok(a.dayRec("2026-09-07").run.en, "the day is closed again");
  });
};
