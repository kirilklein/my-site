"use client";

import { useEffect, useRef, useState } from "react";

export default function AboutSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="min-h-screen flex items-center justify-center px-4 py-20"
    >
      <div className="w-full max-w-3xl">
        <div
          className={`terminal-window transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-t-lg border-b border-zinc-700">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-4 text-zinc-400 text-sm font-mono">about.sh</span>
          </div>

          {/* Terminal content */}
          <div className="bg-zinc-900/90 rounded-b-lg p-6 md:p-8 font-mono border border-zinc-800 border-t-0">
            <div className="text-green-400 mb-4">
              <span className="text-green-500">$</span> cat about.txt
            </div>

            <div className="text-green-300/90 space-y-4 leading-relaxed">
              <p>
                I&apos;m a Machine Learning Engineer and Data Scientist passionate
                about building intelligent systems that solve real-world problems.
              </p>

              <p>
                My work spans the full ML lifecycle: from exploratory data analysis
                and feature engineering to model development, optimization, and
                deployment at scale.
              </p>

              <div className="mt-6 text-green-400">
                <span className="text-green-500">$</span> cat skills.json
              </div>

              <div className="bg-black/50 rounded p-4 mt-2">
                <pre className="text-sm text-green-300/80">
{`{
  "languages": ["Python", "SQL", "R"],
  "ml_frameworks": ["PyTorch", "TensorFlow", "scikit-learn"],
  "data": ["Pandas", "Spark", "PostgreSQL"],
  "tools": ["Docker", "Git", "Linux"],
  "cloud": ["AWS", "GCP"]
}`}
                </pre>
              </div>
            </div>

            <div className="mt-6 text-green-400">
              <span className="text-green-500">$</span>{" "}
              <span className="cursor-blink">▊</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
