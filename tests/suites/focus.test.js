const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

module.exports = (test) => {
  const mid = () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 2; i++) { a.logSet("held"); a.skipRest(); }
    return a;
  };
  const order = a => a.all("#exlist .line, #exlist .card.open")
    .map(el => a.txt(el.querySelector(".lname, .cardname")));

  test("tapping an upcoming exercise opens it without reordering the session", () => {
    const a = mid();
    const before = order(a);
    a.tap("#exlist .line", "Calf Press");
    eq(a.openName(), "Calf Press");
    eq(order(a), before, "the column order must not change");
  });

  test("looking at another exercise writes nothing to the day", () => {
    const a = mid();
    const snapshot = JSON.stringify(a.dayRec("2026-09-07"));
    a.tap("#exlist .line", "Lateral Raises");
    eq(JSON.stringify(a.dayRec("2026-09-07")), snapshot, "viewing must not touch the record");
    eq(a.dayRec("2026-09-07").ord, undefined, "no persisted reorder");
  });

  test("there is always a way back to where the session actually is", () => {
    const a = mid();
    a.tap("#exlist .line", "Calf Press");
    const back = a.all(".endrow .quietbtn").find(b => /Back to/.test(a.txt(b)));
    ok(back, "no way back");
    has(a.txt(back), "Hack Squat");
    has(a.txt(back), "set 3");
    a.tap(back);
    eq(a.openName(), "Hack Squat");
  });

  test("a finished exercise reopens in place instead of jumping to the list view", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 4; i++) { a.logSet("held"); a.skipRest(); }
    if (a.one(".card.drop")) a.tap(".card.drop .runbtn");
    eq(a.openName(), "Seated Leg Curl");
    a.tap("#exlist .line", "Hack Squat");
    eq(a.openName(), "Hack Squat", "should open where it is");
    ok(a.one("#exlist .card.open"), "still the guided column, not the list view");
  });

  test("logging into a viewed exercise is allowed and lands on the right day", () => {
    const a = mid();
    a.tap("#exlist .line", "Calf Press");
    a.logSet("held");
    eq(a.exRec("2026-09-07", "calf").r.length, 1, "one set recorded against calf press");
    eq(a.exRec("2026-09-07", "hacksquat").r, [9, 9], "the other exercise is untouched");
  });

  test("finishing a viewed exercise returns focus to the session", () => {
    const a = mid();
    a.tap("#exlist .line", "Lateral Raises");
    for (let i = 0; i < 3; i++) { a.logSet("held"); a.skipRest(); }
    eq(a.openName(), "Hack Squat", "should fall back to where the session is");
    eq(a.runState().focus, null);
  });

  test("a focus never survives into another day", () => {
    const a = mid();
    a.tap("#exlist .line", "Calf Press");
    // the stale run blob is discarded on read rather than rewritten, so assert
    // the behaviour rather than the storage
    const b = boot({ now: "2026-09-08T09:00:00", days: a.store().days, run: a.runState() });
    b.start().warmup();
    eq(b.openName(), "Machine Chest Press", "Tuesday must start at its own first exercise");
  });

  test("viewing a skipped exercise is not possible; it offers to put it back", () => {
    const a = mid();
    a.tap("#exlist .line", "Calf Press");
    a.tap(".card.open .quietbtn", "Machine taken");
    const line = a.all("#exlist .line").find(l => /Calf Press/.test(a.txt(l)));
    has(a.txt(line), "tap to put back");
    eq(a.openName(), "Hack Squat", "focus must be released when it stops making sense");
  });
};
