const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* b51. Dips and pull-ups carry ADDED load: w==null is the bare body, w==5 is a
   belt with 5 kg on it. The percentage rules are the wrong arithmetic for that
   — 10% of a +5 kg belt is half a kilo, and 10% of the bare body is nothing at
   all — so a bodyweight lift moves in whole plate steps, and bottoms out back
   at bodyweight rather than trying to go below it. */
module.exports = (test) => {
  // 2026-09-12 and 2026-09-19 are both Upper B (Saturday) on the default schedule.
  const hist = (dips) => ({ "2026-09-12": { ex: { dips }, updatedAt: 1 } });
  const open = (days) => {
    const a = boot({ now: "2026-09-19T09:00:00", days });
    a.start().warmup();
    return a;
  };
  const walkTo = (a, name) => {
    let g = 0;
    while (g++ < 20 && a.openName() !== name) {
      const n = a.openName();
      a.setWeightIfAsked(40);
      if (!a.logBtn()) break;
      let g2 = 0; while (a.openName() === n && a.logBtn() && g2++ < 8) { a.logSet("held"); a.skipRest(); }
      if (a.one(".card.drop")) a.tap(".card.drop .runbtn");
      if (a.openName() === n) break;
    }
    return a;
  };
  const dips = (rec) => walkTo(open(hist(rec)), "Dips");

  test("the bare body is a real answer, not a missing weight", () => {
    const a = dips({ w: null, r: [9,9,10], q: [2,2,0], g: [false,false,false] });
    eq(a.openName(), "Dips");
    has(a.txt(a.one(".card.open")), "Bodyweight");
    no(a.load(), "with nothing on the belt there is no weight field to mis-set");
  });

  test("there is a way to say the belt came out", () => {
    const a = dips({ w: null, r: [9,9,10], q: [2,2,0], g: [false,false,false] });
    const belt = a.all(".card.open .wbtn").find(b => /belt/.test(a.txt(b)));
    ok(belt, "a loaded dip is unloggable without this, so the lift could never progress");
    a.tap(belt);
    eq(a.load(), "2.5", "the belt starts at one plate step");
  });

  test("clearing the top of the range puts the first plate on the belt", () => {
    // hi is 12, so a last set AT the top is the ordinary bump
    const a = dips({ w: null, r: [12,12,12], q: [2,2,0], g: [false,false,false] });
    eq(a.load(), "2.5", "one step onto an empty belt, not 10% of nothing");
    has(a.txt(a.one(".card.open .bumped")), "bodyweight → +2.5 kg");
  });

  test("a best set three past the top jumps two plates", () => {
    const a = dips({ w: null, r: [20,18,17], q: [2,2,0], g: [false,false,false] });
    eq(a.load(), "5");
    has(a.txt(a.one(".card.open .bumped")), "past the top of 8–12");
  });

  test("a loaded belt steps up one plate at a time", () => {
    const a = dips({ w: 5, r: [12,12,12], q: [2,2,0], g: [false,false,false] });
    eq(a.load(), "7.5");
    has(a.txt(a.one(".card.open .bumped")), "+5 kg → +7.5 kg");
  });

  test("a belt that is too heavy comes back down a plate", () => {
    const a = dips({ w: 5, r: [6,4,3], q: [2,2,0], g: [false,false,false] });
    eq(a.load(), "2.5");
    has(a.txt(a.one(".card.open .bumped")), "below the 8–12 range");
  });

  test("it bottoms out at bodyweight and never goes below it", () => {
    const a = dips({ w: 2.5, r: [5,4,3], q: [2,2,0], g: [false,false,false] });
    no(a.load(), "the belt comes off — there is no such thing as a negative load");
    has(a.txt(a.one(".card.open")), "Bodyweight");
  });

  test("a load on a bodyweight lift reads as added, not as the whole lift", () => {
    const a = dips({ w: 5, r: [10,10,10], q: [2,2,0], g: [false,false,false] });
    const last = a.txt(a.one(".card.open .lastline"));
    has(last, "+5 kg", "+5 kg on a belt is not the same claim as a 5 kg lift");
    hasNot(last, "bodyweight");
  });

  /* The pull-up swap. The lat pulldown went at 72-88% of bodyweight the stack
     was lifting him off the seat, so the set ended when he lost the anchor
     rather than when his lats quit. A pull-up has no seat to come out of. */
  test("Upper B opens on the pull-up, and the pulldown is gone from the plan", () => {
    const a = boot({ now: "2026-09-12T09:00:00" });
    a.start();
    eq(a.openName(), "Pull-Up");
    a.tab("plan");
    hasNot(a.txt(a.one("#planbody")), "Lat Pulldown");
  });

  test("a bodyweight first lift has no warm-up, because nothing is lighter", () => {
    const a = boot({ now: "2026-09-12T09:00:00" });
    a.start();
    no(a.one(".card.warm"), "there is no lighter set of a bodyweight pull-up to prescribe");
    eq(a.openName(), "Pull-Up", "and it must not deadlock waiting for one");
  });

  test("retiring the pulldown does not blank the sessions it was really done in", () => {
    const days = { "2026-09-12": { ex: { pulldown: { w: 73, r: [5,6,6], q: [0,0,0], g: [false,false,false] } }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-12T20:00:00", days });
    a.tab("week");
    has(a.txt(a.one("#weekbody")), "Lat Pulldown", "history has to keep naming it");
  });

  test("a retired lift still reaches the week's review paste", () => {
    // Two real pulldown sessions exist. Retiring it must not erase them from
    // the one surface that gets copied out for review.
    const days = { "2026-09-12": { ex: { pulldown: { w: 73, r: [5,6,6], q: [0,0,0], g: [true,true,true] } }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-12T20:00:00", days });
    a.tab("week");
    let copied = null;
    a.w.navigator.clipboard = { writeText: t => { copied = t; return Promise.resolve(); } };
    a.tap(".copybtn", "Copy week for review");
    has(copied, "Lat Pulldown 73kg — 5! 6! 6!");
  });
};
