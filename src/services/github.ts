import { Octokit } from "octokit";
import { RepoStructure, RepoFile } from "../types";

const octokit = new Octokit();

export async function fetchRepoData(url: string): Promise<RepoStructure> {
  // Parse URL: https://github.com/owner/repo
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");

  // Fetch file tree recursively
  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: "HEAD",
    recursive: "true",
  });

  const files: RepoFile[] = treeData.tree.map((item: any) => ({
    path: item.path,
    type: item.type === "blob" ? "file" : "dir",
    size: item.size,
  }));

  // Try to fetch README
  let readme = "";
  try {
    const { data: readmeData } = await octokit.rest.repos.getReadme({
      owner,
      repo,
    });
    readme = atob(readmeData.content);
  } catch (e) {
    console.warn("No README found");
  }

  return {
    owner,
    repo,
    files,
    readme,
  };
}
