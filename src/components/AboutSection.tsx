"use client";

import useScrollReveal from "@/hooks/useScrollReveal";
import { profile } from "@/data/profile";

export default function AboutSection() {
  const { ref, isInView, progress } = useScrollReveal<HTMLElement>({ threshold: 0.2 });

  return (
    <section
      ref={ref}
      id="about"
      className="min-h-screen flex items-center justify-center px-4 py-20"
    >
      <div className="w-full max-w-3xl">
        <div
          className={`terminal-window transition-all duration-700 ${
            isInView ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: `translateY(${(1 - progress) * 12}px)` }}
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
              {profile.bio.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}

              <p className="text-green-400/70 text-sm">
                PhD dissertation: &ldquo;{profile.dissertation}&rdquo;
              </p>

              <div className="mt-6 text-green-400">
                <span className="text-green-500">$</span> cat skills.json
              </div>

              <div className="bg-black/50 rounded p-4 mt-2 overflow-x-auto">
                <pre className="text-sm text-green-300/80">
                  {JSON.stringify(profile.skills, null, 2)}
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
