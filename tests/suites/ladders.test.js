const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* The pin stacks in this gym are labelled in pounds. A constant 15 lb hole reads
   7, 7, 7, 7, 6 in kilos, so "round to the nearest 2.5" produces numbers the pin
   cannot be put in — which is how the leg curl was told to load 65 kg on a stack
   whose holes are 59 and 66. These lock the holes down. */
module.exports = (test) => {
  const HOLES = [11,18,25,32,39,45,52,59,66,73,79,86,93,100,107,113];
  const day = (d, ex) => ({ [d]: { ex, updatedAt: 1 } });
  const open = (days, now) => { const a = boot({ now, days }); a.start().warmup(); return a; };
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
  // Lower A is Monday, Upper A Tuesday.
  const legcurl = (rec) => walkTo(open(day("2026-09-07", { legcurl: rec }), "2026-09-14T09:00:00"), "Seated Leg Curl");
  const chest = (rec) => walkTo(open(day("2026-09-08", { chestpress: rec }), "2026-09-15T09:00:00"), "Machine Chest Press");

  test("a raise lands in a hole that exists, not on the nearest 2.5", () => {
    // 59 x 1.1 is 64.9. There is no 65 on this stack. There is a 66.
    eq(legcurl({ w: 59, r: [16,14,10] }).load(), "66");
  });

  test("a cut lands in a hole too", () => {
    // 59 x 0.9 is 53.1, and the hole at or below that is 52 — not 53 or 52.5.
    const a = chest({ w: 59, r: [5,4,4,4], q: [2,2,2,0], g: [false,false,false,false] });
    eq(a.load(), "52");
    has(a.txt(a.one(".card.open .bumped")), "59 → 52 kg");
  });

  test("earning a bump no longer has to ask what the next notch is", () => {
    const a = legcurl({ w: 59, r: [12,12,12] });
    eq(a.load(), "66");
    hasNot(a.txt(a.one(".card.open")), "What is the next weight up",
      "the stack already answers that question");
  });

  test("every weight the app offers on a stack machine is a real hole", () => {
    [[59,[16,14,10]], [45,[16,14,10]], [45,[3,3,2]], [100,[16,14,10]], [73,[12,12,12]]]
      .forEach(([w, r]) => {
        const got = parseFloat(legcurl({ w, r }).load());
        ok(HOLES.includes(got), got + " kg is not a hole on the stack (from " + w + ", " + r + ")");
      });
  });

  test("the warm-up ramp lands in holes as well", () => {
    // You cannot set a pin stack to "about 37.5 kg" either.
    const a = boot({ now: "2026-09-15T09:00:00" });   // Tue, Upper A, chest press at 59
    a.start();
    const first = parseFloat(a.txt(a.one(".card.warm .hero")).replace(/[^0-9.]/g, ""));
    ok(HOLES.includes(first), first + " is not a hole");
    a.tap(".card.warm .runbtn");
    a.tap(".card.warm .quietbtn", "Skip rest");
    const second = parseFloat(a.txt(a.one(".card.warm .hero")).replace(/[^0-9.]/g, ""));
    ok(HOLES.includes(second), second + " is not a hole");
    ok(second < 59 && first < second, "the ramp still climbs, and stays under the working weight");
  });

  test("a machine that is not on the stack keeps its own step", () => {
    // The hack squat is plate-loaded. 77.6 x 0.9 rounded down the 2.5 ladder.
    const a = walkTo(open(day("2026-09-07", { hacksquat: { w: 77.6, r: [5,4,4,4],
      q: [2,2,2,0], g: [false,false,false,false] } }), "2026-09-14T09:00:00"), "Hack Squat");
    eq(a.load(), "67.5", "the stack must not leak onto machines it does not describe");
  });

  test("past the top of the stack it falls back to the step", () => {
    eq(legcurl({ w: 120, r: [16,14,10] }).load(), "132.5");
  });

  test("a step typed at the machine beats the stack the app assumed", () => {
    // Direct evidence about this machine outranks an assumption about it.
    eq(legcurl({ w: 59, r: [12,12,12], st: 2 }).load(), "61");
  });

  test("the Plan tab says what each machine can be set to", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    a.tab("plan");
    const row = a.all(".machrow").find(r => a.txt(r).includes("Seated Leg Curl"));
    ok(row, "every stack machine gets a row");
    has(a.txt(row), "pin stack");
    ok(!a.all(".machrow").some(r => a.txt(r).includes("Lateral Raises")),
      "dumbbells have no stack, so they are not listed");
  });

  test("tapping a machine off the stack changes what it offers", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    a.tab("plan");
    const btn = a.all(".machrow").find(r => a.txt(r).includes("Seated Leg Curl")).querySelector(".machbtn");
    a.tap(btn);
    eq(a.exRec("2026-09-14", "legcurl").ld, "", "an explicit no is stored, not just an absence");
    has(a.txt(a.all(".machrow").find(r => a.txt(r).includes("Seated Leg Curl"))), "not set");
  });

  test("tapping a machine onto the stack is remembered and used", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    a.tab("plan");
    const row = () => a.all(".machrow").find(r => a.txt(r).includes("Leg Extension"));
    has(a.txt(row()), "not set", "we have never been shown the leg extension stack");
    a.tap(row().querySelector(".machbtn"));
    eq(a.exRec("2026-09-14", "legext").ld, "pin15");
    has(a.txt(row()), "pin stack");
  });

  test("the choice survives a reload, and later days inherit it", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    a.tab("plan");
    a.tap(a.all(".machrow").find(r => a.txt(r).includes("Leg Extension")).querySelector(".machbtn"));
    const saved = a.store();
    const b = boot({ now: "2026-09-21T09:00:00", local: { "workout.v2": JSON.stringify(saved) } });
    b.tab("plan");
    has(b.txt(b.all(".machrow").find(r => b.txt(r).includes("Leg Extension"))), "pin stack");
  });
};
