const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* The hip thrust left the plan on 16 Sep 2026 and the hip abduction machine took
   its slot. The lift going away must not take its history with it. */
module.exports = (test) => {
  const FRI = "2026-09-18";            // Lower B
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
  const lowerB = (days) => { const a = boot({ now: FRI + "T09:00:00", days }); a.start().warmup(); return a; };

  test("Lower B prescribes the abduction machine, and never the hip thrust", () => {
    const a = boot({ now: FRI + "T09:00:00" });
    a.tab("plan");
    const body = a.txt(a.one("#planbody"));
    has(body, "Hip Abduction");
    hasNot(body, "Hip Thrust");
  });

  test("it sits next to the adductor, because it is the same seat", () => {
    const a = boot({ now: FRI + "T09:00:00" });
    a.tab("plan");
    const names = a.all("#planbody .ptable td:first-child").map(t => a.txt(t));
    const i = names.indexOf("Hip Abduction"), j = names.indexOf("Adductor");
    ok(i >= 0 && j >= 0, "both are in the plan");
    eq(Math.abs(i - j), 1, "flip the pads and go again, rather than crossing the gym");
  });

  test("a brand new machine asks for a weight rather than inventing one", () => {
    const a = walkTo(lowerB(), "Hip Abduction");
    eq(a.hero(), "FIND A WEIGHT");
    eq(a.load(), "", "nothing was ever logged on it, so there is nothing to carry forward");
  });

  test("once it has a weight it runs like any other lift", () => {
    const a = walkTo(lowerB(), "Hip Abduction");
    a.type(".card.open .winput", 39);
    ok(a.logBtn(), "the weight gate opens");
    a.logSet("held");
    eq(a.exRec(FRI, "hipabd").w, 39);
    eq(a.exRec(FRI, "hipabd").r.filter(x => x != null && x !== "").length, 1);
  });

  test("it is on the pin stack, so a raise lands in a hole", () => {
    const a = walkTo(lowerB({ "2026-09-11": { ex: { hipabd: { w: 39, r: [18,16,15] } },
      updatedAt: 1 } }), "Hip Abduction");
    eq(a.load(), "45", "39 x 1.1 is 42.9, and the hole above it is 45");
  });

  test("a hip thrust logged before the swap still shows in the week", () => {
    const days = { "2026-09-11": { ex: { hipthrust: { w: 62.7, r: [12,11], q: [2,0], g: [false,false] },
      legpress: { w: 145.7, r: [14,12,11,10], q: [2,2,2,0], g: [false,false,false,false] } }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-12T20:00:00", days });
    a.tab("week");
    has(a.txt(a.one("#weekbody")), "Hip Thrust", "the session was really done; it does not vanish");
    has(a.txt(a.one("#weekbody")), "12 11");
  });

  test("a retired lift is history only — it never earns a bump again", () => {
    // 11 on the last set of an 8-12 would have earned one when it was prescribed.
    const days = { "2026-09-11": { ex: { hipthrust: { w: 62.7, r: [12,12], q: [2,0], g: [false,false] } },
      updatedAt: 1 } };
    const a = boot({ now: "2026-09-12T20:00:00", days });
    a.tab("week");
    const goesUp = a.txt(a.one("#weekbody")).split("Goes up next time")[1].split("Watch")[0];
    hasNot(goesUp, "Hip Thrust", "nothing that is no longer programmed should be told to go up");
  });

  test("the retired lift is not offered anywhere you could log it", () => {
    const a = boot({ now: FRI + "T09:00:00" });
    a.listMode();
    hasNot(a.txt(a.one("#daybody")), "Hip Thrust");
  });
};
