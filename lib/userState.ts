"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Doubt {
  id: string;
  topicId: string;
  text: string;
  resolved: boolean;
  createdAt: string; // ISO date
}

export interface UserState {
  completedTopics: string[];
  inProgressTopics: string[];
  doubts: Record<string, Doubt[]>; // topicId → Doubt[]
  confidence: Record<string, number>; // topicId → 1-5
  streakDays: string[]; // ISO date strings (yyyy-mm-dd), last 7 days
  recentlyViewed: string[]; // topic IDs, max 5, newest first
  lastVisit: string; // ISO date (yyyy-mm-dd)
}

const STORAGE_KEY = "design_wiki_user_state";

const DEFAULT_STATE: UserState = {
  completedTopics: [],
  inProgressTopics: [],
  doubts: {},
  confidence: {},
  streakDays: [],
  recentlyViewed: [],
  lastVisit: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): UserState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: UserState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Update streak based on today's date */
function computeStreak(prev: UserState): UserState {
  const today = todayISO();
  if (prev.lastVisit === today) return prev; // already recorded today

  const days = [...prev.streakDays];
  if (!days.includes(today)) {
    days.push(today);
  }
  // Keep only last 7 unique days
  const trimmed = days.slice(-7);
  return { ...prev, streakDays: trimmed, lastVisit: today };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUserState() {
  const [state, setStateRaw] = useState<UserState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const loaded = loadState();
    const withStreak = computeStreak(loaded);
    setStateRaw(withStreak);
    saveState(withStreak);
    setHydrated(true);
  }, []);

  const setState = useCallback((updater: (prev: UserState) => UserState) => {
    setStateRaw((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // -------------------------------------------------------------------------
  // Progress actions
  // -------------------------------------------------------------------------

  const markComplete = useCallback(
    (topicId: string) => {
      setState((prev) => ({
        ...prev,
        completedTopics: prev.completedTopics.includes(topicId)
          ? prev.completedTopics
          : [...prev.completedTopics, topicId],
        inProgressTopics: prev.inProgressTopics.filter((id) => id !== topicId),
      }));
    },
    [setState]
  );

  const markInProgress = useCallback(
    (topicId: string) => {
      setState((prev) => ({
        ...prev,
        inProgressTopics: prev.inProgressTopics.includes(topicId)
          ? prev.inProgressTopics
          : [...prev.inProgressTopics, topicId],
        completedTopics: prev.completedTopics.filter((id) => id !== topicId),
      }));
    },
    [setState]
  );

  const unmarkTopic = useCallback(
    (topicId: string) => {
      setState((prev) => ({
        ...prev,
        completedTopics: prev.completedTopics.filter((id) => id !== topicId),
        inProgressTopics: prev.inProgressTopics.filter((id) => id !== topicId),
      }));
    },
    [setState]
  );

  const getTopicStatus = useCallback(
    (topicId: string): "completed" | "inProgress" | "pending" => {
      if (state.completedTopics.includes(topicId)) return "completed";
      if (state.inProgressTopics.includes(topicId)) return "inProgress";
      return "pending";
    },
    [state]
  );

  // -------------------------------------------------------------------------
  // Confidence ratings
  // -------------------------------------------------------------------------

  const setConfidence = useCallback(
    (topicId: string, rating: number) => {
      setState((prev) => ({
        ...prev,
        confidence: { ...prev.confidence, [topicId]: Math.max(1, Math.min(5, rating)) },
      }));
    },
    [setState]
  );

  const getConfidence = useCallback(
    (topicId: string): number => state.confidence[topicId] ?? 0,
    [state]
  );

  // -------------------------------------------------------------------------
  // Doubts
  // -------------------------------------------------------------------------

  const addDoubt = useCallback(
    (topicId: string, text: string) => {
      const doubt: Doubt = {
        id: Date.now().toString(),
        topicId,
        text,
        resolved: false,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        doubts: {
          ...prev.doubts,
          [topicId]: [...(prev.doubts[topicId] ?? []), doubt],
        },
      }));
    },
    [setState]
  );

  const resolveDoubt = useCallback(
    (topicId: string, doubtId: string) => {
      setState((prev) => ({
        ...prev,
        doubts: {
          ...prev.doubts,
          [topicId]: (prev.doubts[topicId] ?? []).map((d) =>
            d.id === doubtId ? { ...d, resolved: true } : d
          ),
        },
      }));
    },
    [setState]
  );

  const deleteDoubt = useCallback(
    (topicId: string, doubtId: string) => {
      setState((prev) => ({
        ...prev,
        doubts: {
          ...prev.doubts,
          [topicId]: (prev.doubts[topicId] ?? []).filter((d) => d.id !== doubtId),
        },
      }));
    },
    [setState]
  );

  const getTopicDoubts = useCallback(
    (topicId: string): Doubt[] => state.doubts[topicId] ?? [],
    [state]
  );

  const getOpenDoubtCount = useCallback(
    (topicId?: string): number => {
      if (topicId) {
        return (state.doubts[topicId] ?? []).filter((d) => !d.resolved).length;
      }
      return Object.values(state.doubts).flat().filter((d) => !d.resolved).length;
    },
    [state]
  );

  const getAllOpenDoubts = useCallback((): Doubt[] => {
    return Object.values(state.doubts).flat().filter((d) => !d.resolved);
  }, [state]);

  // -------------------------------------------------------------------------
  // Recently viewed
  // -------------------------------------------------------------------------

  const recordView = useCallback(
    (topicId: string) => {
      setState((prev) => {
        const filtered = prev.recentlyViewed.filter((id) => id !== topicId);
        return {
          ...prev,
          recentlyViewed: [topicId, ...filtered].slice(0, 5),
        };
      });
    },
    [setState]
  );

  // -------------------------------------------------------------------------
  // Derived: Review Queue (low confidence or unrated)
  // -------------------------------------------------------------------------

  const getReviewQueue = useCallback(
    (allTopicIds: string[]): string[] => {
      return allTopicIds.filter((id) => {
        const c = state.confidence[id] ?? 0;
        return c > 0 && c <= 2; // rated but low confidence
      });
    },
    [state]
  );

  // -------------------------------------------------------------------------
  // Streak helpers
  // -------------------------------------------------------------------------

  /**
   * Returns an array of 7 objects for the current week (Mon–Sun or last 7 days).
   * Each has { label: 'M', active: boolean }
   */
  const getStreakWeek = useCallback((): { label: string; active: boolean; date: string }[] => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      result.push({
        label: days[d.getDay()],
        active: state.streakDays.includes(iso),
        date: iso,
      });
    }
    return result;
  }, [state]);

  const getStreakCount = useCallback((): number => {
    // Count consecutive days ending today
    const today = new Date();
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      if (state.streakDays.includes(iso)) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [state]);

  return {
    state,
    hydrated,
    // Progress
    markComplete,
    markInProgress,
    unmarkTopic,
    getTopicStatus,
    // Confidence
    setConfidence,
    getConfidence,
    // Doubts
    addDoubt,
    resolveDoubt,
    deleteDoubt,
    getTopicDoubts,
    getOpenDoubtCount,
    getAllOpenDoubts,
    // Recently viewed
    recordView,
    // Review queue
    getReviewQueue,
    // Streak
    getStreakWeek,
    getStreakCount,
  };
}
