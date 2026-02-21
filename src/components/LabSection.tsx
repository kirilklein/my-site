"use client";

import { useEffect, useRef, useState } from "react";
import CRTTerminal from "@/components/CRTTerminal";

export default function LabSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const node = sectionRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const scrolled = Math.min(travel, Math.max(0, -rect.top));
      setProgress(scrolled / travel);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const headerProgress = Math.min(1, Math.max(0, (progress - 0.05) / 0.3));
  const powerProgress = Math.min(1, Math.max(0, (progress - 0.2) / 0.55));
  const isPowered = progress > 0.33;

  return (
    <section ref={sectionRef} id="lab" className="lab-scroll-section relative h-[260vh]">
      <div className="lab-sticky-stage sticky top-0 h-screen px-4">
        <div className="w-full h-full max-w-5xl mx-auto flex items-center">
          <div className="w-full">
            <div
              className="mb-10 transition-all duration-300"
              style={{
                opacity: 0.35 + headerProgress * 0.65,
                transform: `translateY(${(1 - headerProgress) * 36}px)`,
              }}
            >
              <div className="text-green-400 font-mono mb-2">
                <span className="text-green-500">$</span> ./launch_network_viz
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-zinc-100">
                Interactive ML Lab
              </h2>
              <p className="text-zinc-400 mt-3 max-w-2xl">
                Scroll to power on the monitor and boot the network visualization.
              </p>
            </div>

            <div
              className="lab-monitor-wrap transition-all duration-300"
              style={{
                transform: `translateY(${(1 - powerProgress) * 44}px) scale(${0.96 + powerProgress * 0.04})`,
                opacity: 0.1 + powerProgress * 0.9,
              }}
            >
              <CRTTerminal mode="networkOnActivate" isActive={isPowered} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
