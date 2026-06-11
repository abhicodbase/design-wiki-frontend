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

export interface RealLifeExample {
  name: string;
  description: string;
  bottlenecks: string[];
  cornerCases: string[];
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
  realLifeExamples: RealLifeExample[];
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

function parseMarkdownTopic(fileContent: string): Topic {
  const parts = fileContent.split("---");
  if (parts.length < 3) {
    throw new Error("Invalid Markdown frontmatter structure.");
  }
  
  const frontmatterText = parts[1];
  const bodyText = parts.slice(2).join("---").trim();
  
  // Parse frontmatter
  const metadata: Record<string, any> = {};
  const lines = frontmatterText.split("\n");
  let currentKey = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("-")) {
      // It's a list item under currentKey
      if (currentKey && Array.isArray(metadata[currentKey])) {
        let val = trimmed.substring(1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).replace(/\\"/g, '"');
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        metadata[currentKey].push(val);
      }
    } else {
      const idx = trimmed.indexOf(":");
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        if (value === "") {
          // Might be a list starting on next lines
          metadata[key] = [];
          currentKey = key;
        } else {
          // Simple key-value
          let parsedValue: any = value;
          if (value.startsWith('"') && value.endsWith('"')) {
            parsedValue = value.substring(1, value.length - 1).replace(/\\"/g, '"');
          } else if (value.startsWith("'") && value.endsWith("'")) {
            parsedValue = value.substring(1, value.length - 1);
          } else if (value.startsWith("[") && value.endsWith("]")) {
            parsedValue = value.substring(1, value.length - 1).split(",").map(s => {
              let tagVal = s.trim();
              if (tagVal.startsWith('"') && tagVal.endsWith('"')) {
                tagVal = tagVal.substring(1, tagVal.length - 1).replace(/\\"/g, '"');
              } else if (tagVal.startsWith("'") && tagVal.endsWith("'")) {
                tagVal = tagVal.substring(1, tagVal.length - 1);
              }
              return tagVal;
            });
          } else if (!isNaN(Number(value))) {
            parsedValue = Number(value);
          }
          metadata[key] = parsedValue;
          currentKey = "";
        }
      }
    }
  }

  // Set default structure
  const topic: Topic = {
    id: metadata.id || "",
    title: metadata.title || "",
    category: metadata.category || "",
    difficulty: metadata.difficulty || "Intermediate",
    readTime: Number(metadata.readTime) || 5,
    tags: metadata.tags || [],
    overview: "",
    keyPoints: [],
    concepts: [],
    tools: [],
    tradeoffs: "",
    interviewTips: [],
    realLifeExamples: []
  };

  // Split body into sections by "## "
  const sections = bodyText.split(/(?=^##\s)/m);
  
  // The first section before any "## " is the overview (if it doesn't start with "## ")
  if (sections[0] && !sections[0].trim().startsWith("##")) {
    topic.overview = sections[0].trim();
  }

  for (const section of sections) {
    const sectionTrimmed = section.trim();
    if (!sectionTrimmed.startsWith("##")) continue;
    
    const lines = sectionTrimmed.split("\n");
    const header = lines[0].replace("##", "").trim().toLowerCase();
    const sectionBody = lines.slice(1).join("\n").trim();

    if (header === "overview") {
      topic.overview = sectionBody;
    } else if (header === "key takeaways") {
      topic.keyPoints = sectionBody
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.startsWith("*") || l.startsWith("-"))
        .map(l => l.substring(1).trim());
    } else if (header === "core concepts") {
      // Concepts are separated by "### "
      const conceptBlocks = sectionBody.split(/(?=^###\s)/m);
      for (const block of conceptBlocks) {
        const blockTrimmed = block.trim();
        if (!blockTrimmed.startsWith("###")) continue;
        const bLines = blockTrimmed.split("\n");
        const name = bLines[0].replace("###", "").trim();
        const description = bLines.slice(1).join("\n").trim();
        topic.concepts.push({ name, description });
      }
    } else if (header === "architectural trade-offs" || header === "architectural tradeoffs") {
      topic.tradeoffs = sectionBody;
    } else if (header === "technology & tools" || header === "technology and tools") {
      topic.tools = sectionBody
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.startsWith("*") || l.startsWith("-"))
        .map(l => {
          const content = l.substring(1).trim();
          // Find **Tool Name**
          const match = content.match(/^\*\*(.*?)\*\*:\s*(.*)/);
          if (match) {
            return { name: match[1], description: match[2] };
          }
          return { name: "Tool", description: content };
        });
    } else if (header === "real-life examples & faang case studies" || header === "real-life examples" || header === "case studies") {
      const exampleBlocks = sectionBody.split(/(?=^###\s)/m);
      for (const block of exampleBlocks) {
        const blockTrimmed = block.trim();
        if (!blockTrimmed.startsWith("###")) continue;
        
        const bLines = blockTrimmed.split("\n");
        const name = bLines[0].replace("###", "").trim();
        const blockBody = bLines.slice(1).join("\n").trim();
        
        const issueSections = blockBody.split(/(?=^####\s)/m);
        let description = "";
        const bottlenecks: string[] = [];
        const cornerCases: string[] = [];

        if (issueSections[0] && !issueSections[0].trim().startsWith("####")) {
          description = issueSections[0].trim();
        }

        for (const issueSection of issueSections) {
          const isTrimmed = issueSection.trim();
          if (!isTrimmed.startsWith("####")) continue;
          
          const iLines = isTrimmed.split("\n");
          const iHeader = iLines[0].replace("####", "").trim().toLowerCase();
          const items = iLines.slice(1)
            .map(l => l.trim())
            .filter(l => l.startsWith("*") || l.startsWith("-"))
            .map(l => l.substring(1).trim());

          if (iHeader === "bottlenecks" || iHeader === "key bottlenecks" || iHeader.includes("bottleneck")) {
            bottlenecks.push(...items);
          } else if (iHeader === "corner cases" || iHeader === "failure modes" || iHeader.includes("corner")) {
            cornerCases.push(...items);
          }
        }

        topic.realLifeExamples.push({
          name,
          description,
          bottlenecks,
          cornerCases
        });
      }
    } else if (header === "interview cheat sheet & tips" || header === "interview tips" || header === "interview cheat sheet") {
      topic.interviewTips = sectionBody
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.startsWith("*") || l.startsWith("-"))
        .map(l => l.substring(1).trim());
    }
  }

  return topic;
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
        const list: Topic[] = [];
        for (const file of files) {
          const dirPath = path.join(topicsPath, file);
          const stat = fs.statSync(dirPath);
          if (stat.isDirectory()) {
            const topicMdPath = path.join(dirPath, "topic.md");
            if (fs.existsSync(topicMdPath)) {
              const content = fs.readFileSync(topicMdPath, "utf-8");
              list.push(parseMarkdownTopic(content));
            }
          }
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
          .filter((item) => item.type === "dir")
          .map(async (item) => {
            const rawRes = await fetch(`${RAW_BASE_URL}/${item.name}/topic.md`);
            if (rawRes.ok) {
              const text = await rawRes.text();
              return parseMarkdownTopic(text);
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
      const filePath = path.join(localRepo, "topics", id, "topic.md");
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        return parseMarkdownTopic(content);
      }
    } catch (e) {
      console.error(`Failed to read topic details for ${id} locally`, e);
    }
  }

  // Fallback: GitHub raw content
  try {
    const rawUrl = `${RAW_BASE_URL}/${id}/topic.md`;
    const res = await fetch(rawUrl);
    if (res.ok) {
      const text = await res.text();
      return parseMarkdownTopic(text);
    }
  } catch (e) {
    console.error(`Failed to fetch topic details for ${id} from GitHub`, e);
  }

  return null;
}
