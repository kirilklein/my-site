"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import the 3D component to avoid SSR issues
const NeuralNetwork3D = dynamic(() => import("./NeuralNetwork3D"), {
  ssr: false,
});

interface TerminalLine {
  text: string;
  type: "command" | "output" | "title" | "subtitle";
}

const terminalSequence: TerminalLine[] = [
  { text: "> initializing system...", type: "command" },
  { text: "[OK] kernel loaded", type: "output" },
  { text: "> loading neural_network.weights", type: "command" },
  { text: "[OK] model ready", type: "output" },
  { text: "> whoami", type: "command" },
  { text: "", type: "output" },
  { text: "KIRIL KLEIN", type: "title" },
  { text: "ML Engineer & Data Scientist", type: "subtitle" },
];

type Phase = "typing" | "loading" | "network";

export default function CRTTerminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [typedChars, setTypedChars] = useState<number>(0);
  const [currentLineComplete, setCurrentLineComplete] = useState(false);
  const [phase, setPhase] = useState<Phase>("typing");
  const [loadProgress, setLoadProgress] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // Start the sequence after mount
  useEffect(() => {
    if (visibleLines === 0 && phase === "typing") {
      const startTimer = setTimeout(() => {
        setVisibleLines(1);
      }, 500);
      return () => clearTimeout(startTimer);
    }
  }, [visibleLines, phase]);

  // Handle typing animation for current line
  useEffect(() => {
    if (phase !== "typing") return;
    if (visibleLines === 0) return;

    // Check if we've completed all lines
    if (visibleLines > terminalSequence.length) {
      if (!typingComplete) {
        setTypingComplete(true);
      }
      return;
    }

    const currentLine = terminalSequence[visibleLines - 1];

    if (typedChars < currentLine.text.length) {
      const typeSpeed = currentLine.type === "title" ? 80 :
                        currentLine.type === "subtitle" ? 40 : 25;

      const typeTimer = setTimeout(() => {
        setTypedChars(prev => prev + 1);
      }, typeSpeed);

      return () => clearTimeout(typeTimer);
    } else if (!currentLineComplete && !transitionTimerRef.current) {
      setCurrentLineComplete(true);
      transitionTimerRef.current = setTimeout(() => {
        transitionTimerRef.current = null;
        setTypedChars(0);
        setCurrentLineComplete(false);
        setVisibleLines(prev => prev + 1);
      }, 300);
    }
  }, [typedChars, visibleLines, currentLineComplete, phase, typingComplete]);

  // Transition to loading phase after typing completes
  useEffect(() => {
    if (typingComplete && phase === "typing") {
      const transitionTimer = setTimeout(() => {
        setPhase("loading");
      }, 800);
      return () => clearTimeout(transitionTimer);
    }
  }, [typingComplete, phase]);

  // Loading bar animation
  useEffect(() => {
    if (phase !== "loading") return;

    if (loadProgress < 100) {
      const loadTimer = setTimeout(() => {
        // Variable speed loading
        const increment = loadProgress < 30 ? 3 :
                         loadProgress < 70 ? 2 :
                         loadProgress < 90 ? 4 : 6;
        setLoadProgress(prev => Math.min(prev + increment, 100));
      }, 50);
      return () => clearTimeout(loadTimer);
    } else {
      const networkTimer = setTimeout(() => {
        setPhase("network");
      }, 500);
      return () => clearTimeout(networkTimer);
    }
  }, [phase, loadProgress]);

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
                  {phase === "typing" && (
                    <>
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
                    </>
                  )}

                  {phase === "loading" && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                      <div className="text-green-400 terminal-text mb-4">
                        {">"} visualizing neural network...
                      </div>

                      {/* Loading bar container */}
                      <div className="w-full max-w-md">
                        <div className="loading-bar-container">
                          <div
                            className="loading-bar-fill"
                            style={{ width: `${loadProgress}%` }}
                          />
                        </div>
                        <div className="text-green-400/70 text-sm mt-2 text-center font-mono">
                          {loadProgress}%
                        </div>
                      </div>
                    </div>
                  )}

                  {phase === "network" && (
                    <div className="network-view">
                      <NeuralNetwork3D />
                      <div className="network-label">
                        <span className="text-green-400/60 text-xs font-mono">
                          neural_network.visualization active
                        </span>
                      </div>
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
