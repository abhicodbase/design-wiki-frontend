import { fetchTopicDetails } from "@/lib/topics";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import styles from "./Topic.module.css";

// Dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const topic = await fetchTopicDetails(id);
  if (!topic) {
    return {
      title: "Topic Not Found | System Design Wiki",
    };
  }
  return {
    title: `${topic.title} - System Design Wiki`,
    description: topic.overview,
    keywords: [...topic.tags, topic.category, "system design", "architecture"],
  };
}

export const revalidate = 0;

/** Converts inline Markdown to safe HTML for dangerouslySetInnerHTML.
 *  Supports: **bold**, *italic*, `code`, [text](url), and → / ≈ symbols.
 */
function renderInline(text: string): string {
  return text
    // Bold **text** or __text__
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    // Italic *text* (not already inside **)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    // Inline code `text`
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // [link text](url)
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topic = await fetchTopicDetails(id);

  if (!topic) {
    notFound();
  }

  const getDifficultyClass = (difficulty: string) => {
    const d = difficulty.toLowerCase();
    if (d === "easy") return "difficulty-easy";
    if (d === "advanced" || d === "hard") return "difficulty-advanced";
    return "difficulty-intermediate";
  };

  return (
    <div className={styles.container}>
      {/* Back Button */}
      <Link href="/" className={styles.backBtn}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Catalog
      </Link>

      {/* Article Header */}
      <header className={styles.header}>
        <div className={styles.metaRow}>
          <span className="category-badge">{topic.category}</span>
          <span className={`difficulty-badge ${getDifficultyClass(topic.difficulty)}`}>
            {topic.difficulty}
          </span>
          <span className={styles.tag} style={{ fontFamily: "var(--font-mono)" }}>
            🕒 {topic.readTime} min read
          </span>
        </div>

        <h1 className={styles.title}>{topic.title}</h1>

        <div className={styles.tags}>
          {topic.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      </header>

      {/* Article Body */}
      <main className="animate-fade-in">
        {/* Overview */}
        <section className={styles.section}>
          <div
            className={styles.overviewText}
            dangerouslySetInnerHTML={{ __html: renderInline(topic.overview) }}
          />
        </section>

        {/* Key Points */}
        {topic.keyPoints && topic.keyPoints.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Key Takeaways</h2>
            <ul className={styles.pointsList}>
              {topic.keyPoints.map((point, idx) => (
                <li
                  key={idx}
                  className={styles.pointItem}
                  dangerouslySetInnerHTML={{ __html: renderInline(point) }}
                />
              ))}
            </ul>
          </section>
        )}

        {/* Core Concepts */}
        {topic.concepts && topic.concepts.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Core Concepts</h2>
            <div className={styles.conceptsGrid}>
              {topic.concepts.map((concept, idx) => (
                <div key={idx} className={styles.conceptCard}>
                  <h3 className={styles.conceptName}>{concept.name}</h3>
                  <p
                    className={styles.conceptDesc}
                    dangerouslySetInnerHTML={{ __html: renderInline(concept.description) }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tradeoffs */}
        {topic.tradeoffs && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Architectural Trade-offs</h2>
            <div
              className={styles.tradeoffsBox}
              dangerouslySetInnerHTML={{ __html: renderInline(topic.tradeoffs) }}
            />
          </section>
        )}

        {/* Tools */}
        {topic.tools && topic.tools.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Technology & Tools</h2>
            <div className={styles.toolsGrid}>
              {topic.tools.map((tool, idx) => (
                <div key={idx} className={styles.toolCard}>
                  <h3 className={styles.toolName}>{tool.name}</h3>
                  <p
                    className={styles.toolDesc}
                    dangerouslySetInnerHTML={{ __html: renderInline(tool.description) }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Real-Life Examples & Case Studies */}
        {topic.realLifeExamples && topic.realLifeExamples.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Real-Life Examples & FAANG Case Studies
            </h2>
            <div className={styles.examplesContainer}>
              {topic.realLifeExamples.map((example, idx) => (
                <div key={idx} className={styles.exampleCard}>
                  <div className={styles.exampleHeader}>
                    <h3 className={styles.exampleName}>{example.name}</h3>
                  </div>
                  <p
                    className={styles.exampleDesc}
                    dangerouslySetInnerHTML={{ __html: renderInline(example.description) }}
                  />
                  
                  <div className={styles.issuesGrid}>
                    {/* Bottlenecks */}
                    {example.bottlenecks && example.bottlenecks.length > 0 && (
                      <div className={`${styles.issueBlock} ${styles.bottlenecks}`}>
                        <h4 className={styles.issueTitle}>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          Key Bottlenecks & Scale Limits
                        </h4>
                        <ul className={styles.issueList}>
                          {example.bottlenecks.map((bottleneck, bIdx) => (
                            <li
                              key={bIdx}
                              className={styles.issueItem}
                              dangerouslySetInnerHTML={{ __html: renderInline(bottleneck) }}
                            />
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Corner Cases */}
                    {example.cornerCases && example.cornerCases.length > 0 && (
                      <div className={`${styles.issueBlock} ${styles.cornerCases}`}>
                        <h4 className={styles.issueTitle}>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          Interview Corner Cases & Failure Modes
                        </h4>
                        <ul className={styles.issueList}>
                          {example.cornerCases.map((cornerCase, cIdx) => (
                            <li
                              key={cIdx}
                              className={styles.issueItem}
                              dangerouslySetInnerHTML={{ __html: renderInline(cornerCase) }}
                            />
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interview Tips */}
        {topic.interviewTips && topic.interviewTips.length > 0 && (
          <section className={styles.section}>
            <div className={styles.tipsCard}>
              <h2 className={styles.tipsTitle}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Interview Cheat Sheet & Tips
              </h2>
              <ul className={styles.tipsList}>
                {topic.interviewTips.map((tip, idx) => (
                  <li
                    key={idx}
                    className={styles.tipItem}
                    dangerouslySetInnerHTML={{ __html: renderInline(tip) }}
                  />
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      {/* Navigation Footer */}
      <footer className={styles.navigationFooter}>
        <Link href="/" className={styles.backBtn} style={{ marginBottom: 0 }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Catalog
        </Link>
      </footer>
    </div>
  );
}
