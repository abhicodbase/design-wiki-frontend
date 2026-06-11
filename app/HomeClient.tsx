"use client";

import { useState } from "react";
import Link from "next/link";
import { Topic } from "@/lib/topics";
import styles from "./Home.module.css";

export default function HomeClient({ initialTopics }: { initialTopics: Topic[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Extract all unique categories
  const categories = ["All", ...Array.from(new Set(initialTopics.map((t) => t.category)))];

  // Filtering logic
  const filteredTopics = initialTopics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || topic.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getDifficultyClass = (difficulty: string) => {
    const d = difficulty.toLowerCase();
    if (d === "easy") return "difficulty-easy";
    if (d === "advanced" || d === "hard") return "difficulty-advanced";
    return "difficulty-intermediate";
  };

  return (
    <div className={styles.container}>
      {/* Masthead */}
      <header className={styles.masthead}>
        <div className={styles.mastheadSubtitle}>Distributed Systems & Scalable Architectures</div>
        <h1 className={styles.mastheadTitle}>System Design Wiki</h1>
        <div className={styles.mastheadMeta}>
          <span>Vol. I • No. 1</span>
          <span className={styles.metaItemCenter}>A Minimalist Handbook for Engineers</span>
          <span>{new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
        </div>
      </header>

      {/* Controls Section */}
      <section className={styles.controlsSection}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search topics, tags, concepts..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.filterBtn} ${
                selectedCategory === category ? styles.activeFilterBtn : ""
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Topics Grid */}
      <main className="animate-fade-in">
        {filteredTopics.length > 0 ? (
          <div className={styles.catalogGrid}>
            {filteredTopics.map((topic) => (
              <article key={topic.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className="category-badge">{topic.category}</span>
                  <span className={`difficulty-badge ${getDifficultyClass(topic.difficulty)}`}>
                    {topic.difficulty}
                  </span>
                </div>

                <h2 className={styles.cardTitle}>{topic.title}</h2>
                <p className={styles.cardOverview}>{topic.overview}</p>

                <div className={styles.cardFooter}>
                  <div className={styles.tagsWrapper}>
                    {topic.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className={styles.cardAction}>
                    <span className={styles.readTime}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {topic.readTime} min read
                    </span>
                    <Link href={`/topic/${topic.id}`} className={styles.readLink}>
                      Read Article
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No matching topics found</h3>
            <p className={styles.emptyText}>Try adjusting your search terms or category filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
