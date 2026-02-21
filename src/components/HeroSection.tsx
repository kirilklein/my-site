"use client";

export default function HeroSection() {
  return (
    <section id="home" className="hero-section min-h-screen px-4 pt-28 pb-20 flex items-center">
      <div className="hero-grid-overlay" />
      <div className="w-full max-w-4xl mx-auto relative z-10">
        <div className="hero-chip font-mono text-xs md:text-sm mb-6">
          <span className="text-green-500">$</span> portfolio.boot --fast
        </div>

        <h1 className="hero-title text-4xl md:text-7xl font-bold tracking-tight text-zinc-100">
          Kiril Klein
        </h1>

        <p className="hero-subtitle mt-5 text-lg md:text-2xl text-zinc-300 max-w-2xl leading-relaxed">
          Machine Learning Engineer building production-grade AI systems,
          data platforms, and applied research tools.
        </p>

        <div className="mt-10 flex items-center gap-4">
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
