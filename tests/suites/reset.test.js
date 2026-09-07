const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

module.exports = (test) => {
  const midSession = () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 3; i++) { a.logSet("held"); a.skipRest(); }
    return a;
  };

  test("reset is offered once sets are logged, and cancel is not", () => {
    const a = midSession();
    const opts = a.all(".endrow .quietbtn").map(a.txt);
    ok(opts.some(t => /Reset session/.test(t)), "no reset control");
    ok(opts.some(t => /End session here/.test(t)), "end should still be there");
    no(opts.some(t => /Cancel/.test(t)), "cancel is for an untouched session");
  });

  test("with nothing logged it is cancel, not reset", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    const opts = a.all(".endrow .quietbtn").map(a.txt);
    ok(opts.some(t => /Cancel/.test(t)));
    no(opts.some(t => /Reset session/.test(t)));
  });

  test("one tap arms it and names what it will clear", () => {
    const a = midSession();
    a.tap(".endrow .quietbtn", "Reset session");
    const opts = a.all(".endrow .quietbtn").map(a.txt);
    ok(opts.some(t => /Reset — clear 3 sets/.test(t)), "the confirm must say how much goes");
    ok(opts.some(t => /Keep it/.test(t)), "no way to back out");
    eq(a.exRec("2026-09-07", "hacksquat").r, [9,9,9], "arming must not delete anything");
  });

  test("backing out leaves the session untouched", () => {
    const a = midSession();
    a.tap(".endrow .quietbtn", "Reset session");
    a.tap(".endrow .quietbtn", "Keep it");
    eq(a.exRec("2026-09-07", "hacksquat").r, [9,9,9]);
    has(a.txt(a.one("#hctxs")), "3 / 15 sets");
  });

  test("confirming clears the sets and returns to the start card", () => {
    const a = midSession();
    a.tap(".endrow .quietbtn", "Reset session");
    a.tap(".endrow .quietbtn", "Reset — clear");
    ok(a.one(".card.start"), "should land back on the start card");
    eq(a.exRec("2026-09-07", "hacksquat"), null, "the sets must be gone");
    has(a.txt(a.one(".card.start .runbtn")), "Start Lower A");
  });

  test("a reset is undoable for the rest of the day", () => {
    const a = midSession();
    a.tap(".endrow .quietbtn", "Reset session");
    a.tap(".endrow .quietbtn", "Reset — clear");
    const undo = a.all("#exlist .quietbtn").find(b => /Undo delete/.test(a.txt(b)));
    ok(undo, "no undo offered after a reset");
    has(a.txt(undo), "restore 3 sets");
    a.tap(undo);
    eq(a.exRec("2026-09-07", "hacksquat").r, [9,9,9]);
  });

  test("reset clears the warm-up and the run clock too", () => {
    const a = midSession();
    a.tap(".endrow .quietbtn", "Reset session");
    a.tap(".endrow .quietbtn", "Reset — clear");
    a.start();
    ok(a.one(".card.warm"), "the warm-up should be owed again");
    eq(a.runState().warmSkipped, 0);
  });

  test("an armed reset never survives a reload", () => {
    const a = midSession();
    a.tap(".endrow .quietbtn", "Reset session");
    const b = boot({ now: "2026-09-07T09:05:00", days: a.store().days, run: a.runState() });
    no(a.all(".endrow .quietbtn").map(a.txt).join(" ").indexOf("Reset — clear") >= 0 &&
       b.all(".endrow .quietbtn").map(b.txt).some(t => /Reset — clear/.test(t)),
       "a half-armed destructive tap must not resume");
  });

  test("reset does not touch a different day", () => {
    const days = { "2026-09-04": { ex: { hacksquat: { w: 97.6, r: [9,9,8,8], q:[2,2,2,0],
      g:[false,false,false,false] } }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-07T09:00:00", days });
    a.start().warmup().logSet("held").skipRest();
    a.tap(".endrow .quietbtn", "Reset session");
    a.tap(".endrow .quietbtn", "Reset — clear");
    eq(a.exRec("2026-09-04", "hacksquat").r, [9,9,8,8], "another day must be untouched");
  });
};
