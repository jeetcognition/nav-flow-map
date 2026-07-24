// Minimal GitLab REST client for the disposable QA project used by REV-E2E01.
// All values are env-driven; the token needs the `api` + `write_repository` scopes.

export const GITLAB_QA_TOKEN = process.env.GITLAB_QA_API_TOKEN ?? "";
export const GITLAB_QA_HOST = process.env.GITLAB_QA_HOST ?? "gitlab.com";
export const GITLAB_QA_PROJECT_PATH =
  process.env.GITLAB_QA_PROJECT_PATH ??
  "software-quality-assurance-group/software-quality-assurance-project";
export const GITLAB_QA_DEFAULT_BRANCH = process.env.GITLAB_QA_DEFAULT_BRANCH ?? "main";

const apiBase = () =>
  `https://${GITLAB_QA_HOST}/api/v4/projects/${encodeURIComponent(GITLAB_QA_PROJECT_PATH)}`;

async function gitlabFetch(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "PRIVATE-TOKEN": GITLAB_QA_TOKEN,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`GitLab ${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  }
  return res.json();
}

export interface DisposableMr {
  iid: number;
  webUrl: string;
  sourceBranch: string;
}

/** Creates a branch with one commit and opens a merge request against the default branch. */
export async function openDisposableMr(name: string): Promise<DisposableMr> {
  const sourceBranch = name;
  await gitlabFetch("/repository/commits", {
    method: "POST",
    body: JSON.stringify({
      branch: sourceBranch,
      start_branch: GITLAB_QA_DEFAULT_BRANCH,
      commit_message: "test: add sample with an intentional bug for Devin Review",
      actions: [
        {
          action: "create",
          file_path: `src/${name}.js`,
          // The comment/implementation mismatch gives the reviewer an obvious finding.
          content:
            "export function divide(a, b) {\n  // returns the quotient\n  return a * b;\n}\n",
        },
      ],
    }),
  });
  const mr = (await gitlabFetch("/merge_requests", {
    method: "POST",
    body: JSON.stringify({
      source_branch: sourceBranch,
      target_branch: GITLAB_QA_DEFAULT_BRANCH,
      title: `QA disposable MR ${name}`,
    }),
  })) as { iid: number; web_url: string };
  return { iid: mr.iid, webUrl: mr.web_url, sourceBranch };
}

interface MrNote {
  system: boolean;
  body: string;
}

/** Returns the bodies of all non-system notes (comments) on a merge request. */
export async function fetchMrComments(iid: number): Promise<string[]> {
  const notes = (await gitlabFetch(`/merge_requests/${iid}/notes?per_page=100`)) as MrNote[];
  return notes.filter((n) => !n.system).map((n) => n.body);
}

/** Closes the merge request and deletes its source branch. */
export async function closeDisposableMr(mr: DisposableMr): Promise<void> {
  await gitlabFetch(`/merge_requests/${mr.iid}?state_event=close`, { method: "PUT" });
  const res = await fetch(
    `${apiBase()}/repository/branches/${encodeURIComponent(mr.sourceBranch)}`,
    { method: "DELETE", headers: { "PRIVATE-TOKEN": GITLAB_QA_TOKEN } },
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`GitLab branch delete failed: ${res.status}`);
  }
}
