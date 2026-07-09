'use strict';

const { Octokit } = require('@octokit/rest');
const { config } = require('../config');

/**
 * Least-privilege GitHub client for the auto-publish pipeline (#18).
 * Commits multiple files (creates/updates/deletes) in a SINGLE commit using
 * the Git Trees API, then fast-forwards the branch ref — this triggers the
 * existing Pages workflow (.github/workflows/pages.yml).
 */

function getOctokit() {
  if (!config.github.token) {
    const err = new Error('GITHUB_TOKEN is not configured; cannot publish.');
    err.code = 'NO_GITHUB_TOKEN';
    throw err;
  }
  return new Octokit({ auth: config.github.token });
}

/**
 * @param {object} params
 * @param {Array<{path:string, content:string}>} params.files  files to create/update
 * @param {string[]} [params.deletions]  paths to delete
 * @param {string} params.message  commit message
 * @returns {Promise<{commit: string, url: string}>}
 */
async function commitFiles({ files = [], deletions = [], message }) {
  const octokit = getOctokit();
  const { owner, repo, branch } = config.github;

  // 1. Current branch head + base tree.
  const ref = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
  const baseCommitSha = ref.data.object.sha;
  const baseCommit = await octokit.git.getCommit({ owner, repo, commit_sha: baseCommitSha });
  const baseTreeSha = baseCommit.data.tree.sha;

  // 2. Build tree entries. Text content committed inline as utf-8 blobs.
  const treeEntries = [];
  for (const f of files) {
    treeEntries.push({ path: f.path, mode: '100644', type: 'blob', content: f.content });
  }
  for (const path of deletions) {
    // sha:null tells the Trees API to delete the path from the base tree.
    treeEntries.push({ path, mode: '100644', type: 'blob', sha: null });
  }

  if (!treeEntries.length) {
    return { commit: baseCommitSha, url: baseCommit.data.html_url, noop: true };
  }

  // 3. New tree on top of the base tree.
  const newTree = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: treeEntries,
  });

  // 4. New commit.
  const commit = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.data.sha,
    parents: [baseCommitSha],
  });

  // 5. Fast-forward the branch.
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commit.data.sha,
    force: false,
  });

  return { commit: commit.data.sha, url: commit.data.html_url };
}

/** Does a path currently exist on the target branch? */
async function fileExists(path) {
  const octokit = getOctokit();
  const { owner, repo, branch } = config.github;
  try {
    await octokit.repos.getContent({ owner, repo, path, ref: branch });
    return true;
  } catch (err) {
    if (err.status === 404) return false;
    throw err;
  }
}

module.exports = { getOctokit, commitFiles, fileExists };
