"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/data/profile";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const updateProgress = () => {
      const node = sectionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const raw = -rect.top / (rect.height * 0.6);
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const titleOffset = progress * 52;
  const subtitleOffset = progress * 28;
  const contentOpacity = Math.max(0.18, 1 - progress * 1.15);
  const gridOpacity = Math.max(0.08, 0.42 - progress * 0.32);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="hero-section relative min-h-screen px-4 pt-28 pb-20 flex items-center"
    >
      <div className="hero-grid-overlay" style={{ opacity: gridOpacity }} />
      <div className="hero-cinematic-beam" />
      <div className="hero-vignette" />
      <div className="w-full max-w-4xl mx-auto relative z-10">
        <div className="hero-chip hero-reveal-chip font-mono text-xs md:text-sm mb-6">
          <span className="text-green-500">$</span> whoami
        </div>

        <h1
          className="hero-title hero-reveal-title text-4xl md:text-7xl font-bold tracking-tight text-zinc-100"
          style={{
            transform: `translateY(${titleOffset}px) scale(${1 - progress * 0.04})`,
            opacity: contentOpacity,
          }}
        >
          {profile.name}
        </h1>

        <p
          className="hero-subtitle hero-reveal-subtitle mt-5 text-lg md:text-2xl text-zinc-300 max-w-2xl leading-relaxed"
          style={{
            transform: `translateY(${subtitleOffset}px)`,
            opacity: Math.max(0.15, contentOpacity - 0.1),
          }}
        >
          {profile.tagline}
        </p>

        {/* Proof strip */}
        <div
          className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-sm"
          style={{ opacity: Math.max(0.1, contentOpacity - 0.15) }}
        >
          {profile.proof.map((item, index) => (
            <span key={item.label} className="flex items-center gap-4">
              {index > 0 && <span className="text-zinc-700">·</span>}
              <a
                href={item.href}
                target={item.href.startsWith("/") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="text-green-400/80 hover:text-green-300 transition-colors"
              >
                {item.label}
              </a>
            </span>
          ))}
        </div>

        <div
          className="hero-reveal-actions mt-10 flex items-center gap-4"
          style={{ opacity: Math.max(0.1, contentOpacity - 0.22) }}
        >
          <a href="#projects" className="hero-cta">
            View Projects
          </a>
          <a href="#lab" className="hero-cta-secondary">
            Enter Lab
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ opacity: Math.max(0, 1 - progress * 3) }}
      >
        <svg
          suppressHydrationWarning
          className="w-6 h-6 text-green-400 animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            suppressHydrationWarning
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </section>
  );
}
