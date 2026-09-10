const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

module.exports = (test) => {
  const done = () => ({ "2026-09-07": { ex: {
    hacksquat: { w:77.6, wr:[97.6,77.6], r:[5,4], q:[0,2], g:[true,false] },
    legcurl:   { w:59, wr:[59,59,59], r:[16,14,10] } },
    run: { st: 1, en: 2 }, updatedAt: 1 } });

  test("a finished session still has the calendar and the week nav", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: done() });
    ok(a.one(".card.donecard"), "should be on the done card");
    no(a.one("#daystrip").classList.contains("hidden"), "the week must be visible again");
    no(a.one("#weeknav").classList.contains("hidden"), "the nav must be visible again");
    eq(a.all("#daystrip .day").length, 7);
  });

  test("the calendar is hidden only while a session is actually running", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    no(a.one("#daystrip").classList.contains("hidden"), "visible before you start");
    a.start().warmup().logSet("held");
    ok(a.one("#daystrip").classList.contains("hidden"), "hidden mid-session");
  });

  test("you can look at an upcoming session and see its planned loads", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: done() });
    a.tap(a.all("#daystrip .day")[4]);                 // Friday
    eq(a.txt(a.one(".sesstitle")), "Lower B");
    has(a.txt(a.one("#sessdate")), "planned");
    has(a.txt(a.one("#exlist .cue")), "Planned for Fri 11 Sep");
    ok(a.all(".ex").some(e => /Leg Press/.test(a.txt(e))));
  });

  test("a future day cannot be logged into", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: done() });
    a.tap(a.all("#daystrip .day")[4]);
    ok(a.all(".ex .slotbtn").every(b => b.disabled), "every slot must be inert");
    a.all(".ex .slotbtn").forEach(b => a.tap(b));
    eq(a.dayRec("2026-09-11"), null, "nothing may be written to a day that has not happened");
  });

  test("a missed training day is marked, and can still be filled in", () => {
    const days = Object.assign(done(), {});
    const a = boot({ now: "2026-09-09T09:00:00", days });   // Wednesday; Tuesday was missed
    a.tap(a.all("#daystrip .day")[1]);                       // Tuesday
    has(a.txt(a.one("#sessdate")), "missed");
    has(a.txt(a.one("#exlist .cue")), "Nothing was logged");
    no(a.all(".ex .slotbtn")[0].disabled, "a past day must still be fillable");
  });

  test("the strip marks missed days and days still ahead", () => {
    const a = boot({ now: "2026-09-09T09:00:00", days: done() });
    const cells = a.all("#daystrip .day");
    ok(cells[1].className.includes("missed"), "Tuesday was a training day with nothing logged");
    no(cells[0].className.includes("missed"), "Monday was completed");
    ok(cells[4].className.includes("ahead"), "Friday is still to come");
  });

  test("paging forward and back returns you to the same place", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: done() });
    const start = a.txt(a.one("#wtoday"));
    a.tap("#wnext"); a.tap("#wnext");
    has(a.txt(a.one("#wtoday")), "Week 3");
    a.tap("#wprev"); a.tap("#wprev");
    eq(a.txt(a.one("#wtoday")), start);
  });

  test("the jump-to-today control returns from anywhere", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: done() });
    a.tap("#wnext"); a.tap("#wnext"); a.tap("#wnext");
    no(a.one("#wtoday").disabled);
    a.tap("#wtoday");
    has(a.txt(a.one("#wtoday")), "today");
    has(a.txt(a.one("#sessdate")), "Mon 7 Sep");
    ok(a.one(".card.donecard"), "and back on the completed session");
  });

  test("a future week shows its sessions on the right days", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: done() });
    a.tap("#wnext");
    const names = [];
    a.all("#daystrip .day").forEach((c, i) => {
      a.tap(c);
      names.push(a.txt(a.one(".sesstitle")));
    });
    eq(names, ["Lower A","Upper A","Rest day","Rest day","Lower B","Upper B","Rest day"]);
  });
};
