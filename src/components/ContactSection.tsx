"use client";

import useScrollReveal from "@/hooks/useScrollReveal";

interface ContactLink {
  label: string;
  href: string;
  command: string;
}

const contactLinks: ContactLink[] = [
  {
    label: "GitHub",
    href: "https://github.com/kirilklein",
    command: "open github.com/kirilklein",
  },
  {
    label: "Scholar",
    href: "https://scholar.google.com/citations?user=8k9TwncAAAAJ",
    command: "open scholar.google.com/kirilklein",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/kiril-klein-574809211/",
    command: "open linkedin.com/in/kiril-klein",
  },
  {
    label: "Email",
    href: "mailto:kiril.vadimovic.klein@gmail.com",
    command: "mail kiril.vadimovic.klein@gmail.com",
  },
];

export default function ContactSection() {
  const { ref, isInView, progress } = useScrollReveal<HTMLElement>({ threshold: 0.2 });

  return (
    <section
      ref={ref}
      id="contact"
      className="min-h-screen flex items-center justify-center px-4 py-20"
    >
      <div className="w-full max-w-2xl">
        <div
          className={`transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
          style={{ transform: `translateY(${(1 - progress) * 12}px)` }}
        >
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="text-green-400 font-mono mb-2">
              <span className="text-green-500">$</span> ./contact.sh
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-green-300">
              Get In Touch
            </h2>
            <p className="text-zinc-500 mt-4 max-w-md mx-auto">
              Always interested in discussing ML projects, data challenges,
              or collaboration opportunities.
            </p>
          </div>

          {/* Terminal-style contact links */}
          <div className="bg-zinc-900/90 rounded-lg border border-zinc-800 p-6 md:p-8 font-mono">
            <div className="text-zinc-500 text-sm mb-4">
              # available communication channels
            </div>

            <div className="space-y-4">
              {contactLinks.map((link, index) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className={`block group transition-all duration-500 ${
                    isInView
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: `${index * 100 + 200}ms` }}
                >
                  <div className="flex items-center gap-2 py-2 px-3 rounded hover:bg-green-500/10 transition-colors">
                    <span className="text-green-500">$</span>
                    <span className="text-green-400 group-hover:text-green-300 transition-colors">
                      {link.command}
                    </span>
                    <span className="text-zinc-600 ml-auto text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      [{link.label}]
                    </span>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-800">
              <div className="text-green-400">
                <span className="text-green-500">$</span>{" "}
                <span className="text-zinc-500">echo</span>{" "}
                &quot;Looking forward to hearing from you!&quot;
              </div>
              <div className="text-green-300/70 mt-2">
                Looking forward to hearing from you!
              </div>
            </div>

            <div className="mt-4 text-green-400">
              <span className="text-green-500">$</span>{" "}
              <span className="cursor-blink">▊</span>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`mt-16 text-center text-zinc-600 text-sm font-mono transition-all duration-700 delay-500 ${
              isInView ? "opacity-100" : "opacity-0"
            }`}
          >
            <p>&copy; {new Date().getFullYear()} Kiril Klein</p>
            <p className="mt-1 text-zinc-700">
              built with Next.js + Tailwind
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
