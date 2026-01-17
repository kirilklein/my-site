"use client";

import { useState, useEffect, useRef } from "react";

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
  const hasStarted = useRef(false);

  // Start the sequence only once
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const startTimer = setTimeout(() => {
      setVisibleLines(1);
    }, 500);

    return () => clearTimeout(startTimer);
  }, []);

  // Handle typing animation for current line
  useEffect(() => {
    if (visibleLines === 0 || visibleLines > terminalSequence.length) return;

    const currentLine = terminalSequence[visibleLines - 1];

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
        setTypedChars(0);
        setCurrentLineComplete(false);
        setVisibleLines(prev => prev + 1);
      }, 300);
      return () => clearTimeout(nextLineTimer);
    }
  }, [typedChars, visibleLines, currentLineComplete]);

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
    <div className="crt-monitor relative w-full max-w-3xl mx-auto">
      {/* Monitor outer shell */}
      <div className="monitor-shell relative">
        {/* CRT bezel */}
        <div className="crt-bezel relative">
          {/* Inner bezel edge */}
          <div className="bezel-inner">
            {/* Screen container with curvature */}
            <div className="crt-screen-container">
              {/* The curved glass */}
              <div className="crt-glass">
                {/* Scanlines overlay */}
                <div className="scanlines" />

                {/* Screen vignette */}
                <div className="screen-vignette" />

                {/* Screen reflection/glare */}
                <div className="screen-glare" />

                {/* Phosphor glow */}
                <div className="phosphor-glow" />

                {/* Terminal content */}
                <div className="terminal-content relative z-10 p-6 md:p-10 min-h-[350px] md:min-h-[450px] font-mono">
                  {/* Completed lines */}
                  {terminalSequence.slice(0, visibleLines - 1).map((line, index) => (
                    <div key={index} className={`${getLineStyle(line.type)} leading-relaxed terminal-text`}>
                      {line.text}
                    </div>
                  ))}

                  {/* Currently typing line */}
                  {visibleLines > 0 && visibleLines <= terminalSequence.length && (
                    <div className={`${getLineStyle(terminalSequence[visibleLines - 1].type)} leading-relaxed terminal-text`}>
                      {terminalSequence[visibleLines - 1].text.slice(0, typedChars)}
                      {!currentLineComplete && <span className="cursor-blink">▊</span>}
                    </div>
                  )}

                  {/* Final cursor after sequence complete */}
                  {visibleLines > terminalSequence.length && (
                    <div className="text-green-400 mt-6 terminal-text">
                      {">"} <span className="cursor-blink">▊</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monitor bottom panel */}
        <div className="monitor-bottom-panel">
          {/* Power LED */}
          <div className="power-led led-on" />
        </div>
      </div>

      {/* Monitor stand */}
      <div className="monitor-stand">
        <div className="stand-neck" />
        <div className="stand-base" />
      </div>
    </div>
  );
}
