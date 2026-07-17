const REPO = "jeetcognition/nav-flow-map";
const FILE = "navmap-edits.json";
const ALLOWED_ORIGINS = [
  "https://jeetcognition.github.io",
  "http://localhost:8898",
  "http://localhost:8899",
];
const MAX_BYTES = 512 * 1024;

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

const REWRITE_PROMPT = `You are rewriting and promoting website edits for the nav-flow-map site into its source files.
In the repo jeetcognition/nav-flow-map, the file navmap-edits.json holds edits made on the website: "addedPages" (new graph pages), "pageOverrides" (edited page fields), "addedCases" (map of pageId -> array of rough one-liner draft test cases), "caseOverrides" (edited/rewritten case fields, keyed by case id or "<pageId>-draft-<index>"), and "addedBugs" (draft bug reports with temporary BUG-DRAFT-* ids).

Do the following:

1. REWRITE each draft in "addedCases" into a full structured test case (use any existing "<pageId>-draft-<index>" entry in "caseOverrides" if one exists):
   - suite: Sanity or Regression; pri: P1/P2/P3;
   - steps: concrete numbered steps in the same style as the existing cases in qa-testing/testcases/*.md (study a few for tone and navigation paths; page metadata is in index.html BASE_PAGES);
   - expected: a clear, specific expected result.

2. PROMOTE everything out of navmap-edits.json into the real sources:
   - Test cases: assign each rewritten case a stable ID with a prefix for its page (reuse the page's existing prefix from BASE_PAGES in index.html; if the page has none, invent a short uppercase prefix, add it to that page's "prefixes" array, and number cases <PREFIX>-SAN01/-REG01 style). Append each case as a table row in the matching qa-testing/testcases/*.md file (create a new numbered .md file for pages without one, following the existing file format), and append the same case object to the TESTCASES array in testcases.js (fields: id, type, pri, reach, steps, expected — match existing objects exactly).
   - Pages: fold each entry of "addedPages" into the BASE_PAGES array in index.html as a normal page object, and apply "pageOverrides" (label/route/desc/via edits) directly to the corresponding BASE_PAGES entries.
   - Case edits: apply "caseOverrides" that target existing case ids directly to those cases in testcases.js AND in their qa-testing/testcases/*.md row.
   - Bugs: move each entry of "addedBugs" into the BUGS array in bugs.js, replacing its BUG-DRAFT-* id with the next sequential BUG-NNN id; keep its pageId, severity, status, caseIds, links and notes as-is, but drop any caseIds that don't match an existing test case id.

3. CLEAN UP: after promoting, empty the promoted keys in navmap-edits.json ("addedPages": [], "pageOverrides": {}, "caseOverrides": {}, "addedCases": {}, "addedBugs": []) but keep "addedLinks" and "removedLinks" untouched — extra graph links are rendered from this file, not from index.html. Keep it pretty-printed with 2-space indentation.

4. VERIFY: node --check testcases.js and node --check bugs.js, and check every new case ID matches a prefix in BASE_PAGES so it renders on its node. Do not change any other content, and never renumber or edit unrelated existing cases.

5. LAYOUT (only when new pages were added): insert each promoted page into BASE_PAGES next to its siblings (right after the other children of the same parent) with the correct "parent" id, so the site's automatic tidy-tree layout keeps the graph balanced. Then open the site locally (python3 -m http.server + a headless browser) and confirm the new nodes render under their parent without overlapping neighbouring subtrees; if the layoutTree() function in index.html needs a spacing tweak to stay compact and readable, make it.

Commit all changed files (testcases.js, bugs.js, index.html, qa-testing/testcases/*.md, navmap-edits.json) directly to the main branch — do NOT open a PR.`;

function hasPromotable(edits) {
  return !!(
    edits &&
    ((edits.addedCases && Object.values(edits.addedCases).some((a) => a && a.length)) ||
      (edits.addedPages && edits.addedPages.length) ||
      (edits.pageOverrides && Object.keys(edits.pageOverrides).length) ||
      (edits.caseOverrides && Object.keys(edits.caseOverrides).length) ||
      (edits.addedBugs && edits.addedBugs.length))
  );
}

// override via a DEVIN_SESSIONS_URL env var when the org or API version changes
const DEFAULT_DEVIN_SESSIONS_URL =
  "https://api.beta.devin.ai/v3/organizations/org-4de08d443a4847d983a12e5a26c2bab0/sessions";

