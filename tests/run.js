#!/usr/bin/env node
/* Discovers suites/*.test.js, runs every case, reports pass/fail, exits non-zero
   on any failure so this can gate a deploy. */
/* Pin the timezone before anything loads jsdom. The DST cases are written for
   Europe/London, and without this the suite quietly means something different
   on another machine. */
if (!process.env.TZ) { process.env.TZ = "Europe/London"; }

const fs = require("fs");
const path = require("path");
const { Fail } = require("./assert.js");

const only = process.argv[2];
const dir = path.join(__dirname, "suites");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".test.js"))
  .filter(f => !only || f.includes(only)).sort();

let pass = 0, fail = 0, skipped = 0;
const failures = [];

(async () => {
  for (const f of files) {
    const cases = [];
    const test = (name, fn) => cases.push({ name, fn });
    test.skip = name => { cases.push({ name, skip: true }); };
    const mod = require(path.join(dir, f));
    mod(test);

    console.log("\n" + f.replace(".test.js", ""));
    for (const c of cases) {
      if (c.skip) { skipped++; console.log("  ~ " + c.name + "  (skipped)"); continue; }
      try {
        await c.fn();
        pass++;
        console.log("  ✓ " + c.name);
      } catch (e) {
        fail++;
        const where = e instanceof Fail ? "" : "  [" + e.constructor.name + "]";
        console.log("  ✗ " + c.name + where);
        console.log("      " + String(e.message).split("\n").join("\n      "));
        failures.push(f.replace(".test.js", "") + " :: " + c.name);
      }
    }
  }

  const total = pass + fail;
  console.log("\n" + "-".repeat(52));
  console.log(`  ${pass}/${total} passed` + (fail ? `, ${fail} FAILED` : "") +
              (skipped ? `, ${skipped} skipped` : ""));
  if (fail) {
    console.log("\n  failures:");
    failures.forEach(x => console.log("   - " + x));
  }
  console.log("-".repeat(52));
  process.exit(fail ? 1 : 0);
})();
