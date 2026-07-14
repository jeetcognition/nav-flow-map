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

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = { ...cors(origin), "Content-Type": "application/json" };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (request.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers });

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
