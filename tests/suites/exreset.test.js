const { boot } = require("../harness.js");
const { eq, ok, no, has } = require("../assert.js");

module.exports = (test) => {
  const mid = () => {
    const a = boot({ now: "2026-09-08T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 3; i++) { a.logSet("held"); a.skipRest(); }
    return a;
  };

  test("an exercise with sets on it offers its own reset", () => {
    const a = mid();
    ok(a.all(".card.open .quietbtn").some(b => /Reset this exercise/.test(a.txt(b))));
  });

  test("an untouched exercise offers Machine taken instead", () => {
    const a = boot({ now: "2026-09-08T09:00:00" });
    a.start().warmup();
    const opts = a.all(".card.open .quietbtn").map(a.txt);
    ok(opts.some(t => /Machine taken/.test(t)));
    no(opts.some(t => /Reset this exercise/.test(t)));
  });

  test("it takes two taps and names what goes", () => {
    const a = mid();
    a.tap(".card.open .quietbtn", "Reset this exercise");
    const opts = a.all(".card.open .quietbtn").map(a.txt);
    ok(opts.some(t => /Clear 3 sets/.test(t)));
    ok(opts.some(t => /Keep them/.test(t)));
    eq(a.exRec("2026-09-08", "chestpress").r, [11,11,11], "arming must not delete");
  });

  test("backing out changes nothing", () => {
    const a = mid();
    a.tap(".card.open .quietbtn", "Reset this exercise");
    a.tap(".card.open .quietbtn", "Keep them");
    eq(a.exRec("2026-09-08", "chestpress").r, [11,11,11]);
  });

  test("clearing wipes that exercise and leaves the rest of the session", () => {
    const a = mid();
    for (let i = 0; i < 1; i++) { a.logSet("held"); a.skipRest(); }   // finish chest press
    if (a.one(".card.drop")) a.tap(".card.drop .runbtn");
    eq(a.openName(), "Seated Row · Chest Pad");
    a.logSet("held"); a.skipRest();
    a.tap(".card.open .quietbtn", "Reset this exercise");
    a.tap(".card.open .quietbtn", "Clear 1 set");
    eq(a.exRec("2026-09-08", "csrow").r, [], "the row is cleared");
    eq(a.exRec("2026-09-08", "chestpress").r.length, 4, "the chest press is untouched");
  });

  test("clearing reopens that exercise at its first set", () => {
    const a = mid();
    a.tap(".card.open .quietbtn", "Reset this exercise");
    a.tap(".card.open .quietbtn", "Clear 3 sets");
    eq(a.openName(), "Machine Chest Press");
    has(a.txt(a.one(".card.open .setof")), "set 1 of 4");
  });

  test("clearing also drops a stored commitment and any 'ended early' flag", () => {
    const days = { "2026-09-08": { ex: { chestpress: { w:59, wr:[59,59], r:[9,5],
      q:[0,2], g:[true,false], t:[100,110], fin:1, nt:7 } }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-08T09:00:00", days });
    a.start();
    a.tap("#exlist .line", "Machine Chest Press");
    a.tap(".card.open .quietbtn", "Reset this exercise");
    a.tap(".card.open .quietbtn", "Clear 2 sets");
    const r = a.exRec("2026-09-08", "chestpress");
    eq(r.r, []); eq(r.q, []); eq(r.t, []);
    eq(r.fin, undefined); eq(r.nt, undefined);
    eq(r.w, 59, "the weight it was done at survives");
  });

  test("an armed exercise reset never survives a reload", () => {
    const a = mid();
    a.tap(".card.open .quietbtn", "Reset this exercise");
    const b = boot({ now: "2026-09-08T09:05:00", days: a.store().days, run: a.runState() });
    no(b.all(".card.open .quietbtn").map(b.txt).some(t => /^Clear /.test(t)));
  });
};
