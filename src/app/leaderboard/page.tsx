"use client";

import { useState, useEffect } from "react";
import { Trophy, Crown, Medal } from "lucide-react";
import Ripple_bg from "../../components/Ripple_bg";
import Navbar from "../../components/navbar";

const teams = [
  { rank: 1, name: "CipherBreakers", question: 14 },
  { rank: 2, name: "QuantumRiddlers", question: 13 },
  { rank: 3, name: "DarkPharaoh", question: 12 },
  { rank: 4, name: "NightOwls", question: 11 },
  { rank: 5, name: "ByteHunters", question: 10 },
  { rank: 6, name: "Enigma404", question: 9 },
  { rank: 7, name: "ShadowDecoders", question: 8 },
  { rank: 8, name: "VortexMinds", question: 7 },
  { rank: 9, name: "CipherBreakers", question: 6 },
  { rank: 10, name: "QuantumRiddlers", question: 5 },
  { rank: 11, name: "DarkPharaoh", question: 4 },
  { rank: 12, name: "NightOwls", question: 4 },
  { rank: 13, name: "ByteHunters", question: 4 },
  { rank: 14, name: "Enigma404", question: 3 },
  { rank: 15, name: "ShadowDecoders", question: 3 },
  { rank: 16, name: "VortexMinds", question: 2 },
  { rank: 17, name: "AlphaCoders", question: 2 },
  { rank: 18, name: "BetaBrains", question: 1 },
  { rank: 19, name: "GammaGuild", question: 1 },
  { rank: 20, name: "DeltaForce", question: 1 },
];

const ITEMS_PER_PAGE = 10;

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown size={15} className="text-amber-400" />;
  if (rank === 2) return <Medal size={15} className="text-slate-300" />;
  if (rank === 3) return <Medal size={15} className="text-amber-600" />;
  return (
    <span
      className="text-amber-600/60 font-bold text-[11px]"
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      #{rank}
    </span>
  );
};

export default function Leaderboard() {
  const [page, setPage] = useState(0);
  const [fontSize, setFontSize] = useState(140);
  const [teamsList, setTeamsList] = useState(teams);

  useEffect(() => {
    // Fetch leaderboard from backend
    fetch("/api/leaderboard")
      .then((res) => {
        if (!res.ok) return null; // Avoid throw to prevent Next.js dev overlay
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setTeamsList(data);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch leaderboard, using sample data", error);
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

  const totalPages = Math.ceil(teamsList.length / ITEMS_PER_PAGE);

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
          lines: ["LEADERBOARD"],
          fontSize: fontSize,
          color: "rgba(255,255,255,0.85)", // Made slightly translucent
          fontWeight: "1000",
          y: 0.20, // Places it at the top 20% of the screen
        }}
        backgroundColor="#f86d21"
      >
        <Navbar />
        <div
          className="relative min-h-screen w-full flex items-start justify-center px-4 pt-24 pb-10 md:px-12"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {/* Leaderboard Card */}
          <div
            className="z-20 w-full max-w-4xl mx-auto rounded-2xl overflow-hidden mt-48 md:mt-[32vh]"
            style={{
              background: "rgba(8,5,0,0.65)",
              backdropFilter: "blur(12px) saturate(1.5)",
              WebkitBackdropFilter: "blur(12px) saturate(1.5)",
              border: "1px solid rgba(251,191,36,0.18)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
            }}
          >
            <div className="px-7 py-8">

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <Trophy
                  size={18}
                  className="text-amber-400"
                />
                <h1 className="text-lg font-semibold tracking-wide text-white">
                    Top Teams
                </h1>
              </div>

              {/* Teams */}
              <div className="space-y-2">
                {teamsList
                  .slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)
                  .map((team) => (
                    <div
                      key={team.rank}
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5 bg-black/30"
                    >
                      {/* Rank */}
                      <div className="w-10">{rankIcon(team.rank)}</div>

                      {/* Name */}
                      <p className="flex-1 text-lg text-white">
                        {team.name}
                      </p>

                      {/* Questions */}
                      <div className="text-right text-orange-100">
                        <p className="text-[10px] uppercase tracking-widest opacity-80 text-white/60">
                          Questions
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {team.question}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      background:
                        page === i
                          ? "rgba(251,191,36,0.9)"
                          : "rgba(251,191,36,0.25)",
                      transform: page === i ? "scale(1.3)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Ripple_bg>
    </>
  );
}
