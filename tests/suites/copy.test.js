const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* Text that must be true, not text that must be nice. Each of these was wrong
   at some point and told the user something the code does not do. */
module.exports = (test) => {
  const open = (when) => { const a = boot({ now: when + "T09:00:00" }); a.start().warmup(); return a; };

  test("the start card states both rules when the session mixes them", () => {
    for (const d of ["2026-09-07","2026-09-08","2026-09-10","2026-09-11"]) {
      const a = boot({ now: d + "T09:00:00" });
      const rule = a.txt(a.one(".card.start .rule"));
      has(rule, "two reps still in you", d);
      has(rule, "every set to failure", d + " — every session has accessories that go to failure");
    }
  });

  test("the list view's rule strip says the same thing as the start card", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.tap(".card.start .quietbtn", "Log it yourself");
    const strip = a.txt(a.one(".rulestrip"));
    has(strip, "two reps still in you");
    has(strip, "every set to failure");
  });

  test("a bodyweight lift is never told it is 'at this weight'", () => {
    const a = open("2026-09-11");
    for (let i = 0; i < 6; i++) { a.setWeightIfAsked(40); if (a.logBtn()) a.logSet("held"); a.skipRest(); }
    while (a.openName() && a.openName() !== "Dips" ) {
      a.setWeightIfAsked(40);
      if (!a.logBtn()) break;
      a.logSet("held"); a.skipRest();
    }
    if (a.openName() === "Dips") {
      hasNot(a.txt(a.one(".card.open .herosub")), "at this weight");
      has(a.txt(a.one(".card.open .wbig")), "Bodyweight");
    }
  });

  test("the rest label names the duration it is actually counting", () => {
    const a = open("2026-09-07");
    a.logSet("held");
    has(a.txt(a.one(".restpanel .restwhy")), "3 minutes");
    a.skipRest();
    for (let i = 0; i < 3; i++) { a.logSet("held"); a.skipRest(); }
    a.logSet("held");
    has(a.txt(a.one(".restpanel .restwhy")), "90 seconds");
  });

  test("a set taken to failure extends the rest and says a longer number", () => {
    const a = open("2026-09-07");
    a.logSet("failed");
    has(a.txt(a.one(".restpanel .restwhy")), "3.5 minutes");
  });

  test("a never-set weight does not read as 'bodyweight'", () => {
    const days = { "2026-09-07": { ex: { legext: { w: null, r: [15,13] } }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-14T09:00:00", days });
    a.start().warmup();
    let g = 0;
    while (g++ < 30 && a.openName() !== "Leg Extension") {
      a.setWeightIfAsked(40);
      if (!a.logBtn()) break;
      a.logSet("held"); a.skipRest();
    }
    eq(a.openName(), "Leg Extension");
    const last = a.one(".card.open .lastline");
    hasNot(last ? a.txt(last) : "", "bodyweight");
  });

  test("the calibration blurb names the plan's own question", () => {
    const a = boot({ now: "2026-09-07T20:00:00",
      days: { "2026-09-07": { ex: { hacksquat: { w: 97.6, r: [9,9,8,8], q: [2,2,2,0],
        g: [false,false,false,false] } }, updatedAt: 1 } } });
    a.tab("week");
    has(a.txt(a.one("#weekbody .statnote")), "10/9/8");
    has(a.txt(a.one("#weekbody .statnote")), "10/5/4");
  });

  test("the first three weeks are named as calibration, and only then", () => {
    has(a1(), "Weeks one to three are calibration");
    hasNot(a2(), "Weeks one to three are calibration");
    function a1(){ const a = boot({ now: "2026-09-07T09:00:00" }); return a.txt(a.one(".card.start")); }
    function a2(){ const a = boot({ now: "2026-10-12T09:00:00" }); return a.txt(a.one(".card.start")); }
  });

  test("the app never claims a session is today when it is not", () => {
    const a = boot({ now: "2026-09-05T09:00:00" });
    hasNot(a.txt(a.one(".card.start .kicker")), "TODAY");
    has(a.txt(a.one(".card.start")), "logged against");
    has(a.txt(a.one(".card.start .runbtn")), "early");
  });

  test("the warm-up says 'about', because a percentage of an off-ladder weight is not exact", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start();
    a.all(".card.warm .warmmain").forEach(r => has(a.txt(r), "about"));
  });

  test("nothing offers to add weight to a bodyweight lift", () => {
    const days = { "2026-09-11": { ex: { dips: { w: null, r: [12,12,12], q: [2,2,0], g: [false,false,false] } } , updatedAt: 1 } };
    const a = boot({ now: "2026-09-11T20:00:00", days });
    a.tab("week");
    const ups = a.txt(a.one("#weekbody"));
    hasNot(ups.split("Watch")[0], "Dips");
  });

  test("the finish card's one-thing does not contradict its calibration", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    for (let i = 0; i < 4; i++) { a.logSet("held"); a.skipRest(); }
    a.tap(".endrow .quietbtn", "End session here");
    const cal = a.txt(a.one(".card.finish .bignum"));
    const one = a.txt(a.one(".card.finish .onething"));
    if (cal === "1 / 1") has(one, "Nothing", "a clean session must not be given a fix");
  });
};
