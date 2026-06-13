"use client";

import styles from "./Navbar.module.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useUserState } from "@/lib/userState";
import { Topic } from "@/lib/topics";

interface NavbarProps {
  topics?: Topic[];
}

function NavbarContent({ topics = [] }: NavbarProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "topics";
  const currentTopic = searchParams.get("topic") || "All Topics";
  const [isMounted, setIsMounted] = useState(false);

  const { state, getStreakWeek, getStreakCount, getOpenDoubtCount } = useUserState();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Date / Edition info
  const dateStr = isMounted
    ? new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  // Vol/Issue derived from week of year
  const volNo = isMounted
    ? (() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
        return `Vol. I, No. ${week}`;
      })()
    : "";

  const streakWeek = isMounted ? getStreakWeek() : [];
  const streakCount = isMounted ? getStreakCount() : 0;

  const totalTopics = topics.length;
  const completedCount = state.completedTopics.length;
  const inProgressCount = state.inProgressTopics.length;
  const pendingCount = Math.max(0, totalTopics - completedCount - inProgressCount);
  const openDoubts = isMounted ? getOpenDoubtCount() : 0;

  // Curriculum progress %
  const progressPct = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
  // Weeks to completion (rough estimate)
  const weeksLeft = inProgressCount + pendingCount > 0
    ? Math.ceil((pendingCount + inProgressCount) / 3)
    : 0;

  const navTabs = [
    { id: "topics", label: "ALL TOPICS" },
    { id: "architecture", label: "ARCHITECTURE" },
    { id: "databases", label: "DATABASES" },
    { id: "networking", label: "NETWORKING" },
    { id: "practice", label: "PRACTICE" },
    { id: "review", label: "REVIEW QUEUE" },
  ];

  return (
    <header className={styles.masthead}>
      {/* ── Top Strip: date · repo · edition ── */}
      <div className={styles.topStrip}>
        <span className={styles.topDate}>
          {dateStr && `${dateStr} · ${volNo} · `}
          <span className={styles.topEdition}>System Design Edition</span>
        </span>
        <span className={styles.topCenter}>
          <a
            href="https://github.com/abhicodbase/design-wiki"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.topRepoLink}
          >
            github.com/abhicodbase/design-wiki
          </a>
          {" · High Availability"}
        </span>
        <span className={styles.topRight}>···</span>
      </div>

      {/* ── Main Masthead Banner ── */}
      <div className={styles.mastheadMain}>
        {/* Left: edition details */}
        <div className={styles.mastheadLeft}>
          <div className={styles.editionLines}>
            <div>System Design ·</div>
            <div>Distributed Systems ·</div>
            <div>Architecture</div>
            <div className={styles.editionSub}>Daily Practice Edition ·</div>
            <div className={styles.editionSub}>Est. 2026</div>
          </div>
          {isMounted && (
            <div className={styles.progressBlock}>
              <div className={styles.progressLabel}>
                Curriculum progress · {completedCount} of {totalTopics} topics
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Center: Nameplate */}
        <div className={styles.mastheadCenter}>
          <Link href="/" className={styles.nameplate} id="navbar-home-link">
            The Design Times
          </Link>
          <div className={styles.nameplateSub}>
            SYSTEM DESIGN · ARCHITECTURE · DISTRIBUTED SYSTEMS
          </div>
        </div>

        {/* Right: Streak tracker + Edition */}
        <div className={styles.mastheadRight}>
          <div className={styles.editionBadge}>
            <div className={styles.editionBadgeTitle}>High Availability</div>
            <div className={styles.editionBadgeSub}>Edition</div>
            <div className={styles.editionBadgeEst}>Est. 2026</div>
          </div>

          {isMounted && (
            <div className={styles.streakBlock}>
              <div className={styles.streakLabel}>{streakCount}-day streak</div>
              <div className={styles.streakDays}>
                {streakWeek.map((d, i) => (
                  <span
                    key={`${d.date}-${i}`}
                    className={`${styles.streakDay} ${
                      d.active ? styles.streakDayActive : ""
                    } ${d.date === new Date().toISOString().slice(0, 10) ? styles.streakDayToday : ""}`}
                    title={d.date}
                  >
                    {d.label}
                  </span>
                ))}
              </div>
              {weeksLeft > 0 && (
                <div className={styles.streakMeta}>~{weeksLeft} weeks to completion</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Today's Focus Banner ── */}
      {isMounted && openDoubts > 0 && (
        <div className={styles.focusBanner}>
          <span className={styles.focusBadge}>TODAY&apos;S FOCUS</span>
          <span className={styles.focusText}>
            {/* Show the topic with most open doubts */}
            {(() => {
              const topicWithMostDoubts = topics
                .map((t) => ({
                  t,
                  count: (state.doubts[t.id] ?? []).filter((d) => !d.resolved).length,
                }))
                .sort((a, b) => b.count - a.count)[0];
              if (topicWithMostDoubts && topicWithMostDoubts.count > 0) {
                return (
                  <>
                    <strong>{topicWithMostDoubts.t.title}</strong>
                    {" — "}
                    {topicWithMostDoubts.count} open doubt{topicWithMostDoubts.count !== 1 ? "s" : ""}
                    {" · confidence "}
                    {state.confidence[topicWithMostDoubts.t.id]
                      ? `${state.confidence[topicWithMostDoubts.t.id]}/5`
                      : "unrated"}
                    {" — review recommended"}
                  </>
                );
              }
              return null;
            })()}
          </span>
          <span className={styles.focusRight}>{openDoubts} doubt{openDoubts !== 1 ? "s" : ""} open</span>
        </div>
      )}

      {/* ── Navigation Tab Strip ── */}
      <nav className={styles.navStrip} aria-label="Main navigation">
        {navTabs.map((tab) => {
          const isTopicFilter = ["architecture", "databases", "networking"].includes(tab.id);
          const href = isTopicFilter
            ? `/?tab=topics&topic=${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}`
            : `/?tab=${tab.id}`;
          const isActive = isTopicFilter
            ? currentTopic.toLowerCase() === tab.id
            : currentTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={href}
              id={`nav-tab-${tab.id}`}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            >
              {tab.label}
              {tab.id === "review" && openDoubts > 0 && (
                <span className={styles.navBadge}>{openDoubts}</span>
              )}
            </Link>
          );
        })}

        <button className={styles.navSearch} aria-label="Search" id="nav-search-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </nav>
    </header>
  );
}

export default function Navbar({ topics }: NavbarProps) {
  return (
    <Suspense fallback={<div style={{ height: "160px", borderBottom: "1px solid var(--border-color)" }} />}>
      <NavbarContent topics={topics} />
    </Suspense>
  );
}
