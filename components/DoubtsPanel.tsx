"use client";

import { useState, useEffect, useRef } from "react";
import { Doubt, useUserState } from "@/lib/userState";
import { Topic } from "@/lib/topics";
import styles from "./DoubtsPanel.module.css";

interface DoubtsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** If set, panel is scoped to this topic. If null, shows all doubts. */
  topicId: string | null;
  topics: Topic[];
}

export default function DoubtsPanel({ isOpen, onClose, topicId, topics }: DoubtsPanelProps) {
  const { addDoubt, resolveDoubt, deleteDoubt, getTopicDoubts, getAllOpenDoubts, state } =
    useUserState();
  const [newDoubtText, setNewDoubtText] = useState("");
  const [activeTab, setActiveTab] = useState<"open" | "resolved">("open");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const getDoubts = (): Doubt[] => {
    if (topicId) return getTopicDoubts(topicId);
    // All doubts
    return Object.values(state.doubts).flat();
  };

  const doubts = getDoubts();
  const openDoubts = doubts.filter((d) => !d.resolved);
  const resolvedDoubts = doubts.filter((d) => d.resolved);
  const displayedDoubts = activeTab === "open" ? openDoubts : resolvedDoubts;

  const getTopicTitle = (id: string) => topics.find((t) => t.id === id)?.title ?? id;

  const handleAdd = () => {
    if (!newDoubtText.trim() || !topicId) return;
    addDoubt(topicId, newDoubtText.trim());
    setNewDoubtText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const scopeLabel = topicId ? getTopicTitle(topicId) : "All Topics";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Doubts Panel"
        id="doubts-panel"
      >
        {/* Header */}
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Doubts</h2>
            <p className={styles.panelScope}>{scopeLabel}</p>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close doubts panel"
            id="doubts-panel-close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            id="doubts-tab-open"
            className={`${styles.tab} ${activeTab === "open" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("open")}
          >
            Open <span className={styles.tabBadge}>{openDoubts.length}</span>
          </button>
          <button
            id="doubts-tab-resolved"
            className={`${styles.tab} ${activeTab === "resolved" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("resolved")}
          >
            Resolved <span className={styles.tabBadge}>{resolvedDoubts.length}</span>
          </button>
        </div>

        {/* Add doubt input (only when scoped to a topic) */}
        {topicId && activeTab === "open" && (
          <div className={styles.addDoubt}>
            <input
              ref={inputRef}
              id="doubts-input"
              className={styles.doubtInput}
              placeholder="Type a doubt and press Enter…"
              value={newDoubtText}
              onChange={(e) => setNewDoubtText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              id="doubts-add-btn"
              className={styles.addBtn}
              onClick={handleAdd}
              disabled={!newDoubtText.trim()}
            >
              Add
            </button>
          </div>
        )}

        {/* Doubts list */}
        <div className={styles.doubtsList}>
          {displayedDoubts.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>{activeTab === "open" ? "✓" : "—"}</span>
              <p>
                {activeTab === "open"
                  ? topicId
                    ? "No open doubts for this topic."
                    : "No open doubts across any topic."
                  : "No resolved doubts yet."}
              </p>
            </div>
          ) : (
            displayedDoubts.map((doubt) => (
              <div key={doubt.id} className={`${styles.doubtCard} ${doubt.resolved ? styles.doubtResolved : ""}`}>
                {/* Topic label (only in "all" mode) */}
                {!topicId && (
                  <span className={styles.doubtTopicLabel}>{getTopicTitle(doubt.topicId)}</span>
                )}
                <p className={styles.doubtText}>{doubt.text}</p>
                <div className={styles.doubtActions}>
                  <span className={styles.doubtDate}>
                    {new Date(doubt.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className={styles.doubtBtns}>
                    {!doubt.resolved && (
                      <button
                        className={styles.resolveBtn}
                        onClick={() => resolveDoubt(doubt.topicId, doubt.id)}
                        aria-label="Mark as resolved"
                      >
                        Mark resolved
                      </button>
                    )}
                    <button
                      className={styles.deleteBtn}
                      onClick={() => deleteDoubt(doubt.topicId, doubt.id)}
                      aria-label="Delete doubt"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
