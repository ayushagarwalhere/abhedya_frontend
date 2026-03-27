"use client";

import { useState, useEffect } from "react";
import { Mail, Target, Trophy } from "lucide-react";
import Ripple_bg from "../../components/Ripple_bg";
import Navbar from "../../components/navbar";

const sampleProfile = {
  username: "CipherBreaker",
  email: "penguin@abhedya.org",
  avatar: "/avatar.png",
  questionsSolved: 14,
  currentRank: 1
};

export default function Profile() {
  const [profileData, setProfileData] = useState(sampleProfile);

  useEffect(() => {
    // Fetch profile from backend
    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) return null; // Avoid throw to prevent Next.js dev overlay
        return res.json();
      })
      .then((data) => {
        if (data) {
          setProfileData(prev => ({ ...prev, ...data }));
        }
      })
      .catch((error) => {
        console.error("Failed to fetch profile, using sample data", error);
      });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cinzel+Decorative:wght@700&display=swap');
      `}</style>

      {/* Ripple Background as wrapper without textConfig */}
      <Ripple_bg
        rainIntensity={0.2}
        className="min-h-screen w-full"
        resolution={256}
        dropRadius={40}
        perturbance={1}
        interactive={true}
        backgroundColor="#f86d21"
      >
        <Navbar />
        <div
          className="relative min-h-screen w-full flex items-center justify-center px-4 py-20 md:px-12"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {/* Page content */}
          <div className="relative z-20 w-full max-w-lg mt-4 md:mt-0">
            
            {/* Eyebrow badge */}
            <div className="flex justify-center mb-7">
              <span className="font-landing text-[12px] tracking-[0.22em] uppercase text-white border border-white rounded-full px-7 py-3 bg-amber-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                &nbsp;PLAYER PROFILE&nbsp;
              </span>
            </div>

            {/* Glass card */}
            <div
              className="rounded-2xl border border-amber-500/[0.14] bg-black/40 backdrop-blur-xl px-8 py-10 shadow-[0_24px_60px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(251,191,36,0.07)]"
              style={{ borderTopColor: "rgba(251,191,36,0.28)" }}
            >

              {/* Avatar section */}
              <div className="flex flex-col items-center justify-center mb-8">
                {/* Avatar Image Frame */}
                <div className="relative w-32 h-32 rounded-full border-[3px] border-orange-500/50 p-2 mb-4 shadow-[0_0_30px_rgba(251,191,36,0.2)] bg-black/60 flex items-center justify-center overflow-hidden">
                  <img 
                    src={profileData.avatar} 
                    alt="Player Avatar" 
                    className="w-20 h-20 object-cover drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] scale-160 hover:scale-175 transition-transform duration-300"
                  />
                </div>
                
                {/* Username */}
                <h2
                  className="text-center text-amber-400 text-3xl tracking-widest uppercase shadow-amber-400"
                  style={{ fontFamily: "serif", textShadow: "0 0 20px rgba(251,191,36,0.4)" }}
                >
                  {profileData.username}
                </h2>
                
                {/* Email */}
                <div className="flex items-center gap-2 mt-3 text-[rgba(245,228,190,0.88)] text-sm tracking-widest font-sans bg-black/40 px-4 py-2 rounded-full border border-orange-400/20">
                  <Mail size={14} className="text-orange-400" />
                  <span>{profileData.email}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-linear-to-r from-transparent via-orange-500 to-transparent mb-8" />

              {/* Stats Layout */}
              <div className="grid grid-cols-2 gap-5">
                
                {/* Solved Stats */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-black/60 border border-orange-400/20 shadow-[inset_0_1px_0_rgba(251,191,36,0.05)] transition-all duration-300 hover:bg-black/80 hover:border-orange-400/40">
                  <Target className="text-amber-500 mb-3" size={28} />
                  <p className="text-[10px] uppercase tracking-widest text-white/60 mb-2">
                    Questions Solved
                  </p>
                  <p className="text-4xl font-bold text-white tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>
                    {profileData.questionsSolved}
                  </p>
                </div>

                {/* Rank Stats */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-black/60 border border-orange-400/20 shadow-[inset_0_1px_0_rgba(251,191,36,0.05)] transition-all duration-300 hover:bg-black/80 hover:border-orange-400/40">
                  <Trophy className="text-amber-500 mb-3" size={28} />
                  <p className="text-[10px] uppercase tracking-widest text-white/60 mb-2">
                    Current Rank
                  </p>
                  <p className="text-4xl font-bold text-amber-400 tracking-widest" style={{ fontFamily: "'Cinzel Decorative', serif", textShadow: "0 0 15px rgba(251,191,36,0.5)" }}>
                    #{profileData.currentRank}
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>
      </Ripple_bg>
    </>
  );
}
