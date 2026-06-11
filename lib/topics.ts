const GITHUB_REPO_OWNER = "abhicodbase";
const GITHUB_REPO_NAME = "design-wiki";
const BRANCH = "main";
const BASE_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/topics`;
const RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${BRANCH}/topics`;

export interface Concept {
  name: string;
  description: string;
}

export interface Tool {
  name: string;
  description: string;
}

export interface Topic {
  id: string;
  title: string;
  category: string;
  difficulty: "Easy" | "Intermediate" | "Advanced" | string;
  readTime: number;
  tags: string[];
  overview: string;
  keyPoints: string[];
  concepts: Concept[];
  tools: Tool[];
  tradeoffs: string;
  interviewTips: string[];
}

interface GitHubContentItem {
  name: string;
  download_url: string;
  type: string;
}

// Dynamically check local repo path asynchronously
async function getLocalRepoPath(): Promise<string | null> {
  if (typeof window !== "undefined") return null;
  try {
    const fs = await import("fs");
    const path = await import("path");
    const localPath = path.resolve(process.cwd(), "../design-wiki");
    if (fs.existsSync(localPath)) {
      return localPath;
    }
  } catch (e) {
    console.error("Error checking local repository path", e);
  }
  return null;
}

async function fetchGitHub(url: string) {
  const isDev = process.env.NODE_ENV === "development";
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, {
    next: { revalidate: isDev ? 0 : 300 },
    headers,
  });
  
  if (!res.ok) {
    console.error(`GitHub API failed for ${url}: ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json();
}

export async function fetchTopics(): Promise<Topic[]> {
  // Client-side: Fetch from API route to bypass rate limits
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/topics");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Error fetching topics from API", e);
    }
    return [];
  }

  // Server-side: Try to read from local filesystem first
  const localRepo = await getLocalRepoPath();
  if (localRepo) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const topicsPath = path.join(localRepo, "topics");
      if (fs.existsSync(topicsPath)) {
        const files = fs.readdirSync(topicsPath);
        const jsonFiles = files.filter((f: string) => f.endsWith(".json"));
        const list: Topic[] = [];
        for (const file of jsonFiles) {
          const content = fs.readFileSync(path.join(topicsPath, file), "utf-8");
          list.push(JSON.parse(content));
        }
        return list;
      }
    } catch (e) {
      console.error("Failed to read topics from local filesystem", e);
    }
  }

  // Fallback: GitHub API
  try {
    const contents = await fetchGitHub(BASE_URL);
    if (contents && Array.isArray(contents)) {
      const topics = await Promise.all(
        (contents as GitHubContentItem[])
          .filter((item) => item.name.endsWith(".json"))
          .map(async (item) => {
            const rawRes = await fetch(item.download_url);
            if (rawRes.ok) {
              return await rawRes.json();
            }
            return null;
          })
      );
      return topics.filter((t) => t !== null) as Topic[];
    }
  } catch (e) {
    console.error("Failed to fetch topics from GitHub", e);
  }

  return [];
}

export async function fetchTopicDetails(id: string): Promise<Topic | null> {
  // Client-side: Fetch from API route
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/topics/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error(`Error fetching topic details for ${id}`, e);
    }
    return null;
  }

  // Server-side: Try to read from local filesystem
  const localRepo = await getLocalRepoPath();
  if (localRepo) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(localRepo, "topics", `${id}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(content);
      }
    } catch (e) {
      console.error(`Failed to read topic details for ${id} locally`, e);
    }
  }

  // Fallback: GitHub raw content
  try {
    const rawUrl = `${RAW_BASE_URL}/${id}.json`;
    const res = await fetch(rawUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error(`Failed to fetch topic details for ${id} from GitHub`, e);
  }

  return null;
}
