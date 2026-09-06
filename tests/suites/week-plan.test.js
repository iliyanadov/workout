const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

module.exports = (test) => {
  const wk1 = {
    "2026-09-07": { ex: { hacksquat: { w: 97.6, r: [9,9,8,8], q: [2,2,2,0], g: [false,false,false,false] },
                          legcurl:   { w: 73,   r: [12,7,5] } }, updatedAt: 1 },
    "2026-09-08": { ex: { chestpress:{ w: 59, r: [12,12,12,12], q: [2,2,2,0], g: [false,false,false,false] } }, updatedAt: 2 },
    "2026-09-10": { ex: { legpress:  { w: 145.7, r: [14,9,8,8], q: [0,2,2,0], g: [true,false,false,false] } }, updatedAt: 3 }
  };
  const week = (days, now) => { const a = boot({ now: (now||"2026-09-11") + "T20:00:00", days }); a.tab("week"); return a; };

  test("calibration counts big lifts only, and honesty costs the point", () => {
    const a = week(wk1);
    eq(a.txt(a.one("#weekbody .bignum")), "2 / 3");
  });

  test("an accessory falling off is never flagged as a problem", () => {
    const a = week(wk1);
    hasNot(a.txt(a.one("#weekbody")), "Seated Leg Curl — ");
  });

  test("a lift at the top of its range appears in goes-up", () => {
    const a = week(wk1);
    has(a.txt(a.one("#weekbody")), "Machine Chest Press");
  });

  test("goes-up will not name a weight before the machine's notch is known", () => {
    const a = week(wk1);
    has(a.txt(a.one("#weekbody")), "the next notch up");
  });

  test("goes-up names the exact weight once the notch is learned", () => {
    const days = JSON.parse(JSON.stringify(wk1));
    days["2026-09-08"].ex.chestpress.st = 2.5;
    const a = week(days);
    has(a.txt(a.one("#weekbody")), "61.5 kg");
  });

  test("watch names the cause, and set-1 failure is cause one", () => {
    const a = week(wk1);
    has(a.txt(a.one("#weekbody")), "you marked set 1 a grind");
  });

  test("sessions are counted, not exercises", () => {
    const a = week(wk1);
    has(a.txt(a.all("#weekbody .bignum")[1]), "3");
    has(a.txt(a.all("#weekbody .stat")[1]), "1 session left this week");
  });

  test("the week tab sections are unambiguous about scope", () => {
    const a = week(wk1);
    const secs = a.all("#view-week h2.sec").map(a.txt);
    eq(secs, ["Goes up next time","Watch","This week, set by set","Every session · 3","Backup"]);
  });

  test("history lists every session newest first and jumps to that day", () => {
    const a = week(wk1);
    const rows = a.all(".sessline.hist").map(a.txt);
    eq(rows.length, 3);
    has(rows[0], "10 Sep");
    has(rows[2], "7 Sep");
    a.tap(a.all(".sessline.hist")[2]);
    has(a.txt(a.one("#hctxs")), "Mon 7 Sep");
  });

  test("history ignores a day that holds only a note", () => {
    const days = Object.assign({}, wk1, { "2026-09-09": { ex: {}, note: "rest", updatedAt: 4 } });
    eq(week(days).all(".sessline.hist").length, 3);
  });

  test("the month rollup stays hidden until it has something to say", () => {
    hasNot(week(wk1).txt(week(wk1).one("#weekbody")), "Month by month");
  });

  test("the weekly paste carries reps, grind markers and notes", () => {
    const a = week(wk1);
    let copied = null;
    a.w.navigator.clipboard = { writeText: t => { copied = t; return Promise.resolve(); } };
    a.tap(".copybtn", "Copy week for review");
    has(copied, "Hack Squat 97.6kg — 9 9 8 8");
    has(copied, "Leg Press 145.7kg — 14! 9 8 8");
    has(copied, "Calibration 2/3");
  });

  test("the weekly paste spells out mixed loads instead of picking one", () => {
    const days = { "2026-09-07": { ex: { hacksquat: { w: 90, wr: [97.6,90,90,90],
      r: [9,9,8,8], q: [2,2,2,0], g: [false,false,false,false] } }, updatedAt: 1 } };
    const a = week(days, "2026-09-07");
    let copied = null;
    a.w.navigator.clipboard = { writeText: t => { copied = t; return Promise.resolve(); } };
    a.tap(".copybtn", "Copy week for review");
    has(copied, "9@97.6 9@90 8@90 8@90");
  });

  test("the plan tab renders every section and all four session tables", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.tab("plan");
    const secs = a.all("#view-plan h2.sec").map(a.txt);
    eq(secs.length, 10);
    has(secs[0], "Lower A"); has(secs[3], "Upper B");
    eq(secs.slice(4), ["How to run a set","The rep range is not a cap","Progression",
                       "When the reps fall off","Nutrition","Why some weights were reset"]);
    eq(a.all("#view-plan .ptable").length, 4);
  });

  test("the plan tab marks exactly the big lifts", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.tab("plan");
    const big = a.all("#view-plan .ptable tr.big td:first-child").map(a.txt);
    // "·" marks a load that was deliberately reset downward; hack squat is one.
    eq(big, ["Hack Squat ·","Machine Chest Press","Chest Support Row ·","Incline DB Press",
             "Leg Press","Lat Pulldown","Chest Support Row ·","Dips"]);
  });

  test("the plan tab reads the same numbers the logger uses", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.tab("plan");
    const row = a.all("#view-plan .ptable tr").find(r => /Hack Squat/.test(a.txt(r)));
    has(a.txt(row), "4");
    has(a.txt(row), "6–10");
  });
};
