const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* The warm-up is guided the same way the session is: one set on screen, a Done
   button, then the same inline countdown. The loads are half and three-quarters
   of the working weight SNAPPED TO SOMETHING THE MACHINE CAN ACTUALLY BE SET TO.
   On a pin stack "about 37.5 kg" is not a thing, so the pulldown ramps 39 / 52.
   On the hack squat, whose sled is 47.6 kg empty, half of 97.6 does not exist at
   all — the bare machine is the lightest set there is, so it ramps 47.6 / 72.6. */
module.exports = (test) => {
  const SESSIONS = [
    // exact=1 where we know the machine: a plate count and a pin hole are not
    // approximations. Every machine here has now been measured, so no ramp says
    // "about" any more - the 45 sled is 75.7 kg and the stacks are 15 lb holes.
    ["Lower A","2026-09-07","Hack Squat",           [47.6, 72.6], "97.6",  1],
    ["Upper A","2026-09-08","Machine Chest Press",  [32, 45],     "59",    1],
    ["Lower B","2026-09-11","Leg Press",            [75.7, 110.7],"145.7", 1],
    ["Upper B","2026-09-12","Lat Pulldown",         [39, 52],     "73",    1],
  ];

  for (const [name, day, exName, loads, top, exact] of SESSIONS) {
    const kg = v => (exact ? "" : "ABOUT ") + v + " KG";
    test(name + ": one set at a time, and it names the lift", () => {
      const a = boot({ now: day + "T09:00:00" });
      a.start();
      eq(a.txt(a.one(".card.warm .cardname")), "Warm up");
      eq(a.txt(a.one(".card.warm .cardtag")), "SET 1 OF 2");
      eq(a.txt(a.one(".card.warm .lastline")), exName);
      eq(a.txt(a.one(".card.warm .hero")), kg(loads[0]));
      has(a.txt(a.one(".card.warm .herosub")), "8 reps");
    });

    test(name + ": Done starts an inline countdown that names what is next", () => {
      const a = boot({ now: day + "T09:00:00" });
      a.start();
      a.tap(".card.warm .runbtn");
      ok(a.one(".card.warm .restpanel"), "the clock must be on the card, not only in the bar");
      eq(a.txt(a.one(".card.warm .restbig")), "0:45");
      has(a.txt(a.one(".card.warm .restwhy")), "Preparation, not work");
      has(a.txt(a.one(".card.warm .coach")), String(loads[1]));
    });

    test(name + ": the second set's rest names the working weight", () => {
      const a = boot({ now: day + "T09:00:00" });
      a.start();
      a.tap(".card.warm .runbtn");
      a.tap(".card.warm .quietbtn", "Skip rest");
      eq(a.txt(a.one(".card.warm .cardtag")), "SET 2 OF 2");
      eq(a.txt(a.one(".card.warm .hero")), kg(loads[1]));
      a.tap(".card.warm .runbtn");
      has(a.txt(a.one(".card.warm .coach")), top + " kg");
    });

    test(name + ": finishing the warm-up opens the first exercise", () => {
      const a = boot({ now: day + "T09:00:00" });
      a.start().warmup();
      no(a.one(".card.warm"));
      eq(a.openName(), exName);
    });
  }

  test("the countdown runs down and then says Go", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start();
    a.tap(".card.warm .runbtn");
    eq(a.txt(a.one(".card.warm .restbig")), "0:45");
    a.w.advance(20000);
    return new Promise(res => setTimeout(() => {
      eq(a.txt(a.one("#clock")), "0:25", "the bar ticks too");
      a.w.advance(30000);
      setTimeout(() => {
        has(a.txt(a.one("#clock")), "0:00");
        res();
      }, 400);
    }, 400));
  });

  test("you can step back a set if you mis-tapped Done", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start();
    a.tap(".card.warm .runbtn");
    a.tap(".card.warm .quietbtn", "Skip rest");
    eq(a.txt(a.one(".card.warm .cardtag")), "SET 2 OF 2");
    a.tap(".card.warm .quietbtn", "Back a set");
    eq(a.txt(a.one(".card.warm .cardtag")), "SET 1 OF 2");
  });

  test("the warm-up can be skipped whole, and writes nothing", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup(true);
    no(a.one(".card.warm"));
    eq(a.openName(), "Hack Squat");
    eq(a.exRec("2026-09-07", "hacksquat"), null, "ramp sets must never reach the log");
  });

  test("a warm-up rest records nothing against any exercise", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start();
    a.tap(".card.warm .runbtn");
    a.tap(".card.warm .quietbtn", "Skip rest");
    eq(a.exRec("2026-09-07", "hacksquat"), null);
  });

  test("a warm-up rest survives a reload", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start();
    a.tap(".card.warm .runbtn");
    const b = boot({ now: "2026-09-07T09:00:20", run: a.runState() });
    ok(b.one("#rest").classList.contains("on"));
    eq(b.txt(b.one("#clock")), "0:25");
  });
};
