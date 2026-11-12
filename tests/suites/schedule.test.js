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

  /* 10 Nov 2026: Fri/Sat moved to Thu/Fri, from the Monday of that week. The
     default is DATED rather than edited in place, because schedAt() falls
     through to it for every un-overridden day ever logged — editing it would
     not have moved the schedule, it would have rewritten September. */
  const title = (a) => a.one(".card.start") ? a.txt(a.one(".card.start .bigtitle"))
                                             : a.txt(a.one(".sesstitle"));

  test("from 9 Nov the week is Mon, Tue, Thu, Fri", () => {
    const map = {};
    for (const d of ["2026-11-09","2026-11-10","2026-11-11","2026-11-12",
                     "2026-11-13","2026-11-14","2026-11-15"])
      map[d] = title(boot({ now: d + "T09:00:00" }));
    eq(map, { "2026-11-09":"Lower A", "2026-11-10":"Upper A", "2026-11-11":"Rest day",
              "2026-11-12":"Lower B", "2026-11-13":"Upper B", "2026-11-14":"Rest day",
              "2026-11-15":"Rest day" });
  });

  test("the weeks before the move keep Friday and Saturday", () => {
    eq(title(boot({ now: "2026-11-05T09:00:00" })), "Rest day", "Thu 5 Nov");
    eq(title(boot({ now: "2026-11-06T09:00:00" })), "Lower B",  "Fri 6 Nov");
    eq(title(boot({ now: "2026-11-07T09:00:00" })), "Upper B",  "Sat 7 Nov");
  });

  test("a session really done on a Saturday before the move is still that session", () => {
    const days = { "2026-11-07": { ex: { dips: { w:null, r:[9,9,10], q:[2,2,0],
      g:[false,false,false] } }, run:{st:1,en:2}, updatedAt: 1 } };
    const a = boot({ now: "2026-11-12T09:00:00", days });
    a.tab("week");
    a.tap("#wprev");
    has(a.txt(a.one("#weekbody")), "Upper B", "Sat 7 Nov must not turn into a rest day");
  });

  test("a schedule tapped in before the move does not shadow it", () => {
    // Lower B on Wednesday, tapped in September. Without a floor on the override
    // walk this would silently eat the November move for good.
    const days = { "2026-09-14": { ex: {}, sched: { lowerA:1, upperA:2, lowerB:3, upperB:6 }, updatedAt: 1 } };
    eq(title(boot({ now: "2026-09-16T09:00:00", days })), "Lower B", "the tap still governs the weeks it was made for");
    eq(title(boot({ now: "2026-11-11T09:00:00", days })), "Rest day", "Wednesday");
    eq(title(boot({ now: "2026-11-12T09:00:00", days })), "Lower B",  "Thursday");
    eq(title(boot({ now: "2026-11-13T09:00:00", days })), "Upper B",  "Friday");
  });

  test("a tap after the move still wins, and the way back names the new week", () => {
    const a = boot({ now: "2026-11-12T09:00:00" });
    openSched(a);
    eq(onDay(a, "Lower B"), 3, "Thursday");
    eq(onDay(a, "Upper B"), 4, "Friday");
    no(a.all("#view-plan .quietbtn").some(b => /Back to/.test(a.txt(b))), "already on the default");
    a.tap(dayBtns(rowFor(a, "Upper B"))[5]);         // Saturday
    eq(onDay(a, "Upper B"), 5);
    const reset = a.all("#view-plan .quietbtn").find(b => /Back to/.test(a.txt(b)));
    eq(a.txt(reset), "Back to Mon · Tue · Thu · Fri");
    a.tap(reset);
    eq(onDay(a, "Upper B"), 4, "Friday again, not Saturday");
  });

  test("the Plan tab reads Thursday and Friday after the move", () => {
    const a = boot({ now: "2026-11-12T09:00:00" });
    a.tab("plan");
    const secs = a.all("#view-plan h2.sec").map(a.txt).slice(0, 4);
    has(secs[2], "Thu — Lower B");
    has(secs[3], "Fri — Upper B");
    has(a.txt(a.one("#view-plan .statnote")), "Thursday Lower B, Friday Upper B");
  });

  test("after Tuesday the next session is Thursday, not Friday", () => {
    const days = { "2026-11-10": { ex: { chestpress: { w:59, r:[8,8,8,12], q:[2,2,2,0],
      g:[false,false,false,false] } }, run: { st:1, en:2 }, updatedAt: 1 } };
    const a = boot({ now: "2026-11-10T20:00:00", days });
    has(a.txt(a.one(".card.donecard .nextline")), "Lower B");
    has(a.txt(a.one(".card.donecard .nextline")), "Thu 12 Nov");
  });
};
