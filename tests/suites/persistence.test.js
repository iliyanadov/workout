const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

module.exports = (test) => {
  const logged = {
    "2026-09-07": { ex: { hacksquat: { w: 97.6, wr: [97.6,97.6,97.6,97.6], r: [9,9,8,8],
                                       q: [2,2,2,0], g: [false,false,false,false] },
                          legcurl: { w: 73, wr: [73,73,73], r: [12,11,10] } },
                    note: "felt strong", k: null, updatedAt: 1000 }
  };

  test("rendering never writes — opening a day creates no record", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    eq(a.store(), null, "boot alone must not write a log");
    a.start().warmup();
    eq(a.exRec("2026-09-07", "hacksquat"), null, "viewing a card must not persist a weight");
  });

  test("logging writes reps, the answer, the grind flag and the per-set load", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held");
    const r = a.exRec("2026-09-07", "hacksquat");
    eq(r.r, [9]); eq(r.q, [2]); eq(r.g, [false]); eq(r.wr, [97.6]); eq(r.w, 97.6);
  });

  test("a failed answer sets the grind flag only on a non-final set", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup();
    a.logSet("failed"); a.skipRest();
    eq(a.exRec("2026-09-07", "hacksquat").g, [true]);
    for (let i = 0; i < 2; i++) { a.logSet("held"); a.skipRest(); }
    a.logSet("failed");
    const g = a.exRec("2026-09-07", "hacksquat").g;
    eq(g[3], false, "the last set reaching failure is correct, not a grind");
  });

  test("changing the weight mid-exercise does not rewrite earlier sets", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held").skipRest();
    a.type(".card.open .winput", 90);
    a.logSet("held");
    eq(a.exRec("2026-09-07", "hacksquat").wr, [97.6, 90]);
  });

  test("the pending set survives a reload, so an offline session still syncs", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held");
    eq(Object.keys(a.store().pending), ["2026-09-07"]);
    const b = boot({ now: "2026-09-07T09:30:00" });
    b.w.localStorage.setItem("workout.v2", JSON.stringify(a.store()));
    const c = boot({ now: "2026-09-07T09:30:00", days: a.store().days });
    ok(c.store(), "state should reload");
  });

  test("an unreadable log is quarantined, not overwritten", () => {
    const a = boot({ now: "2026-09-07T09:00:00", local: { "workout.v2": "{ not json" } });
    eq(a.w.localStorage.getItem("workout.v2.unreadable"), "{ not json");
    has(a.txt(a.one("#syncmsg")), "unreadable");
  });

  test("a payload that parses but is not a log is also quarantined", () => {
    const a = boot({ now: "2026-09-07T09:00:00", local: { "workout.v2": '{"hello":1}' } });
    eq(a.w.localStorage.getItem("workout.v2.unreadable"), '{"hello":1}');
  });

  test("offline never reads as Synced", () => {
    const a = boot({ now: "2026-09-07T09:00:00", online: false });
    has(a.txt(a.one("#syncmsg")), "Offline");
    hasNot(a.txt(a.one("#syncmsg")), "Synced");
  });

  test("delete keeps a restorable snapshot and spares the note", () => {
    const a = boot({ now: "2026-09-14T09:00:00", days: logged });
    a.tap("#wprev");
    a.tap(a.all("#daystrip .day")[0]);
    a.tap("#exlist .quietbtn", "Delete this session");
    a.w.advance(1000);
    a.tap(a.all("#exlist .quietbtn").find(b => /^Delete/.test(a.txt(b))));
    const d = a.dayRec("2026-09-07");
    eq(d.ex, {});
    ok(d.trash, "no snapshot kept");
    eq(d.note, "felt strong", "the note is a fact about the day, not the workout");
  });

  test("a deleted session can be restored", () => {
    const a = boot({ now: "2026-09-14T09:00:00", days: logged });
    a.tap("#wprev");
    a.tap(a.all("#daystrip .day")[0]);
    a.tap("#exlist .quietbtn", "Delete this session");
    a.w.advance(1000);
    a.tap(a.all("#exlist .quietbtn").find(b => /^Delete/.test(a.txt(b))));
    a.tap("#exlist .quietbtn", "Undo delete");
    eq(a.exRec("2026-09-07", "hacksquat").r, [9,9,8,8]);
    no(a.dayRec("2026-09-07").trash, "the snapshot should be consumed");
  });

  test("the arming tap and the destructive tap are different buttons", () => {
    const a = boot({ now: "2026-09-14T09:00:00", days: logged });
    a.tap("#wprev");
    a.tap(a.all("#daystrip .day")[0]);
    a.tap("#exlist .quietbtn", "Delete this session");
    const opts = a.all("#exlist .quietbtn").map(a.txt);
    ok(opts.some(t => /Keep it/.test(t)), "no way to back out");
    ok(opts.some(t => /^Delete .* undoable today/.test(t)), "the confirm must name what goes");
  });

  test("export contains every day and every field", () => {
    const a = boot({ now: "2026-09-14T09:00:00", days: logged });
    let captured = null;
    a.w.Blob = function (parts) { captured = String(parts[0]); return { size: 1 }; };
    a.w.URL.createObjectURL = () => "blob:x"; a.w.URL.revokeObjectURL = () => {};
    a.w.File = undefined;
    a.tab("week");
    a.tap(".copybtn", "Export everything");
    const p = JSON.parse(captured);
    eq(Object.keys(p.days), ["2026-09-07"]);
    eq(p.days["2026-09-07"].ex.hacksquat.q, [2,2,2,0]);
    eq(p.days["2026-09-07"].ex.hacksquat.wr, [97.6,97.6,97.6,97.6]);
    ok(typeof p.build === "number");
  });

  test("bodyweight and protein are no longer captured anywhere", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    eq(a.one("#bw"), null);
    eq(a.one("#prot"), null);
    a.start().warmup().logSet("held").skipRest();
    a.tap(".endrow .quietbtn", "End session here");
    a.tap(".card.finish .runbtn");
    eq(a.all(".card.captures .qlab").map(a.txt), ["Anything worth saying?"]);
  });

  test("a note tag writes readable prose into the day", () => {
    const a = boot({ now: "2026-09-07T09:00:00" });
    a.start().warmup().logSet("held").skipRest();
    a.tap(".endrow .quietbtn", "End session here");
    a.tap(".card.finish .runbtn");
    a.tap(".card.captures .chip2", "Slept badly");
    eq(a.dayRec("2026-09-07").note, "Slept badly");
  });
};
