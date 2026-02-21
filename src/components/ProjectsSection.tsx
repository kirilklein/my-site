"use client";

import { useEffect, useRef, useState } from "react";
import useScrollReveal from "@/hooks/useScrollReveal";

interface Project {
  name: string;
  description: string;
  tech: string[];
  link?: string;
  github?: string;
}

const projects: Project[] = [
  {
    name: "CORE-BEHRT",
    description: "Transformer-based framework for modeling large-scale electronic health records data",
    tech: ["PyTorch", "Transformers", "EHR"],
    github: "https://github.com/FGA-DIKU/EHR",
  },
  {
    name: "CausalEstimate",
    description: "Open-source library for treatment effect estimation from propensity scores",
    tech: ["Python", "Causal Inference", "Statistics"],
    github: "https://github.com/kirilklein/CausalEstimate",
  },
  {
    name: "PHAIR-EHR",
    description: "Causal inference pipelines built on CORE-BEHRT for healthcare research",
    tech: ["PyTorch", "Causal ML", "Healthcare"],
    github: "https://github.com/kirilklein/PHAIR_EHR",
  },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 150);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="group bg-zinc-900/80 border border-zinc-800 rounded-lg p-6 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
        {/* Project header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-500">~/projects/</span>
          <span className="text-green-300 font-semibold">{project.name}</span>
        </div>

        {/* Description */}
        <p className="text-zinc-400 mb-4 leading-relaxed">
          {project.description}
        </p>

        {/* Tech stack */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tech.map((tech) => (
            <span
              key={tech}
              className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded border border-green-500/20"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex gap-4 text-sm">
          {project.github && (
            <a
              href={project.github}
              className="text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1"
            >
              <span>[</span>
              <span>github</span>
              <span>]</span>
            </a>
          )}
          {project.link && (
            <a
              href={project.link}
              className="text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1"
            >
              <span>[</span>
              <span>demo</span>
              <span>]</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsSection() {
  const { ref, isInView, progress } = useScrollReveal<HTMLElement>({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      id="projects"
      className="min-h-screen flex items-center justify-center px-4 py-20"
    >
      <div className="w-full max-w-4xl">
        {/* Section header */}
        <div
          className={`mb-12 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
          style={{ transform: `translateY(${(1 - progress) * 12}px)` }}
        >
          <div className="text-green-400 font-mono mb-2">
            <span className="text-green-500">$</span> ls -la ~/projects/
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-green-300">
            Projects
          </h2>
          <p className="text-zinc-500 mt-2 font-mono text-sm">
            selected works and experiments
          </p>
        </div>

        {/* Project grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <ProjectCard key={project.name} project={project} index={index} />
          ))}
        </div>

        {/* More projects hint */}
        <div
          className={`mt-8 text-center transition-all duration-700 delay-500 ${
            isInView ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="text-zinc-600 font-mono text-sm">
            more projects on github
          </span>
        </div>
      </div>
    </section>
  );
}
