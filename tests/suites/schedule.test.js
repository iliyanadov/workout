const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* The schedule is the user's to change, without asking anyone. */
module.exports = (test) => {
  const DOWS = ["M","T","W","T","F","S","S"];
  const openSched = (a) => { a.tab("plan"); return a.all(".schedrow"); };
  const rowFor = (a, name) => a.all(".schedrow").find(r => a.txt(r.querySelector(".schedname")) === name);
  const dayBtns = (r) => [...r.querySelectorAll(".schedday")];
  const onDay = (a, name) => {
    const r = rowFor(a, name);
    return dayBtns(r).findIndex(b => b.className.includes("on"));   // 0 = Monday
  };

  test("the editor shows the current schedule", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    openSched(a);
    eq(a.all(".schedrow .schedname").map(a.txt), ["Lower A","Upper A","Lower B","Upper B"]);
    eq(onDay(a, "Lower A"), 0, "Monday");
    eq(onDay(a, "Upper A"), 1, "Tuesday");
    eq(onDay(a, "Lower B"), 4, "Friday");
    eq(onDay(a, "Upper B"), 5, "Saturday");
  });

  test("moving a session to a free day just moves it", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    openSched(a);
    a.tap(dayBtns(rowFor(a, "Lower B"))[3]);         // Thursday
    eq(onDay(a, "Lower B"), 3);
    eq(onDay(a, "Upper B"), 5, "Saturday is untouched");
  });

  test("moving onto an occupied day swaps the two", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    openSched(a);
    a.tap(dayBtns(rowFor(a, "Lower B"))[5]);         // Saturday, owned by Upper B
    eq(onDay(a, "Lower B"), 5);
    eq(onDay(a, "Upper B"), 4, "Upper B takes Friday");
  });

  test("two sessions can never land on the same day", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    openSched(a);
    a.tap(dayBtns(rowFor(a, "Upper A"))[0]);         // Monday, owned by Lower A
    const days = ["Lower A","Upper A","Lower B","Upper B"].map(n => onDay(a, n));
    eq(new Set(days).size, 4, "every session on its own day");
  });

  test("a change takes effect on the Day tab immediately", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    openSched(a);
    a.tap(dayBtns(rowFor(a, "Lower B"))[2]);         // Wednesday
    a.tab("day");
    a.tap(a.all("#daystrip .day")[2]);               // Wednesday
    eq(a.txt(a.one(".sesstitle")), "Lower B");
  });

  test("the change is written to the day, so it syncs", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    openSched(a);
    a.tap(dayBtns(rowFor(a, "Lower B"))[3]);
    eq(a.dayRec("2026-09-14").sched.lowerB, 4, "Thursday");
    ok(a.store().pending["2026-09-14"], "and is queued for sync");
  });

  test("a session already logged keeps the day it was done on", () => {
    const days = { "2026-09-07": { ex: { hacksquat: { w:97.6, r:[9,9,8,8], q:[2,2,2,0],
      g:[false,false,false,false] } }, run:{st:1,en:2}, updatedAt: 1 } };
    const a = boot({ now: "2026-09-14T09:00:00", days });
    openSched(a);
    a.tap(dayBtns(rowFor(a, "Lower A"))[2]);         // move Lower A to Wednesday
    a.tab("week");
    a.tap("#wprev");
    has(a.txt(a.one("#weekbody")), "Lower A", "last Monday is still a Lower A session");
    a.tab("day");
    a.tap(a.all("#daystrip .day")[0]);
    eq(a.txt(a.one(".sesstitle")), "Lower A", "Monday 7 Sep keeps its identity");
  });

  test("the Plan tab's headings and schedule line follow the change", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    openSched(a);
    a.tap(dayBtns(rowFor(a, "Lower B"))[3]);         // Thursday
    const secs = a.all("#view-plan h2.sec").map(a.txt).slice(0, 4);
    has(secs[2], "Thu — Lower B");
    has(a.txt(a.one("#view-plan .statnote")), "Thursday Lower B");
  });

  test("there is a way back to the default", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    openSched(a);
    no(a.all("#view-plan .quietbtn").some(b => /Back to Mon/.test(a.txt(b))),
       "no reset offered while already on the default");
    a.tap(dayBtns(rowFor(a, "Lower B"))[3]);
    const reset = a.all("#view-plan .quietbtn").find(b => /Back to Mon/.test(a.txt(b)));
    ok(reset);
    a.tap(reset);
    eq(onDay(a, "Lower B"), 4, "Friday again");
  });

  test("Sunday is reachable", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    openSched(a);
    a.tap(dayBtns(rowFor(a, "Upper B"))[6]);         // Sunday
    eq(onDay(a, "Upper B"), 6);
    a.tab("day");
    a.tap(a.all("#daystrip .day")[6]);
    eq(a.txt(a.one(".sesstitle")), "Upper B");
  });
};
