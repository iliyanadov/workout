const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* One test per defect found in the three audit rounds. Each name states the bug,
   so a failure here says exactly what came back. */
module.exports = (test) => {
  const day = (ex, d) => ({ [d || "2026-09-07"]: { ex, updatedAt: 1 } });

  test("b14: the last set reaching failure must not read as a grind", () => {
    const a = boot({ now: "2026-09-07T20:00:00",
      days: day({ hacksquat: { w: 97.6, r: [9,9,8,8], q: [2,2,2,0], g: [false,false,false,false] } }) });
    a.tab("week");
    eq(a.txt(a.one("#weekbody .bignum")), "1 / 1");
  });

  test("b14: answering 'nothing left' every set must not score as success", () => {
    const a = boot({ now: "2026-09-07T20:00:00",
      days: day({ hacksquat: { w: 97.6, r: [9,9,8,8], q: [0,0,0,0], g: [true,true,true,false] } }) });
    a.tab("week");
    eq(a.txt(a.one("#weekbody .bignum")), "0 / 1");
  });

  test("b14: an accessory must never get the big-lift drop-off verdict", () => {
    const a = boot({ now: "2026-09-07T20:00:00", days: day({ legcurl: { w: 73, r: [12,6,4] } }) });
    a.tab("week");
    has(a.txt(a.one("#weekbody")), "Nothing dropping off");
  });

  test("b14: history must not reach before the block and resurrect old weights", () => {
    const days = Object.assign(
      { "2026-08-31": { ex: { hacksquat: { w: 200, r: [9,9,9,9] } }, updatedAt: 0 } },
      day({ hacksquat: { w: 97.6, r: [9,9,8,8], q: [2,2,2,0], g: [false,false,false,false] } }, "2026-09-07"));
    const a = boot({ now: "2026-09-14T09:00:00", days });
    a.start().warmup();
    eq(a.load(), "97.6", "a pre-block day must not set the weight");
  });

  test("b18: the fatal storage message must not be a button that purges caches", () => {
    const a = boot({ now: "2026-09-07T09:00:00", online: true });
    let reloaded = false;
    a.w.location.reload = () => { reloaded = true; };
    a.breakStorage();
    a.start().warmup().logSet("held");                 // triggers the failed write
    has(a.txt(a.one("#syncmsg")), "NOT SAVED");
    a.tap("#sync");
    no(reloaded, "tapping the warning must never reload over unsaved work");
  });

  test("b18: the rep sheet must not write to a day the app has moved off", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    a.tap(a.logBtn());
    a.tab("week"); a.tab("day");                        // leaving must close the sheet
    no(a.one("#pad").classList.contains("on"), "the sheet should close when you leave");
  });

  test("b18: a cross-session target must sit below the number that failed", () => {
    for (const first of [6, 9, 12]) {
      const a = boot({ now: "2026-09-14T09:00:00",
        days: day({ hacksquat: { w: 97.6, r: [first,4,4,4], q: [0,2,2,0], g: [true,false,false,false] } }) });
      a.start().warmup();
      const n = parseInt(a.hero().replace(/\D/g, ""), 10);
      ok(n < first, `failed at ${first}, target came back ${n}`);
    }
  });

  test("b18: honesty must not be styled differently from compliance", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    a.tap(a.logBtn());
    const opts = a.all("#padgrid .bigopt");
    eq(opts[0].className, opts[1].className, "both answers must look identical");
  });

  test("b18: the reserve question cannot be dismissed without answering", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    a.tap(a.logBtn());
    a.tap("#padgrid .bigopt", "A different number");
    a.tap(a.all("#padgrid .padbtn")[3]);
    ok(a.one("#padclose").classList.contains("hidden"), "no silent exit from the question");
  });

  test("b19: cause two must not offer a button that lowers the target", () => {
    const a = boot({ now: "2026-09-07T20:00:00",
      days: day({ hacksquat: { w: 97.6, r: [9,5,4,4], q: [2,2,2,0], g: [false,false,false,false], t: [60,62,64] } }),
      run: { d: "2026-09-07", started: 1, warmSkipped: 1, dropFor: "hacksquat" } });
    has(a.txt(a.one(".card.drop .dropline")), "cause two");
    hasNot(a.txt(a.one(".card.drop .runbtn")), "Next time I stop at");
    a.tap(".card.drop .runbtn");
    eq(a.exRec("2026-09-07", "hacksquat").nt, undefined, "cause two must write nothing");
  });

  test("b19: cause three must not promise a weight cut nothing performs", () => {
    const a = boot({ now: "2026-09-07T20:00:00",
      days: day({ hacksquat: { w: 97.6, r: [9,5,4,4], q: [2,2,2,0], g: [false,false,false,false], t: [200,200,200] } }),
      run: { d: "2026-09-07", started: 1, warmSkipped: 1, dropFor: "hacksquat" } });
    hasNot(a.txt(a.one(".card.drop")), "comes down");
    has(a.txt(a.one(".card.drop .dropline")), "noise");
  });

  test("b19: moving the block start must not hide earlier sessions", () => {
    const days = day({ hacksquat: { w: 97.6, r: [9,9,8,8], q: [2,2,2,0], g: [false,false,false,false] } });
    const a = boot({ now: "2026-12-07T09:00:00", days });
    a.w.CONFIG.blockStart = "2026-12-07";
    a.w.eval(require("fs").readFileSync(require("path").resolve(__dirname, "../../app.js"), "utf8"));
    a.tab("week");
    ok(a.all(".sessline.hist").length >= 1, "September must still be reachable");
  });

  test("b21: nothing invents a weight the machine cannot be set to", () => {
    const a = boot({ now: "2026-09-14T09:00:00",
      days: day({ hacksquat: { w: 97.6, r: [10,10,10,10], q: [2,2,2,0], g: [false,false,false,false] } }) });
    a.start().warmup();
    hasNot(a.txt(a.one(".card.open")), "100.1");
    has(a.txt(a.one(".card.open .bumped")), "next weight up");
  });

  test("b23: the captures card is not a one-way door", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held").skipRest();
    a.tap(".endrow .quietbtn", "End session here");
    a.tap(".card.finish .runbtn");
    const back = a.all(".card.captures .quietbtn").pop();
    has(a.txt(back), "still owed");
  });

  test("b25: a mid-exercise weight change must not rewrite earlier sets", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held").skipRest();
    a.type(".card.open .winput", 90);
    a.logSet("held");
    eq(a.exRec("2026-09-07", "hacksquat").wr, [97.6, 90]);
  });

  test("b28: the steppers nudge by 0.1 without floating-point drift", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 4; i++) a.tap(a.all(".card.open .wbtn").find(b => a.txt(b) === "+"));
    eq(a.load(), "98");
    for (let i = 0; i < 6; i++) a.tap(a.all(".card.open .wbtn").find(b => a.txt(b) === "−"));
    eq(a.load(), "97.4");
  });

  test("b28: an earned bump still uses the machine's notch, not 0.1", () => {
    const a = boot({ now: "2026-09-14T09:00:00",
      days: day({ hacksquat: { w: 97.6, st: 5, r: [10,10,10,10], q: [2,2,2,0], g: [false,false,false,false] } }) });
    a.start().warmup();
    eq(a.load(), "102.6");
  });
};
