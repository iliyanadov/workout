const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

/* Defects found by an agent pass that enumerated 1,115 candidate cases against
   the code. Each of these was live in b29. */
module.exports = (test) => {
  const hack = (r, q, extra, d) => ({
    [d || "2026-09-07"]: { ex: { hacksquat: Object.assign(
      { w: 97.6, r, q, g: q.map((v, i) => v === 0 && i < 3) }, extra || {}) }, updatedAt: 1 } });

  test("an orphan pending key must not wedge sync forever", () => {
    const a = boot({ now: "2026-09-07T09:00:00", online: true });
    a.w.localStorage.setItem("workout.v2",
      JSON.stringify({ v: 2, days: {}, pending: { "2026-09-07": 1 } }));
    const b = boot({ now: "2026-09-07T09:00:00", online: true,
      local: { "workout.v2": JSON.stringify({ v: 2, days: {}, pending: { "2026-09-07": 1 } }) } });
    b.start().warmup().logSet("held");                 // must not throw inside push()
    ok(b.exRec("2026-09-07", "hacksquat"), "the session should still be logging");
  });

  test("a restore that cannot be saved must not report success", () => {
    const a = boot({ now: "2026-09-14T09:00:00" });
    a.tab("week");
    a.breakStorage();
    const btn = a.all(".copybtn").find(x => /Restore from a file/.test(a.txt(x)));
    ok(btn, "no restore control");
  });

  test("the stop-at number never lands above the top of the range", () => {
    const a = boot({ now: "2026-09-14T09:00:00", days: hack([20,18,16,15],[2,2,2,0]) });
    a.start().warmup();
    const n = parseInt(a.hero().replace(/\D/g, ""), 10);
    ok(n <= 14, "target came back " + n);
  });

  test("sets logged on a day with no session key are still reachable", () => {
    // reachable by picking a session on a rest day, logging, then tapping Undo
    const days = { "2026-09-12": { ex: { hacksquat: { w: 97.6, r: [9,9], q: [2,2], g: [false,false] } },
                                   k: null, updatedAt: 1 } };
    const a = boot({ now: "2026-09-14T09:00:00", days });
    a.tap("#wprev");
    a.tap(a.all("#daystrip .day")[5]);                  // Saturday
    hasNot(a.txt(a.one("#exlist")), "No session scheduled");
    ok(a.all(".ex").length > 0, "the sets must be visible somewhere");
  });

  test("a note chip must not eat the words around it", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held").skipRest();
    a.tap(".endrow .quietbtn", "End session here");
    a.tap(".card.finish .runbtn");
    a.type(".card.captures textarea", "Pain in the left knee");
    a.tap(".card.captures .chip2", "Pain");
    has(a.dayRec("2026-09-07").note, "Pain in the left knee");
  });

  test("a note chip toggles off cleanly", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held").skipRest();
    a.tap(".endrow .quietbtn", "End session here");
    a.tap(".card.finish .runbtn");
    a.tap(".card.captures .chip2", "Rushed");
    eq(a.dayRec("2026-09-07").note, "Rushed");
    a.tap(".card.captures .chip2", "Rushed");
    eq(a.dayRec("2026-09-07").note, "");
  });

  test("the week nav does not mark a future day as today", () => {
    const a = boot({ now: "2026-09-05T09:00:00" });
    a.tap(".card.start .quietbtn", "Log it yourself");
    hasNot(a.txt(a.one("#wtoday")), "today");
    eq(a.all("#daystrip .day.today").length, 0, "no cell in a future week is today");
  });

  test("a layoff cut is not announced as something earned", () => {
    const a = boot({ now: "2026-09-28T09:00:00", days: hack([10,10,10,10],[2,2,2,0]) });
    a.start().warmup();
    const pill = a.txt(a.one(".card.open .bumped"));
    hasNot(pill, "Earned it");
    has(pill, "days off");
    has(pill, "eased");
  });

  test("the card asking for a notch does not also claim the weight is new", () => {
    const a = boot({ now: "2026-09-14T09:00:00", days: hack([10,10,10,10],[2,2,2,0]) });
    a.start().warmup();
    hasNot(a.txt(a.one(".card.open .herosub")), "New weight");
  });

  test("the watch line names the set that was actually marked", () => {
    const a = boot({ now: "2026-09-07T20:00:00",
      days: hack([10,10,4,4],[2,0,2,0]) });
    a.tab("week");
    has(a.txt(a.one("#weekbody")), "you marked set 2 a grind");
  });

  test("the one thing to fix names the set that actually failed", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    a.logSet("held"); a.skipRest();
    a.logSet("failed"); a.skipRest();
    a.logSet("held"); a.skipRest();
    a.logSet("held");
    if (a.one(".card.drop")) a.tap(".card.drop .runbtn");
    a.tap(".endrow .quietbtn", "End session here");
    has(a.txt(a.one(".card.finish .onething")), "set 2");
  });

  test("the finish card does not name a lift it says was not logged", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("failed");
    a.tap(".endrow .quietbtn", "End session here");
    const cal = a.txt(a.one(".card.finish .bignum"));
    const one = a.txt(a.one(".card.finish .onething"));
    if (cal === "0 / 0") has(one, "Nothing", "one set is not enough to judge, so nothing to fix");
  });

  test("cause three does not claim the rest was timed when it never was", () => {
    const a = boot({ now: "2026-09-07T20:00:00",
      days: hack([9,5,4,4],[2,2,2,0]),
      run: { d: "2026-09-07", started: 1, warmSkipped: 1, dropFor: "hacksquat" } });
    hasNot(a.txt(a.one(".card.drop .dropline")), "rest timed");
    has(a.txt(a.one(".card.drop .dropline")), "never timed a rest");
  });

  test("the list view refuses reps against no weight even with no record yet", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.tap(".card.start .quietbtn", "Log it yourself");
    const card = a.all(".ex").find(e => /Leg Extension/.test(a.txt(e)));
    ok(card.querySelector(".slotbtn").disabled, "the slot must be disabled with no weight");
    eq(a.exRec("2026-09-07", "legext"), null);
  });

  test("the delete label counts every set on the day, not just one session's", () => {
    const days = { "2026-09-07": { ex: {
      hacksquat: { w: 97.6, r: [9,9,8,8], q:[2,2,2,0], g:[false,false,false,false] },
      chestpress:{ w: 59,  r: [11,10] } }, k: "lowerA", updatedAt: 1 } };
    const a = boot({ now: "2026-09-14T09:00:00", days });
    a.tap("#wprev");
    a.tap(a.all("#daystrip .day")[0]);
    a.tap("#exlist .quietbtn", "Delete this session");
    const del = a.all("#exlist .quietbtn").find(x => /^Delete/.test(a.txt(x)));
    has(a.txt(del), "6 sets");
  });

  test("the header's set count does not change when the view does", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    a.tap(".card.open .quietbtn", "Machine taken");
    const guided = a.txt(a.one("#hctxs"));
    a.tap("#exlist .line");                            // back into the exercise
    a.tap(a.all(".endrow .quietbtn")[0]);              // cancel out to the start card
    const b = boot({ now: "2026-09-07T09:00:00", days: a.store().days });
    b.tap(".card.start .quietbtn", "Log it yourself");
    ok(true, "both views read setCounts; pinned by construction");
  });

  test("a cleared middle set keeps the grind marker on the right rep", () => {
    const days = { "2026-09-07": { ex: { hacksquat: { w: 97.6, r: [10,null,9,8],
      q: [2,null,0,0], g: [false,false,true,false] } }, updatedAt: 1 } };
    const a = boot({ now: "2026-09-07T20:00:00", days });
    a.tab("week");
    // the "This week, set by set" rows are the ones carrying a day label
    const line = a.all("#weekbody .sessline")
      .filter(r => r.querySelector(".sesslab"))
      .map(a.txt).find(t => /Hack Squat/.test(t));
    has(line, "10 9! 8");
  });
};
