// Hermetic tests for the worker's /verdicts endpoint (QA-DEC-028) — run with
// `node worker/test_verdicts.mjs`; CI runs it in the Validate workflow.
// Stubs the GitHub contents API so the parse→scrub→merge→PUT path runs for real.
import worker from "./worker.js";

const puts = {};
const existing = {
  "pipelines/pylon/coverage.json": {
    aaaaaaaaaaaa: {
      status: "weak",
      coveredBy: null,
      by: "u-maya",
      updatedAt: "2026-08-01T00:00:00Z",
    },
  },
  "pipelines/pylon/labels/pending_verdicts.json": {},
};

globalThis.fetch = async (url, init = {}) => {
  const path = String(url).replace(
    "https://api.github.com/repos/jeetcognition/nav-flow-map/contents/",
    "",
  );
  if (!init.method || init.method === "GET") {
    const data = existing[path];
    if (!data) return new Response("{}", { status: 404 });
    const content = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(data))));
    return Response.json({ sha: "sha-" + path, content });
  }
  if (init.method === "PUT") {
    const body = JSON.parse(init.body);
    puts[path] = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(atob(body.content), (c) => c.charCodeAt(0))),
    );
    return Response.json({ ok: true });
  }
  throw new Error("unexpected fetch " + url);
};

const post = (payload) =>
  worker.fetch(
    new Request("https://w.dev/verdicts", {
      method: "POST",
      headers: { Origin: "http://localhost:8899", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { GITHUB_TOKEN: "t" },
  );

let failures = 0;
const check = (name, cond, detail = "") => {
  if (!cond) failures++;
  console.log(`  ${cond ? "ok  " : "FAIL"} ${name} ${cond ? "" : detail}`);
};

// 1. happy path: both ledgers, merge preserves existing entries, scrubs PII
let res = await post({
  coverage: {
    bbbbbbbbbbbb: { status: "covered", coveredBy: "ENT-REG12 (ask jeet@x.com)", by: "u-jeet" },
    BADID: { status: "covered", coveredBy: null, by: "u-jeet" },
    cccccccccccc: { status: "not-a-status", coveredBy: null, by: "u-jeet" },
  },
  tickets: {
    61158: { category: "app-bug", by: "u-jeet" },
    "not-a-number": { category: "app-bug", by: "u-jeet" },
    53476: { category: "invented", by: "u-jeet" },
  },
});
let body = await res.json();
check("happy-status-200", res.status === 200, String(res.status));
check("happy-counts", body.coverage === 1 && body.tickets === 1, JSON.stringify(body));
const cov = puts["pipelines/pylon/coverage.json"];
check("merge-keeps-existing", cov.aaaaaaaaaaaa?.status === "weak", JSON.stringify(cov));
check("merge-adds-new", cov.bbbbbbbbbbbb?.status === "covered");
check(
  "scrubs-email",
  !JSON.stringify(cov).includes("jeet@x.com"),
  JSON.stringify(cov.bbbbbbbbbbbb),
);
check("adds-timestamp", /^\d{4}-\d{2}-\d{2}T/.test(cov.bbbbbbbbbbbb?.updatedAt ?? ""));
check("drops-bad-id", !("BADID" in cov));
check("drops-bad-status", !("cccccccccccc" in cov));
const pend = puts["pipelines/pylon/labels/pending_verdicts.json"];
check("ticket-recorded", pend["61158"]?.category === "app-bug", JSON.stringify(pend));
check("drops-bad-ticket", !("not-a-number" in pend) && !("53476" in pend));

// 2. nothing valid → 400, no writes
const putCount = Object.keys(puts).length;
res = await post({ coverage: { zz: { status: "covered" } }, tickets: {} });
check("all-invalid-400", res.status === 400, String(res.status));
check("no-extra-writes", Object.keys(puts).length === putCount);

// 3. wrong origin → 403
res = await worker.fetch(
  new Request("https://w.dev/verdicts", {
    method: "POST",
    headers: { Origin: "https://evil.example" },
    body: "{}",
  }),
  { GITHUB_TOKEN: "t" },
);
check("bad-origin-403", res.status === 403, String(res.status));

if (failures) {
  console.log(`${failures} FAILURES`);
  process.exit(1);
}
console.log("verdicts smoke passed");
