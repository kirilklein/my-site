"use client";

import { useState, useEffect } from "react";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "title" | "subtitle";
  delay: number;
}

const terminalSequence: TerminalLine[] = [
  { text: "> initializing system...", type: "command", delay: 0 },
  { text: "[OK] kernel loaded", type: "output", delay: 800 },
  { text: "> loading neural_network.weights", type: "command", delay: 1200 },
  { text: "[OK] model ready", type: "output", delay: 2000 },
  { text: "> whoami", type: "command", delay: 2600 },
  { text: "", type: "output", delay: 3000 },
  { text: "KIRIL KLEIN", type: "title", delay: 3100 },
  { text: "ML Engineer & Data Scientist", type: "subtitle", delay: 3800 },
];

export default function CRTTerminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [typedChars, setTypedChars] = useState<number>(0);
  const [currentLineComplete, setCurrentLineComplete] = useState(false);

  useEffect(() => {
    if (visibleLines >= terminalSequence.length) return;

    const currentLine = terminalSequence[visibleLines];
    const lineDelay = visibleLines === 0 ? currentLine.delay :
      currentLine.delay - terminalSequence[visibleLines - 1].delay;

    const showLineTimer = setTimeout(() => {
      setTypedChars(0);
      setCurrentLineComplete(false);
    }, lineDelay);

    return () => clearTimeout(showLineTimer);
  }, [visibleLines]);

  useEffect(() => {
    if (visibleLines >= terminalSequence.length) return;

    const currentLine = terminalSequence[visibleLines];

    if (typedChars < currentLine.text.length) {
      const typeSpeed = currentLine.type === "title" ? 80 :
                        currentLine.type === "subtitle" ? 40 : 25;

      const typeTimer = setTimeout(() => {
        setTypedChars(prev => prev + 1);
      }, typeSpeed);

      return () => clearTimeout(typeTimer);
    } else if (!currentLineComplete) {
      setCurrentLineComplete(true);
      const nextLineTimer = setTimeout(() => {
        setVisibleLines(prev => prev + 1);
      }, 200);
      return () => clearTimeout(nextLineTimer);
    }
  }, [typedChars, visibleLines, currentLineComplete]);

  // Start the sequence
  useEffect(() => {
    const startTimer = setTimeout(() => {
      setVisibleLines(1);
    }, terminalSequence[0].delay);
    return () => clearTimeout(startTimer);
  }, []);

  const getLineStyle = (type: TerminalLine["type"]) => {
    switch (type) {
      case "command":
        return "text-green-400";
      case "output":
        return "text-green-300/70";
      case "title":
        return "text-green-300 text-4xl md:text-6xl font-bold mt-4 tracking-wider";
      case "subtitle":
        return "text-green-400/80 text-xl md:text-2xl mt-2";
    }
  };

  return (
    <div className="crt-screen relative w-full max-w-3xl mx-auto">
      {/* CRT screen bezel */}
      <div className="crt-bezel bg-zinc-800 rounded-2xl p-3 shadow-2xl">
        {/* Inner screen with curve effect */}
        <div className="crt-inner relative bg-black rounded-lg overflow-hidden">
          {/* Scanlines overlay */}
          <div className="scanlines absolute inset-0 pointer-events-none z-10" />

          {/* Screen glow */}
          <div className="screen-glow absolute inset-0 pointer-events-none" />

          {/* Terminal content */}
          <div className="relative z-0 p-8 md:p-12 min-h-[400px] md:min-h-[500px] font-mono">
            {terminalSequence.slice(0, visibleLines).map((line, index) => {
              const isCurrentLine = index === visibleLines - 1;
              const displayText = isCurrentLine
                ? line.text.slice(0, typedChars)
                : line.text;

              return (
                <div key={index} className={`${getLineStyle(line.type)} leading-relaxed`}>
                  {displayText}
                  {isCurrentLine && !currentLineComplete && (
                    <span className="cursor-blink">▊</span>
                  )}
                </div>
              );
            })}

            {/* Final cursor after sequence complete */}
            {visibleLines >= terminalSequence.length && (
              <div className="text-green-400 mt-6">
                {">"} <span className="cursor-blink">▊</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CRT stand/base */}
      <div className="flex justify-center mt-2">
        <div className="w-32 h-3 bg-zinc-700 rounded-b-lg" />
      </div>
      <div className="flex justify-center">
        <div className="w-48 h-2 bg-zinc-800 rounded-b-lg" />
      </div>
    </div>
  );
}
