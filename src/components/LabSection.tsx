"use client";

import CRTTerminal from "@/components/CRTTerminal";
import useScrollReveal from "@/hooks/useScrollReveal";

export default function LabSection() {
  const { ref, isInView, progress } = useScrollReveal<HTMLElement>({
    threshold: 0.35,
  });

  return (
    <section ref={ref} id="lab" className="min-h-screen px-4 py-20 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <div
          className={`mb-10 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-green-400 font-mono mb-2">
            <span className="text-green-500">$</span> ./launch_network_viz
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-zinc-100">
            Interactive ML Lab
          </h2>
          <p className="text-zinc-400 mt-3 max-w-2xl">
            Scroll-triggered CRT interface that powers up into a live neural network.
          </p>
        </div>

        <div style={{ transform: `translateY(${(1 - progress) * 18}px)` }}>
          <div
            className={`transition-all duration-700 ${
              isInView ? "opacity-100 scale-100" : "opacity-0 scale-[0.985]"
            }`}
          >
            <CRTTerminal mode="networkOnActivate" isActive={isInView} />
          </div>
        </div>
      </div>
    </section>
  );
}
