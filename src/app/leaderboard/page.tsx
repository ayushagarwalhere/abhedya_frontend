"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, Crown, Medal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import Ripple_bg from "../../components/Ripple_bg";
import Navbar from "../../components/navbar";

interface LeaderboardUser {
  id: number;
  username: string;
  score: number;
  last_solved_at: string;
  created_at: string;
}

interface LeaderboardResponse {
  users: LeaderboardUser[];
  current_page: number;
  total_pages: number;
  total_users: number;
  limit: number;
}

// Fallback sample data
const sampleTeams = [
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [fontSize, setFontSize] = useState(140);
  const [teams, setTeams] = useState<{ rank: number; name: string; question: number }[]>(sampleTeams);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingApi, setIsUsingApi] = useState(false);

  const fetchLeaderboard = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/user/leaderboard?page=${pageNum}&limit=${ITEMS_PER_PAGE}`
      );
      if (!res.ok) throw new Error("API error");
      const data: LeaderboardResponse = await res.json();

      if (data && data.users && data.users.length > 0) {
        setIsUsingApi(true);
        const mapped = data.users.map((user, index) => ({
          rank: (data.current_page - 1) * data.limit + index + 1,
          name: user.username,
          question: user.score,
        }));
        setTeams(mapped);
        setPage(data.current_page);
        setTotalPages(data.total_pages);
        setTotalUsers(data.total_users);
      } else {
        // Empty response — use sample data
        setIsUsingApi(false);
        setTeams(sampleTeams);
        setTotalPages(1);
        setTotalUsers(sampleTeams.length);
      }
    } catch {
      // API unreachable — use sample data
      console.warn("Leaderboard API unavailable, using sample data");
      setIsUsingApi(false);
      setTeams(sampleTeams);
      setTotalPages(1);
      setTotalUsers(sampleTeams.length);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard(1);
  }, [fetchLeaderboard]);

  useEffect(() => {
    const updateSize = () => {
      setFontSize(Math.max(36, Math.min(window.innerWidth * 0.09, 140)));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    if (isUsingApi) {
      fetchLeaderboard(p);
    } else {
      setPage(p);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cinzel+Decorative:wght@700&display=swap');
      `}</style>

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
          color: "rgba(255,255,255,0.85)",
          fontWeight: "1000",
          y: 0.20,
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Trophy size={18} className="text-amber-400" />
                  <h1 className="text-lg font-semibold tracking-wide text-white">
                    Top Teams
                  </h1>
                </div>
                {totalUsers > 0 && (
                  <span className="text-xs text-white/40 tracking-wider uppercase">
                    {totalUsers} {totalUsers === 1 ? "player" : "players"}
                  </span>
                )}
              </div>

              {/* Teams */}
              <div className="space-y-2 relative" style={{ minHeight: "400px" }}>
                {isLoading ? (
                  /* Loading Skeleton */
                  <>
                    {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 bg-black/30 animate-pulse"
                      >
                        <div className="w-10 h-4 bg-white/10 rounded" />
                        <div className="flex-1 h-4 bg-white/10 rounded" />
                        <div className="w-16 h-8 bg-white/10 rounded" />
                      </div>
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="size-8 text-amber-400 animate-spin" />
                    </div>
                  </>
                ) : (
                  teams.map((team) => (
                    <div
                      key={`${team.rank}-${team.name}`}
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5 bg-black/30 transition-all duration-200 hover:bg-black/40"
                    >
                      {/* Rank */}
                      <div className="w-10">{rankIcon(team.rank)}</div>

                      {/* Name */}
                      <p className="flex-1 text-lg text-white">
                        {team.name}
                      </p>

                      {/* Score */}
                      <div className="text-right text-orange-100">
                        <p className="text-[10px] uppercase tracking-widest opacity-80 text-white/60">
                          Score
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {team.question}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-8">
                  {/* First Page */}
                  <button
                    onClick={() => goToPage(1)}
                    disabled={page === 1 || isLoading}
                    className="p-2 rounded-lg transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10"
                    title="First page"
                  >
                    <ChevronsLeft size={16} className="text-amber-400" />
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1 || isLoading}
                    className="p-2 rounded-lg transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10"
                    title="Previous page"
                  >
                    <ChevronLeft size={16} className="text-amber-400" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 mx-2">
                    {getPageNumbers().map((p, i) =>
                      p === "..." ? (
                        <span
                          key={`dots-${i}`}
                          className="w-8 h-8 flex items-center justify-center text-white/40 text-xs"
                        >
                          •••
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => goToPage(p)}
                          disabled={isLoading}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            page === p
                              ? "bg-amber-400/90 text-black shadow-lg shadow-amber-400/20"
                              : "text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages || isLoading}
                    className="p-2 rounded-lg transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10"
                    title="Next page"
                  >
                    <ChevronRight size={16} className="text-amber-400" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={page === totalPages || isLoading}
                    className="p-2 rounded-lg transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10"
                    title="Last page"
                  >
                    <ChevronsRight size={16} className="text-amber-400" />
                  </button>
                </div>
              )}

              {/* Pagination Dots (kept for single page or fallback) */}
              {totalPages <= 1 && teams.length > 0 && (
                <div className="flex justify-center gap-2 mt-6">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: "rgba(251,191,36,0.9)", transform: "scale(1.3)" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Ripple_bg>
    </>
  );
}
