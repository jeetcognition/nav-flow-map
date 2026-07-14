const REPO = "jeetcognition/nav-flow-map";
const FILE = "navmap-edits.json";
const ALLOWED_ORIGINS = ["https://jeetcognition.github.io", "http://localhost:8898", "http://localhost:8899"];
const MAX_BYTES = 512 * 1024;

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const REWRITE_PROMPT = `You are rewriting draft QA test cases for the nav-flow-map site.
In the repo jeetcognition/nav-flow-map, the file navmap-edits.json contains user-added draft test cases under "addedCases" (a map of pageId -> array of rough one-liner drafts). The site renders the draft at index i of page P with the key "P-draft-i", and "caseOverrides" entries keyed by that string override its displayed fields.

For EVERY draft that does not already have a rewritten override, add an entry to "caseOverrides" under the key "<pageId>-draft-<index>" with exactly these fields:
- "suite": "Sanity" or "Regression" (pick whichever fits the draft),
- "pri": "P1", "P2" or "P3",
- "steps": concrete numbered steps written in the same style as the existing cases in testcases.js and qa-testing/testcases/*.md (study a few for tone and navigation paths; page metadata is in index.html BASE_PAGES),
- "expected": a clear, specific expected result.

Keep the original draft text in "addedCases" unchanged, and do not modify any other file or any other key in navmap-edits.json. Commit the updated navmap-edits.json directly to the main branch (do NOT open a PR). Keep the JSON pretty-printed with 2-space indentation.`;

async function handleRewrite(env, headers) {
  const cur = await fetch(`https://raw.githubusercontent.com/${REPO}/main/${FILE}`, {
    headers: { "User-Agent": "navmap-save-worker" },
  });
  if (cur.ok) {
    const edits = await cur.json().catch(() => null);
    const hasDrafts = edits && edits.addedCases && Object.values(edits.addedCases).some((a) => a && a.length);
    if (!hasDrafts)
      return new Response(JSON.stringify({ error: "no drafts found — add draft test cases and Save to repo first" }), { status: 400, headers });
  }
  const res = await fetch("https://api.beta.devin.ai/v3/organizations/org-4de08d443a4847d983a12e5a26c2bab0/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DEVIN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: REWRITE_PROMPT, title: "Rewrite navmap draft test cases" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    return new Response(JSON.stringify({ error: "Devin API " + res.status, detail: JSON.stringify(data).slice(0, 300) }), { status: 502, headers });
  return new Response(JSON.stringify({ ok: true, session_id: data.session_id, url: data.url }), { headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = { ...cors(origin), "Content-Type": "application/json" };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (request.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers });

    if (new URL(request.url).pathname === "/rewrite") return handleRewrite(env, headers);

    let edits;
    try {
      const text = await request.text();
      if (text.length > MAX_BYTES) throw new Error("payload too large");
      edits = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({ error: "invalid JSON: " + e.message }), { status: 400, headers });
    }
    for (const k of ["addedPages", "pageOverrides", "caseOverrides", "addedCases"]) {
      if (!(k in edits)) return new Response(JSON.stringify({ error: "missing key " + k }), { status: 400, headers });
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
      return new Response(JSON.stringify({ error: "GitHub API " + res.status, detail }), { status: 502, headers });
    }
    return new Response(JSON.stringify({ ok: true }), { headers });
  },
};
