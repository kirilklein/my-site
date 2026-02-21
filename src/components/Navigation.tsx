"use client";

import { useState, useEffect } from "react";

const navItems = [
  { label: "home", href: "#home" },
  { label: "lab", href: "#lab" },
  { label: "about", href: "#about" },
  { label: "projects", href: "#projects" },
  { label: "contact", href: "#contact" },
];

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Determine active section
      const sections = ["contact", "projects", "about", "lab"];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(section);
            return;
          }
        }
      }
      setActiveSection("home");
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/90 backdrop-blur-sm border-b border-zinc-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo / Name */}
          <a
            href="#"
            className="font-mono text-green-400 hover:text-green-300 transition-colors"
          >
            <span className="text-green-500">~/</span>kiril
          </a>

          {/* Nav links */}
          <div className="flex items-center gap-1 font-mono text-sm">
            {navItems.map((item, index) => (
              <span key={item.label} className="flex items-center">
                <a
                  href={item.href}
                  className={`px-3 py-1 rounded transition-colors ${
                    activeSection === item.label
                      ? "text-green-300 bg-green-500/10"
                      : "text-zinc-500 hover:text-green-400"
                  }`}
                >
                  {item.label}
                </a>
                {index < navItems.length - 1 && (
                  <span className="text-zinc-700">/</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
