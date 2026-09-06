const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* The guided session as a state machine, driven the way a thumb drives it. */
module.exports = (test) => {
  const SESSIONS = [
    { day: "2026-09-07", name: "Lower A", first: "Hack Squat",          sets: 15 },
    { day: "2026-09-08", name: "Upper A", first: "Machine Chest Press", sets: 18 },
    { day: "2026-09-10", name: "Lower B", first: "Leg Press",           sets: 17 },
    { day: "2026-09-11", name: "Upper B", first: "Lat Pulldown",        sets: 15 },
  ];

  const runWhole = (day) => {
    const a = boot({ now: day + "T09:00:00" });
    a.start().warmup();
    let guard = 0;
    while (guard++ < 200) {
      if (a.one(".card.finish")) break;
      if (a.one(".card.drop")) { a.tap(".card.drop .runbtn"); continue; }
      if (a.one(".restpanel")) { a.skipRest(); continue; }
      if (!a.one(".card.open")) break;
      a.setWeightIfAsked(40);
      if (!a.logBtn()) break;
      a.logSet("held");
    }
    return a;
  };

  for (const s of SESSIONS) {
    test(`${s.name}: start card names the session and its first exercise`, () => {
      const a = boot({ now: s.day + "T09:00:00" });
      eq(a.txt(a.one(".card.start .bigtitle")), s.name);
      has(a.txt(a.one(".card.start .exnames")), s.first);
    });

    test(`${s.name}: runs start to finish and reaches the finish card`, () => {
      const a = runWhole(s.day);
      ok(a.one(".card.finish"), "never reached the finish card");
      has(a.txt(a.one(".card.finish .meta2")), s.sets + " of " + s.sets + " sets");
    });
  }

  test("warm-up is two ramp sets and closes when both are ticked", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start();
    eq(a.all(".card.warm .warmmain").length, 2);
    has(a.txt(a.one(".card.warm .kicker")), "two sets");
    a.warmup();
    no(a.one(".card.warm"));
    eq(a.openName(), "Hack Squat");
  });

  test("warm-up can be skipped in one tap", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup(true);
    no(a.one(".card.warm"));
    eq(a.openName(), "Hack Squat");
  });

  test("ramp sets are never written into the log", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    eq(a.exRec("2026-09-07", "hacksquat"), null, "the warm-up must not create a record");
  });

  test("the guided card states the rule as one instruction, not per-slot labels", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    eq(a.hero(), "STOP AT 9");
    eq(a.all(".card.open .slotfoot").length, 0, "guided mode carries one instruction, not four");
  });

  test("the list view labels every slot with the rule that applies to it", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.tap(".card.start .quietbtn", "Log it yourself");
    const first = a.all(".ex")[0];
    eq(a.all(".ex .slotfoot").slice(0, 4).map(a.txt), ["2 LEFT","2 LEFT","2 LEFT","FAIL"]);
  });

  test("a logged set can be reopened and corrected without leaving guided mode", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 2; i++) { a.logSet("held"); a.skipRest(); }
    eq(a.exRec("2026-09-07", "hacksquat").r, [9, 9]);
    a.tap(a.all(".card.open .s2")[0]);              // reopen set 1
    ok(a.one("#pad").classList.contains("on"), "the sheet should open on a logged set");
    a.tap("#padclear");
    eq(a.exRec("2026-09-07", "hacksquat").r[0], null);
  });

  test("logging a set starts the rest timer", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held");
    ok(a.one(".restpanel"), "no rest panel after logging");
    has(a.txt(a.one(".restpanel .restwhy")), "3 minutes");
  });

  test("an accessory rests 90 seconds, a big lift three minutes", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 4; i++) { a.logSet("held"); a.skipRest(); }
    a.logSet("held");
    has(a.txt(a.one(".restpanel .restwhy")), "90 seconds");
  });

  test("the rest ending leaves a log button for the next set, not a dead screen", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held");
    a.w.advance(200000);
    return new Promise(res => setTimeout(() => {
      ok(a.logBtn(), "no way forward after the rest ended");
      has(a.txt(a.logBtn()), "set 2");
      res();
    }, 400));
  });

  test("going to failure on set 1 raises the drop-off card with cause one", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 4; i++) { a.logSet("failed"); a.skipRest(); }
    ok(a.one(".card.drop"), "no drop-off card");
    has(a.txt(a.one(".card.drop .dropline")), "cause one");
    has(a.txt(a.one(".card.drop .runbtn")), "Next time I stop at");
  });

  test("machine taken skips the exercise and can be undone", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    a.tap(".card.open .quietbtn", "Machine taken");
    eq(a.openName(), "Seated Leg Curl");
    const line = a.all("#exlist .line").find(l => /Hack Squat/.test(a.txt(l)));
    has(a.txt(line), "tap to put back");
    a.tap(line);
    eq(a.openName(), "Hack Squat");
  });

  test("machine taken is withdrawn once sets are logged", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held").skipRest();
    no(a.all(".card.open .quietbtn").some(b => /Machine taken/.test(a.txt(b))),
       "must not offer to hide sets already logged");
  });

  test("a scheduled session can be swapped before starting", () => {
    const a = boot({ now: "2026-09-08T09:00:00" });          // Tuesday = Upper A
    eq(a.txt(a.one(".card.start .bigtitle")), "Upper A");
    a.tap(".card.start .quietbtn", "different session");
    a.tap(".card.start .pick", "Lower A");
    eq(a.txt(a.one(".card.start .bigtitle")), "Lower A");
  });

  test("cancel with nothing logged returns to the start card", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    a.tap(".endrow .quietbtn");
    ok(a.one(".card.start"));
  });

  test("ending early scores what was done and offers a way back", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 2; i++) { a.logSet("held"); a.skipRest(); }
    a.tap(".endrow .quietbtn", "End session here");
    has(a.txt(a.one(".card.finish .meta2")), "2 of 15 sets");
    a.tap(".card.finish .runbtn");
    ok(a.one(".card.captures"));
    const back = a.all(".card.captures .quietbtn").pop();
    has(a.txt(back), "13 sets still owed");
    a.tap(back);
    ok(a.one(".card.open"), "must return to the session");
  });

  test("captures asks one question and finishing closes the day", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    a.tap(".endrow .quietbtn");                       // cancel -> start card
    a.start().warmup().logSet("held").skipRest();
    a.tap(".endrow .quietbtn", "End session here");
    a.tap(".card.finish .runbtn");
    eq(a.all(".card.captures .qlab").map(a.txt), ["Anything worth saying?"]);
    a.tap(".card.captures .runbtn", "Finish");
    ok(a.one(".card.donecard"), "should land on the completed-day card");
  });

  test("the done card names the next session and its opening number", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held").skipRest();
    a.tap(".endrow .quietbtn", "End session here");
    a.tap(".card.finish .runbtn");
    a.tap(".card.captures .runbtn", "Finish");
    has(a.txt(a.one(".card.donecard .nextline")), "Upper A");
    has(a.txt(a.one(".card.donecard .nextline")), "stops at 11");
  });

  test("position is derived, so a reload lands on the same set", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 2; i++) { a.logSet("held"); a.skipRest(); }
    const b = boot({ now: "2026-09-07T10:00:00", days: a.store().days });
    if (b.one(".card.start")) b.start();            // part-done days skip the start card
    eq(b.openName(), "Hack Squat");
    has(b.txt(b.one(".card.open .setof")), "set 3 of 4");
  });

  test("clearing a set moves the cursor backwards", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 3; i++) { a.logSet("held"); a.skipRest(); }
    has(a.txt(a.one(".card.open .setof")), "set 4 of 4");
    a.tap(a.all(".card.open .s2")[1]);                // reopen set 2
    a.tap("#padclear");
    has(a.txt(a.one(".card.open .setof")), "set 2 of 4");
  });
};
