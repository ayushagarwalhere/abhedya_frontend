"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import Ripple_bg from "../../components/Ripple_bg";
import Navbar from "../../components/navbar";

const samplePuzzle = {
  content:
    "In the land where the sun god sailed his barque across the sky, a queen's cipher hides within the ankh. What three letters complete the sequence: Ω → Δ → ?",
};

export default function Questions() {
  const [fontSize, setFontSize] = useState(140);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [questionData, setQuestionData] = useState(samplePuzzle);

  useEffect(() => {
    // Fetch question from backend
    fetch("/api/questions/current")
      .then((res) => {
        if (!res.ok) return null; // Avoid throw to prevent Next.js dev overlay
        return res.json();
      })
      .then((data) => {
        if (data && data.content) {
          setQuestionData(data);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch questions, using sample data", error);
      });
  }, []);

  useEffect(() => {
    const updateSize = () => {
      // Scale font size down on smaller screens (9% of viewport width) with a max of 140px and min of 36px
      setFontSize(Math.max(36, Math.min(window.innerWidth * 0.09, 140)));
    };
    
    // Set initially
    updateSize();
    
    // Update on resize
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    
    // Optional: Submit answer to backend here
    // fetch("/api/questions/submit", { method: "POST", body: JSON.stringify({ answer }) })
    
    setTimeout(() => setSubmitted(false), 2000);
    setAnswer("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cinzel+Decorative:wght@700&display=swap');
      `}</style>

      {/* Ripple Background as wrapper around everything so it catches pointer events */}
      <Ripple_bg
        rainIntensity={0.2}
        className="min-h-screen w-full"
        resolution={256}
        dropRadius={40}
        perturbance={1}
        interactive={true}
        textConfig={{
          lines: ["GAME PAGE"],
          fontSize: fontSize,
          color: "rgba(255,255,255,0.85)", // Made slightly translucent
          fontWeight: "1000",
          y: 0.25, // Places it at the top 20% of the screen
        }}
        backgroundColor="#f86d21"
      >
        <Navbar />
        <div
          className="relative min-h-screen w-full flex items-start justify-center px-4 pt-24 pb-10 md:px-12"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {/* Page content */}
          <div className="relative z-20 w-full max-w-2xl mt-28 md:mt-[22vh]">
            
            {/* Eyebrow badge */}
            <div className="flex justify-center mb-7">
              <span className="font-landing text-[12px] tracking-[0.22em] uppercase text-white border border-white rounded-full px-7 py-3 bg-amber-500/5 backdrop-blur-sm">
                &nbsp;QUESTION 1&nbsp;
              </span>
            </div>

            {/* Glass card from provided snippet */}
            <div
              className="rounded-2xl border border-amber-500/[0.14] bg-black/40 backdrop-blur-xl px-8 py-10 shadow-[0_24px_60px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(251,191,36,0.07)]"
              style={{ borderTopColor: "rgba(251,191,36,0.28)" }}
            >
              {/* Title */}
              <h2
                className="text-center text-amber-400 text-[11px] tracking-[0.2em] uppercase mb-6"
                style={{ fontFamily: "'Cinzel Decorative', serif" }}
              >
                The Pharaoh's Cipher
              </h2>

              {/* Divider */}
              <div className="h-px bg-linear-to-r from-transparent via-orange-500 to-transparent mb-7" />

              {/* Puzzle text */}
              <p className="text-[rgba(245,228,190,0.88)] text-[15px] leading-[1.9] text-center tracking-wide mb-6">
                {questionData.content}
              </p>

              {/* Divider */}
              <div className="h-px bg-linear-to-r from-transparent via-orange-500 to-transparent mb-7" />

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Inscribe thy answer upon the papyrus…"
                  className="w-full px-5 py-3.5 rounded-xl bg-black border border-orange-400 text-[rgba(245,228,190,0.9)] placeholder:text-black/20 placeholder:italic text-[13px] tracking-wide outline-none focus:border-amber-500/45 focus:bg-black/40 transition-all duration-300"
                  style={{ fontFamily: "'Cinzel', serif" }}
                />
                <button
                  type="submit"
                  disabled={!answer.trim()}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gray-400 text-[#1a0f00] text-lg tracking-[0.22em] uppercase font-bold disabled:cursor-not-allowed hover:brightness-110 hover:-translate-y-px active:translate-y-0 transition-all duration-200 shadow-[0_4px_20px_rgba(180,120,10,0.25)]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {submitted ? (
                    "𓋹 Offering Received"
                  ) : (
                    <>
                      {" "}
                      Seal & Submit <Send size={15} />
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>
        </div>
      </Ripple_bg>
    </>
  );
}
