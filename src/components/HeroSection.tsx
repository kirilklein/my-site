"use client";

import useScrollReveal from "@/hooks/useScrollReveal";

export default function HeroSection() {
  const { ref, progress } = useScrollReveal<HTMLElement>({ threshold: 0.15 });
  const clamped = Math.min(1, Math.max(0, progress));
  const titleOffset = clamped * 52;
  const subtitleOffset = clamped * 28;
  const contentOpacity = Math.max(0.18, 1 - clamped * 1.15);
  const gridOpacity = Math.max(0.08, 0.42 - clamped * 0.32);

  return (
    <section
      ref={ref}
      id="home"
      className="hero-section min-h-screen px-4 pt-28 pb-20 flex items-center"
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
            transform: `translateY(${titleOffset}px) scale(${1 - clamped * 0.04})`,
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
    </section>
  );
}
