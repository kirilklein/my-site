"use client";

import { useEffect, useRef, useState } from "react";

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
          <span className="text-green-500">$</span> portfolio.boot --fast
        </div>

        <h1
          className="hero-title hero-reveal-title text-4xl md:text-7xl font-bold tracking-tight text-zinc-100"
          style={{
            transform: `translateY(${titleOffset}px) scale(${1 - progress * 0.04})`,
            opacity: contentOpacity,
          }}
        >
          Kiril Klein
        </h1>

        <p
          className="hero-subtitle hero-reveal-subtitle mt-5 text-lg md:text-2xl text-zinc-300 max-w-2xl leading-relaxed"
          style={{
            transform: `translateY(${subtitleOffset}px)`,
            opacity: Math.max(0.15, contentOpacity - 0.1),
          }}
        >
          Machine Learning Engineer building production-grade AI systems,
          data platforms, and applied research tools.
        </p>

        <div
          className="hero-reveal-actions mt-10 flex items-center gap-4"
          style={{ opacity: Math.max(0.1, contentOpacity - 0.22) }}
        >
          <a href="#lab" className="hero-cta">
            Enter Lab
          </a>
          <a href="#projects" className="hero-cta-secondary">
            View Projects
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ opacity: Math.max(0, 1 - progress * 3) }}
      >
        <svg
          className="w-6 h-6 text-green-400 animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
