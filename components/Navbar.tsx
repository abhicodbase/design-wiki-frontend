"use client";

import styles from "./Navbar.module.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function NavbarContent() {
  const searchParams = useSearchParams();
  const currentTopic = searchParams.get("topic") || "All Topics";
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const dateStr = isMounted
    ? new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) + " · Vol. I, No. 1"
    : "";

  const navItems = ["All Topics", "Architecture", "Databases", "Networking", "Infrastructure"];

  return (
    <header className={styles.masthead}>
      {/* Date & Repo Info top strip */}
      <div className={styles.mastheadTop}>
        <span>{dateStr}</span>
        <span>
          <a
            href="https://github.com/abhicodbase/design-wiki"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/abhicodbase/design-wiki
          </a>{" "}
          · System Design Edition
        </span>
      </div>

      {/* Main Masthead Banner */}
      <div className={styles.mastheadMain}>
        <Link href="/" className={styles.nameplate}>
          The Design Times
        </Link>

        {/* Mascot nodey */}
        <div className={styles.mascotWrap} title="Nodey, your architecture companion">
          <svg
            width="72"
            height="82"
            viewBox="0 0 72 82"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft Shadow */}
            <ellipse cx="36" cy="79" rx="16" ry="3" fill="#0f0e0c" opacity="0.10" />

            {/* Monitor Head */}
            <rect
              x="22"
              y="12"
              width="28"
              height="20"
              rx="3"
              fill="#f5e6c8"
              stroke="#0f0e0c"
              strokeWidth="1.4"
            />
            {/* Neck */}
            <rect x="33" y="32" width="6" height="4" fill="#0f0e0c" />

            {/* Cabinet Body */}
            <rect
              x="18"
              y="36"
              width="36"
              height="38"
              rx="3"
              fill="#f5e6c8"
              stroke="#0f0e0c"
              strokeWidth="1.4"
            />

            {/* Cabinet Partition Lines */}
            <line x1="18" y1="48" x2="54" y2="48" stroke="#0f0e0c" strokeWidth="1.2" />
            <line x1="18" y1="60" x2="54" y2="60" stroke="#0f0e0c" strokeWidth="1.2" />

            {/* Blinking LEDs */}
            {/* Top Shelf */}
            <circle cx="24" cy="42" r="2" fill="#22c55e" stroke="#0f0e0c" strokeWidth="0.8" />
            <circle cx="30" cy="42" r="2" fill="#ef4444" stroke="#0f0e0c" strokeWidth="0.8" />

            {/* Mid Shelf */}
            <circle cx="24" cy="54" r="2" fill="#3b82f6" stroke="#0f0e0c" strokeWidth="0.8" />
            <circle cx="30" cy="54" r="2" fill="#22c55e" stroke="#0f0e0c" strokeWidth="0.8" />

            {/* Bottom Shelf */}
            <circle cx="24" cy="66" r="2" fill="#f59e0b" stroke="#0f0e0c" strokeWidth="0.8" />
            <circle cx="30" cy="66" r="2" fill="#3b82f6" stroke="#0f0e0c" strokeWidth="0.8" />

            {/* Eyes */}
            <circle cx="30" cy="22" r="3.5" fill="#232120" />
            <circle cx="42" cy="22" r="3.5" fill="#232120" />
            <circle cx="31.5" cy="20.5" r="1.5" fill="white" />
            <circle cx="43.5" cy="20.5" r="1.5" fill="white" />

            {/* Smile */}
            <path
              d="M33 26 Q36 29 39 26"
              stroke="#0f0e0c"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Antenna */}
            <line
              x1="36"
              y1="12"
              x2="36"
              y2="5"
              stroke="#0f0e0c"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="36" cy="4" r="2.5" fill="#e8b84b" stroke="#0f0e0c" strokeWidth="1.2" />

            {/* Speech Bubble */}
            <path
              d="M52 12 Q52 6 60 6 Q68 6 68 12 Q68 18 60 18 L56 22 L58 18 Q52 18 52 12Z"
              fill="#fdfaf3"
              stroke="#0f0e0c"
              strokeWidth="1"
            />
            <text
              x="60"
              y="14"
              fontSize="6.5"
              textAnchor="middle"
              fill="#8b1a1a"
              fontFamily="Georgia,serif"
              fontStyle="italic"
            >
              HA
            </text>
          </svg>
          <div className={styles.mascotName}>Nodey</div>
        </div>

        {/* Brand Edition right strip */}
        <div className={styles.mastheadRight}>
          <div className={styles.editionLine}>High Availability Edition</div>
          <div className={styles.editionNum}>Est. 2026</div>
        </div>
      </div>

      {/* Nav Strip categories */}
      <div className={styles.navStrip}>
        {navItems.map((item) => (
          <Link
            key={item}
            href={item === "All Topics" ? "/" : `/?topic=${item}`}
            className={`${styles.navItem} ${
              currentTopic === item ? styles.navItemActive : ""
            }`}
          >
            {item}
          </Link>
        ))}
      </div>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className={styles.navLoading}>Loading navigation...</div>}>
      <NavbarContent />
    </Suspense>
  );
}
