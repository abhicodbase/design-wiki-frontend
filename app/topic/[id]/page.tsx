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
          <div className={styles.overviewText}>
            {topic.overview}
          </div>
        </section>

        {/* Key Points */}
        {topic.keyPoints && topic.keyPoints.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Key Takeaways</h2>
            <ul className={styles.pointsList}>
              {topic.keyPoints.map((point, idx) => (
                <li key={idx} className={styles.pointItem}>
                  {point}
                </li>
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
                  <p className={styles.conceptDesc}>{concept.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tradeoffs */}
        {topic.tradeoffs && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Architectural Trade-offs</h2>
            <div className={styles.tradeoffsBox}>
              {topic.tradeoffs}
            </div>
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
                  <p className={styles.toolDesc}>{tool.description}</p>
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
                  <li key={idx} className={styles.tipItem}>
                    {tip}
                  </li>
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