async function startDevinSession(env, prompt, title) {
  const res = await fetch(env.DEVIN_SESSIONS_URL || DEFAULT_DEVIN_SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DEVIN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, title }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: "Devin API " + res.status };
  return { session_id: data.session_id, url: data.url };
}

function startRewriteSession(env) {
  return startDevinSession(env, REWRITE_PROMPT, "Rewrite & promote navmap edits to source files");
}

const MAX_SUGGESTION_BYTES = 16 * 1024;

// "Suggest an improvement" box in the QA Command Center app: the session
// implements the change and opens a PR that an admin reviews and merges.
async function handleSuggest(request, env, headers) {
  let body;
  try {
    const text = await request.text();
    if (text.length > MAX_SUGGESTION_BYTES) throw new Error("payload too large");
    body = JSON.parse(text);
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid JSON: " + e.message }), {
      status: 400,
      headers,
    });
  }
  const suggestion = typeof body.suggestion === "string" ? body.suggestion.trim() : "";
  if (suggestion.length < 10)
    return new Response(JSON.stringify({ error: "suggestion too short" }), {
      status: 400,
      headers,
    });
  const context = typeof body.context === "string" ? body.context.slice(0, 500) : "";
  const prompt = `A user of the QA Command Center app (the React app in app/ of the repo ${REPO}) submitted this improvement suggestion through the in-app "Suggest an improvement" box:

---
${suggestion}
---
${
  context
    ? `
Context: ${context}
`
    : ""
}
Implement the suggestion in the repo. Work on a feature branch and open a pull request describing what you changed and why — do NOT commit directly to main; an admin reviews and merges the PR. Keep the diff focused on the suggestion, follow the repo's Prettier/oxlint/TypeScript-strict tooling (run app/'s lint and build before pushing), and if the suggestion is unclear or infeasible, open a PR that only adds your analysis to TODO.md instead.`;
  const result = await startDevinSession(env, prompt, "App suggestion: " + suggestion.slice(0, 60));
  if (result.error) return new Response(JSON.stringify(result), { status: 502, headers });
  return new Response(JSON.stringify({ ok: true, ...result }), { headers });
}

async function handleRewrite(env, headers) {
  const cur = await fetch(`https://raw.githubusercontent.com/${REPO}/main/${FILE}`, {
    headers: { "User-Agent": "navmap-save-worker" },
  });
  if (cur.ok) {
    const edits = await cur.json().catch(() => null);
    if (!hasPromotable(edits))
      return new Response(
        JSON.stringify({ error: "no edits found — add drafts or edits and Save to repo first" }),
        { status: 400, headers },
      );
  }
  const result = await startRewriteSession(env);
  if (result.error) return new Response(JSON.stringify(result), { status: 502, headers });
  return new Response(JSON.stringify({ ok: true, ...result }), { headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = { ...cors(origin), "Content-Type": "application/json" };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (request.method !== "POST")
      return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers });
    if (!ALLOWED_ORIGINS.includes(origin))
      return new Response(JSON.stringify({ error: "origin not allowed" }), {
        status: 403,
        headers,
      });

    const pathname = new URL(request.url).pathname;
    if (pathname === "/rewrite") return handleRewrite(env, headers);
    if (pathname === "/suggest") return handleSuggest(request, env, headers);

    let edits;
    try {
      const text = await request.text();
      if (text.length > MAX_BYTES) throw new Error("payload too large");
      edits = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({ error: "invalid JSON: " + e.message }), {
        status: 400,
        headers,
      });
    }
    for (const k of ["addedPages", "pageOverrides", "caseOverrides", "addedCases"]) {
      if (!(k in edits))
        return new Response(JSON.stringify({ error: "missing key " + k }), {
          status: 400,
          headers,
        });
    }

    const api = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
    const gh = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "navmap-save-worker",
    };
    let sha;
    const cur = await fetch(api, { headers: gh });
    if (cur.ok) sha = (await cur.json()).sha;

    const bytes = new TextEncoder().encode(JSON.stringify(edits, null, 2));
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    const body = { message: "Update navmap edits from the website", content: btoa(bin) };
    if (sha) body.sha = sha;

    const res = await fetch(api, { method: "PUT", headers: gh, body: JSON.stringify(body) });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return new Response(JSON.stringify({ error: "GitHub API " + res.status, detail }), {
        status: 502,
        headers,
      });
    }
    const out = { ok: true };
    if (hasPromotable(edits)) out.rewrite = await startRewriteSession(env);
    return new Response(JSON.stringify(out), { headers });
  },
};
