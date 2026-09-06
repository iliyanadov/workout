const { boot } = require("../harness.js");
const { eq, ok, no, has, hasNot } = require("../assert.js");

module.exports = (test) => {
  const b = (o) => boot(o);

  test("app anchors on the block's first day before the block starts", () => {
    const a = b({ now: "2026-09-05T09:00:00" });
    has(a.txt(a.one("#wtoday")), "Week 1");
    has(a.txt(a.one(".card.start .kicker")), "IN 2 DAYS");
  });

  test("the kicker never calls a future day 'today'", () => {
    hasNot(b({ now: "2026-09-05T09:00:00" }).txt(b({ now: "2026-09-05T09:00:00" }).one(".card.start .kicker")), "TODAY");
    has(b({ now: "2026-09-06T09:00:00" }).txt(b({ now: "2026-09-06T09:00:00" }).one(".card.start .kicker")), "TOMORROW");
    has(b({ now: "2026-09-07T09:00:00" }).txt(b({ now: "2026-09-07T09:00:00" }).one(".card.start .kicker")), "TODAY");
  });

  test("the day strip renders all seven days of the week", () => {
    const a = b({ now: "2026-09-07T09:00:00", days: { "2026-09-07": { ex: {}, updatedAt: 1 } } });
    a.tap(".card.start .quietbtn", "Log it yourself");
    eq(a.all("#daystrip .day").length, 7);
    eq(a.all("#daystrip .day .dow").map(a.txt), ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]);
  });

  test("training days are Mon Tue Thu Fri; the rest are rest days", () => {
    const map = {};
    for (const d of ["2026-09-07","2026-09-08","2026-09-09","2026-09-10","2026-09-11","2026-09-12","2026-09-13"]) {
      const a = b({ now: d + "T09:00:00" });
      map[d] = a.one(".card.start") ? a.txt(a.one(".card.start .bigtitle")) : a.txt(a.one(".sesstitle"));
    }
    eq(map, { "2026-09-07":"Lower A", "2026-09-08":"Upper A", "2026-09-09":"Rest day",
              "2026-09-10":"Lower B", "2026-09-11":"Upper B", "2026-09-12":"Rest day",
              "2026-09-13":"Rest day" });
  });

  test("week numbering survives the October DST change", () => {
    eq(b({ now: "2026-10-19T09:00:00" }).txt(b({ now: "2026-10-19T09:00:00" }).one("#wtoday")).slice(0,6), "Week 7");
    eq(b({ now: "2026-10-26T09:00:00" }).txt(b({ now: "2026-10-26T09:00:00" }).one("#wtoday")).slice(0,6), "Week 8");
    eq(b({ now: "2026-11-02T09:00:00" }).txt(b({ now: "2026-11-02T09:00:00" }).one("#wtoday")).slice(0,6), "Week 9");
  });

  test("week numbering crosses the year boundary and keeps counting", () => {
    has(b({ now: "2026-12-28T09:00:00" }).txt(b({ now: "2026-12-28T09:00:00" }).one("#wtoday")), "Week 17");
    has(b({ now: "2027-01-04T09:00:00" }).txt(b({ now: "2027-01-04T09:00:00" }).one("#wtoday")), "Week 18");
    has(b({ now: "2027-09-06T09:00:00" }).txt(b({ now: "2027-09-06T09:00:00" }).one("#wtoday")), "Week 53");
  });

  test("a week spanning two years shows both years in the label", () => {
    has(b({ now: "2026-12-28T09:00:00" }).txt(b({ now: "2026-12-28T09:00:00" }).one("#wtoday")), "2026");
  });

  test("cannot navigate back before the block, or forward past today", () => {
    const a = b({ now: "2026-09-07T09:00:00" });
    a.tap(".card.start .quietbtn", "Log it yourself");
    ok(a.one("#wprev").disabled, "wprev must be disabled in week 1");
    ok(a.one("#wnext").disabled, "wnext must be disabled on the anchored week");
  });

  test("from a later week you can page back but not past the horizon", () => {
    const a = b({ now: "2026-09-21T09:00:00" });
    a.tap(".card.start .quietbtn", "Log it yourself");
    no(a.one("#wprev").disabled, "wprev should be enabled in week 3");
    a.tap("#wprev"); a.tap("#wprev");
    has(a.txt(a.one("#wtoday")), "Week 1");
    ok(a.one("#wprev").disabled, "must not page before the horizon");
  });
};
