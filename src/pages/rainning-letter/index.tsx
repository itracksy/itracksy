"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Character {
  char: string;
  x: number;
  y: number;
  speed: number;
}

class TextScramble {
  el: HTMLElement;
  chars: string;
  queue: Array<{
    from: string;
    to: string;
    start: number;
    end: number;
    char?: string;
  }>;
  frame: number;
  frameRequest: number;
  resolve: (value: void | PromiseLike<void>) => void;

  constructor(el: HTMLElement) {
    this.el = el;
    this.chars = "!<>-_\\/[]{}—=+*^?#";
    this.queue = [];
    this.frame = 0;
    this.frameRequest = 0;
    this.resolve = () => {};
    this.update = this.update.bind(this);
  }

  setText(newText: string) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise<void>((resolve) => (this.resolve = resolve));
    this.queue = [];

    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = "";
    let complete = 0;

    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += from;
      }
    }

    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}

const defaultPhrases = [
  "Focus,",
  "Take a deep breath",
  "Clear your mind",
  "Stay present",
  "Find your peace",
  "Embrace the moment",
];

interface QuoteResponse {
  quotes: Array<{
    id: number;
    quote: string;
    author: string;
  }>;
  total: number;
  skip: number;
  limit: number;
}

const fetchQuote = async () => {
  const skip = Math.floor(Math.random() * 140) * 10;
  const response = await fetch(`https://dummyjson.com/quotes?limit=1&skip=${skip}`);
  if (!response.ok) throw new Error("Failed to fetch quote");
  const data: QuoteResponse = await response.json();
  const { quote, author } = data.quotes[0];

  if (!quote) throw new Error("No quote found");

  // Split the quote into meaningful chunks
  const words = quote.split(" ");
  const chunks: string[] = [];
  let currentChunk = "";

  words.forEach((word: string, index: number) => {
    if ((currentChunk + " " + word).length <= 20) {
      currentChunk = currentChunk ? `${currentChunk} ${word}` : word;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = word;
    }
    if (index === words.length - 1 && currentChunk) {
      chunks.push(currentChunk);
    }
  });

  // Add author at the end
  chunks.push(`- ${author}`);

  return chunks;
};

const ScrambledTitle: React.FC<{ phrases?: string[] }> = ({ phrases = defaultPhrases }) => {
  const [mounted, setMounted] = useState(false);
  const scramblerRef = useRef<TextScramble | null>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted && !scramblerRef.current) {
      const el = document.querySelector(".scramble-text");
      if (el) {
        scramblerRef.current = new TextScramble(el as HTMLElement);
        const next = () => {
          scramblerRef.current?.setText(phrases[counterRef.current]).then(() => {
            setTimeout(next, 2000);
          });
          counterRef.current = (counterRef.current + 1) % phrases.length;
        };
        next();
      }
    }
  }, [mounted, phrases]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div
        className="scramble-text text-center text-3xl font-bold text-green-400"
        style={{
          textShadow: "0 0 10px rgba(74, 222, 128, 0.5)",
          fontFamily: "monospace",
          minHeight: "8rem",
          display: "flex",
          alignItems: "center",
          maxWidth: "80vw",
        }}
      ></div>
    </div>
  );
};

const RainingLetters: React.FC = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set());

  const createCharacters = useCallback(() => {
    const allChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    const charCount = 300;
    const newCharacters: Character[] = [];

    for (let i = 0; i < charCount; i++) {
      newCharacters.push({
        char: allChars[Math.floor(Math.random() * allChars.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: 0.1 + Math.random() * 0.3,
      });
    }

    return newCharacters;
  }, []);

  useEffect(() => {
    setCharacters(createCharacters());
  }, [createCharacters]);

  useEffect(() => {
    const updateActiveIndices = () => {
      const newActiveIndices = new Set<number>();
      const numActive = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < numActive; i++) {
        newActiveIndices.add(Math.floor(Math.random() * characters.length));
      }
      setActiveIndices(newActiveIndices);
    };

    const flickerInterval = setInterval(updateActiveIndices, 50);
    return () => clearInterval(flickerInterval);
  }, [characters.length]);

  useEffect(() => {
    let animationFrameId: number;

    const updatePositions = () => {
      setCharacters((prevChars) =>
        prevChars.map((char) => ({
          ...char,
          y: char.y + char.speed,
          ...(char.y >= 100 && {
            y: -5,
            x: Math.random() * 100,
            char: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"[
              Math.floor(
                Math.random() *
                  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?".length
              )
            ],
          }),
        }))
      );
      animationFrameId = requestAnimationFrame(updatePositions);
    };

    animationFrameId = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);
  const { data: phrases, isLoading } = useQuery({
    queryKey: ["quote"],
    queryFn: fetchQuote,
    retry: 2, // Retry twice before falling back to default phrases
    refetchInterval: 60 * 1000, // Refetch the quote every minute
  });
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Close Button */}
      <button
        onClick={() => navigate({ to: "/" })}
        className="absolute right-6 top-6 z-30 rounded-full bg-black/20 p-2 text-white/50 backdrop-blur-sm transition hover:bg-black/30 hover:text-white"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Title */}
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transform">
        {!isLoading && <ScrambledTitle phrases={phrases} />}
      </div>

      {/* Raining Characters */}
      {characters.map((char, index) => (
        <span
          key={index}
          className={`absolute text-xs transition-colors duration-100 ${
            activeIndices.has(index)
              ? "z-10 scale-125 animate-pulse text-base font-bold text-[#00ff00]"
              : "font-light text-slate-600"
          }`}
          style={{
            left: `${char.x}%`,
            top: `${char.y}%`,
            transform: `translate(-50%, -50%) ${activeIndices.has(index) ? "scale(1.25)" : "scale(1)"}`,
            textShadow: activeIndices.has(index)
              ? "0 0 8px rgba(255,255,255,0.8), 0 0 12px rgba(255,255,255,0.4)"
              : "none",
            opacity: activeIndices.has(index) ? 1 : 0.4,
            transition: "color 0.1s, transform 0.1s, text-shadow 0.1s",
            willChange: "transform, top",
            fontSize: "1.8rem",
          }}
        >
          {char.char}
        </span>
      ))}

      <style>{`
        .dud {
          color: #0f0;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default RainingLetters;
