"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Topic } from "@/lib/topics";
import { useUserState } from "@/lib/userState";
import DoubtsPanel from "@/components/DoubtsPanel";
import styles from "./Home.module.css";

// ── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({
  topicId,
  rating,
  onRate,
}: {
  topicId: string;
  rating: number;
  onRate: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className={styles.stars} aria-label={`Confidence: ${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          id={`star-${topicId}-${i}`}
          className={`${styles.star} ${i <= (hovered || rating) ? styles.starFilled : ""}`}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onRate(i)}
          aria-label={`Rate ${i} out of 5`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Topic Card ───────────────────────────────────────────────────────────────
interface TopicCardProps {
  topic: Topic;
  onOpenDoubts: (topicId: string) => void;
}

function TopicCard({ topic, onOpenDoubts }: TopicCardProps) {
  const { getTopicStatus, markComplete, markInProgress, unmarkTopic, setConfidence, getConfidence, getOpenDoubtCount, recordView } =
    useUserState();

  const status = getTopicStatus(topic.id);
  const confidence = getConfidence(topic.id);
  const openDoubts = getOpenDoubtCount(topic.id);

  const getDifficultyClass = (d: string) => {
    const dl = d.toLowerCase();
    if (dl === "easy") return "difficulty-easy";
    if (dl === "advanced" || dl === "hard") return "difficulty-advanced";
    return "difficulty-intermediate";
  };

  const cycleStatus = () => {
    if (status === "pending") markInProgress(topic.id);
    else if (status === "inProgress") markComplete(topic.id);
    else unmarkTopic(topic.id);
  };

  const statusLabel: Record<string, string> = {
    pending: "Start",
    inProgress: "Mark done",
    completed: "Undo",
  };

  return (
    <article
      className={`${styles.card} ${styles[`card--${status}`]}`}
      id={`topic-card-${topic.id}`}
    >
      {/* Card top row */}
      <div className={styles.cardHeader}>
        <div className={styles.cardBadges}>
          <span className="category-badge">{topic.category}</span>
          <span className={`difficulty-badge ${getDifficultyClass(topic.difficulty)}`}>
            {topic.difficulty}
          </span>
        </div>
        <div className={styles.cardHeaderRight}>
          {status === "completed" && <span className={styles.completedCheck}>✓</span>}
          {status === "inProgress" && <span className={styles.inProgressDot} />}
          <button
            className={styles.bookmarkBtn}
            id={`bookmark-${topic.id}`}
            title="Add doubt for this topic"
            onClick={() => onOpenDoubts(topic.id)}
            aria-label="Manage doubts"
          >
            {openDoubts > 0 ? (
              <span className={styles.doubtBadge}>{openDoubts}</span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <h2 className={styles.cardTitle}>
        <Link
          href={`/topic/${topic.id}`}
          onClick={() => recordView(topic.id)}
          className={styles.cardTitleLink}
        >
          {topic.title}
        </Link>
      </h2>
      <p className={styles.cardOverview}>{topic.overview}</p>

      {/* Tags */}
      <div className={styles.tagsWrapper}>
        {topic.tags.slice(0, 4).map((tag) => (
          <span key={tag} className={styles.tag}>#{tag}</span>
        ))}
      </div>

      {/* Card footer */}
      <div className={styles.cardFooter}>
        <div className={styles.cardFooterLeft}>
          <span className={styles.readTime}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {topic.readTime}m
          </span>
          <StarRating topicId={topic.id} rating={confidence} onRate={(r) => setConfidence(topic.id, r)} />
        </div>

        <div className={styles.cardFooterRight}>
          <button
            id={`status-${topic.id}`}
            className={`${styles.statusBtn} ${styles[`statusBtn--${status}`]}`}
            onClick={cycleStatus}
          >
            {statusLabel[status]}
          </button>
          <Link
            href={`/topic/${topic.id}`}
            className={styles.readLink}
            onClick={() => recordView(topic.id)}
            id={`read-${topic.id}`}
          >
            Read
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Open doubts preview */}
      {openDoubts > 0 && (
        <button
          className={styles.doubtPreview}
          onClick={() => onOpenDoubts(topic.id)}
          id={`doubt-preview-${topic.id}`}
        >
          <span className={styles.doubtPreviewIcon}>?</span>
          <span>
            {openDoubts} open doubt{openDoubts !== 1 ? "s" : ""}
          </span>
          <span className={styles.doubtPreviewArrow}>→</span>
        </button>
      )}
    </article>
  );
}

// ── Main HomeClient ──────────────────────────────────────────────────────────
function HomeClientContent({ initialTopics }: { initialTopics: Topic[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [doubtsPanelOpen, setDoubtsPanelOpen] = useState(false);
  const [doubtsPanelTopicId, setDoubtsPanelTopicId] = useState<string | null>(null);

  const currentTab = searchParams.get("tab") || "topics";
  const selectedCategory = searchParams.get("topic") || "All Topics";

  const {
    state,
    hydrated,
    getTopicStatus,
    getConfidence,
    getOpenDoubtCount,
    getAllOpenDoubts,
    getReviewQueue,
  } = useUserState();

  // ── Categorised topics ────────────────────────────────────────────────────
  const categories = Array.from(new Set(initialTopics.map((t) => t.category)));

  const filterTopics = (topics: Topic[]) =>
    topics.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.overview.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesCat =
        selectedCategory === "All Topics" ||
        t.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCat;
    });

  const filteredTopics = filterTopics(initialTopics);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalTopics = initialTopics.length;
  const completedCount = state.completedTopics.length;
  const inProgressCount = state.inProgressTopics.length;
  const pendingCount = Math.max(0, totalTopics - completedCount - inProgressCount);
  const openDoubtsCount = hydrated ? getOpenDoubtCount() : 0;

  // ── Sidebar category counts ───────────────────────────────────────────────
  const getSidebarCount = (category: string) => {
    const cat = initialTopics.filter((t) => t.category === category);
    const done = cat.filter((t) => state.completedTopics.includes(t.id)).length;
    return `${done}/${cat.length}`;
  };

  // ── Recently viewed ───────────────────────────────────────────────────────
  const recentlyViewed = hydrated
    ? state.recentlyViewed
        .map((id) => initialTopics.find((t) => t.id === id))
        .filter(Boolean) as Topic[]
    : [];

  // ── Review Queue ──────────────────────────────────────────────────────────
  const reviewQueue = hydrated
    ? getReviewQueue(initialTopics.map((t) => t.id))
        .map((id) => initialTopics.find((t) => t.id === id))
        .filter(Boolean) as Topic[]
    : [];

  // ── Open doubts panel ─────────────────────────────────────────────────────
  const openDoubtsPanel = (topicId: string | null) => {
    setDoubtsPanelTopicId(topicId);
    setDoubtsPanelOpen(true);
  };

  // ── Sidebar items ─────────────────────────────────────────────────────────
  const sidebarTopicItems = [
    { label: "All topics", count: totalTopics, href: "/?tab=topics", active: selectedCategory === "All Topics" && currentTab === "topics" },
    ...categories.map((cat) => ({
      label: cat,
      count: getSidebarCount(cat),
      href: `/?tab=topics&topic=${cat}`,
      active: selectedCategory === cat,
    })),
  ];

  const sidebarStudyItems = [
    {
      label: "Doubts",
      badge: openDoubtsCount > 0 ? openDoubtsCount : null,
      onClick: () => openDoubtsPanel(null),
      id: "sidebar-doubts",
    },
    {
      label: "Practice mode",
      badge: null,
      href: "/?tab=practice",
      id: "sidebar-practice",
    },
    {
      label: "Review queue",
      badge: reviewQueue.length > 0 ? reviewQueue.length : null,
      href: "/?tab=review",
      id: "sidebar-review",
    },
    {
      label: "Dep. graph",
      badge: null,
      href: "/?tab=graph",
      id: "sidebar-graph",
    },
    {
      label: "Shortcuts",
      badge: null,
      href: "/?tab=shortcuts",
      id: "sidebar-shortcuts",
    },
  ];

  // ── Render content by tab ─────────────────────────────────────────────────
  const renderMainContent = () => {
    if (currentTab === "review") {
      return (
        <div className={styles.contentSection}>
          <h2 className={styles.sectionTitle}>Review Queue</h2>
          <p className={styles.sectionMeta}>
            Topics rated 1–2 stars — needs revisiting
          </p>
          {reviewQueue.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Review queue is empty</p>
              <p className={styles.emptyText}>Rate topics with 1–2 stars to add them here.</p>
            </div>
          ) : (
            <div className={styles.topicsGrid}>
              {reviewQueue.map((t) => (
                <TopicCard key={t.id} topic={t} onOpenDoubts={openDoubtsPanel} />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (currentTab === "practice") {
      return (
        <div className={styles.contentSection}>
          <h2 className={styles.sectionTitle}>Practice Mode</h2>
          <div className={styles.comingSoon}>
            <div className={styles.comingSoonIcon}>⚡</div>
            <h3 className={styles.comingSoonTitle}>Coming Soon</h3>
            <p className={styles.comingSoonText}>
              Flashcard-style practice mode with spaced repetition is in development.
            </p>
          </div>
        </div>
      );
    }

    if (currentTab === "graph") {
      return (
        <div className={styles.contentSection}>
          <h2 className={styles.sectionTitle}>Dependency Graph</h2>
          <div className={styles.comingSoon}>
            <div className={styles.comingSoonIcon}>🕸</div>
            <h3 className={styles.comingSoonTitle}>Coming Soon</h3>
            <p className={styles.comingSoonText}>
              Visual dependency graph showing topic relationships and learning paths.
            </p>
          </div>
        </div>
      );
    }

    if (currentTab === "shortcuts") {
      return (
        <div className={styles.contentSection}>
          <h2 className={styles.sectionTitle}>Shortcuts</h2>
          <div className={styles.shortcutGrid}>
            {[
              { key: "D", label: "Open doubts panel" },
              { key: "R", label: "Go to Review Queue" },
              { key: "P", label: "Go to Practice" },
              { key: "G", label: "Go to Dep. Graph" },
              { key: "/", label: "Focus search" },
              { key: "Esc", label: "Close panel / modal" },
            ].map((s) => (
              <div key={s.key} className={styles.shortcutRow}>
                <kbd className={styles.kbd}>{s.key}</kbd>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default: Topics tab
    return (
      <>
        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard} id="stat-completed">
            <span className={styles.statNum}>{completedCount}</span>
            <span className={styles.statLabel}>Completed</span>
            <span className={styles.statSub}>of {totalTopics} topics</span>
          </div>
          <div className={styles.statCard} id="stat-inprogress">
            <span className={styles.statNum}>{inProgressCount}</span>
            <span className={styles.statLabel}>In progress</span>
            <span className={styles.statSub}>started</span>
          </div>
          <div className={styles.statCard} id="stat-pending">
            <span className={styles.statNum}>{pendingCount}</span>
            <span className={styles.statLabel}>Pending</span>
            <span className={styles.statSub}>not started</span>
          </div>
          <div className={`${styles.statCard} ${openDoubtsCount > 0 ? styles.statCardAlert : ""}`} id="stat-doubts">
            <span className={`${styles.statNum} ${openDoubtsCount > 0 ? styles.statNumAlert : ""}`}>
              {openDoubtsCount}
            </span>
            <span className={styles.statLabel}>Open doubts</span>
            <span className={styles.statSub}>unresolved</span>
          </div>
        </div>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className={styles.contentSection}>
            <h3 className={styles.sectionTitle}>Recently Viewed</h3>
            <div className={styles.recentList}>
              {recentlyViewed.map((t) => (
                <Link
                  key={t.id}
                  href={`/topic/${t.id}`}
                  className={styles.recentItem}
                  id={`recent-${t.id}`}
                >
                  <span className={styles.recentTitle}>{t.title}</span>
                  <span className={styles.recentMeta}>{t.category}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Topics grouped by category */}
        {filteredTopics.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No matching topics found</p>
            <p className={styles.emptyText}>Try adjusting your search or category filter.</p>
          </div>
        ) : (
          selectedCategory === "All Topics" ? (
            // Group by category
            categories
              .map((cat) => {
                const catTopics = filteredTopics.filter((t) => t.category === cat);
                if (catTopics.length === 0) return null;
                return (
                  <div key={cat} className={styles.contentSection}>
                    <div className={styles.sectionHeader}>
                      <h3 className={styles.sectionTitle}>{cat.toUpperCase()}</h3>
                      <Link href={`/?tab=topics&topic=${cat}`} className={styles.seeAll} id={`see-all-${cat}`}>
                        see all →
                      </Link>
                    </div>
                    <div className={styles.topicsGrid}>
                      {catTopics.slice(0, 4).map((t) => (
                        <TopicCard key={t.id} topic={t} onOpenDoubts={openDoubtsPanel} />
                      ))}
                    </div>
                  </div>
                );
              })
              .filter(Boolean)
          ) : (
            <div className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>{selectedCategory.toUpperCase()}</h3>
                <span className={styles.sectionMeta}>{filteredTopics.length} topics</span>
              </div>
              <div className={styles.topicsGrid}>
                {filteredTopics.map((t) => (
                  <TopicCard key={t.id} topic={t} onOpenDoubts={openDoubtsPanel} />
                ))}
              </div>
            </div>
          )
        )}
      </>
    );
  };

  return (
    <>
      <div className={styles.layout}>
        {/* ── Left Sidebar ── */}
        <aside className={styles.sidebar} id="main-sidebar">
          {/* Search */}
          <div className={styles.searchWrap}>
            <input
              id="sidebar-search"
              type="text"
              placeholder="Search topics…"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search topics"
            />
          </div>

          {/* Topics section */}
          <div className={styles.sidebarGroup}>
            <span className={styles.sidebarGroupLabel}>TOPICS</span>
            {sidebarTopicItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                id={`sidebar-topic-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`${styles.sidebarItem} ${item.active ? styles.sidebarItemActive : ""}`}
              >
                <span className={styles.sidebarItemIcon}>
                  {item.label === "All topics" ? "⊞" : "○"}
                </span>
                <span className={styles.sidebarItemLabel}>{item.label}</span>
                <span className={styles.sidebarItemCount}>{item.count}</span>
              </Link>
            ))}
          </div>

          {/* Study section */}
          <div className={styles.sidebarGroup}>
            <span className={styles.sidebarGroupLabel}>STUDY</span>
            {sidebarStudyItems.map((item) => {
              const content = (
                <>
                  <span className={styles.sidebarItemIcon}>◇</span>
                  <span className={styles.sidebarItemLabel}>{item.label}</span>
                  {item.badge != null && (
                    <span className={styles.sidebarBadge}>{item.badge}</span>
                  )}
                </>
              );

              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    id={item.id}
                    className={styles.sidebarItem}
                    onClick={item.onClick}
                  >
                    {content}
                  </button>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  id={item.id}
                  className={`${styles.sidebarItem} ${currentTab === item.id.replace("sidebar-", "") ? styles.sidebarItemActive : ""}`}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className={`${styles.mainContent} animate-fade-in`} id="main-content">
          {renderMainContent()}
        </main>
      </div>

      {/* Doubts Panel (portal) */}
      <DoubtsPanel
        isOpen={doubtsPanelOpen}
        onClose={() => setDoubtsPanelOpen(false)}
        topicId={doubtsPanelTopicId}
        topics={initialTopics}
      />
    </>
  );
}

export default function HomeClient({ initialTopics }: { initialTopics: Topic[] }) {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner} />
        </div>
      }
    >
      <HomeClientContent initialTopics={initialTopics} />
    </Suspense>
  );
}
