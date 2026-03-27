"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/navbar"
import WaterRipple from "../components/Ripple_bg"
import Link from "next/link"
import { InteractiveHoverButton } from "../components/ui/interactive_hover_btn"

export default function Page() {
  const [fontSize, setFontSize] = useState(180);

  useEffect(() => {
    const updateSize = () => {
      setFontSize(Math.max(36, Math.min(window.innerWidth * 0.09, 180)));
    };
    
    updateSize();
    
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <WaterRipple
      rainIntensity={0.2}
      className="h-screen w-full"
      resolution={256}
      dropRadius={40}
      perturbance={1}
      interactive={true}
      textConfig={{
        lines: ["Abhedya 5.0"],
        fontSize: fontSize,
        color: "rgba(255,255,255)",
        fontWeight: "1000",
      }}
      backgroundColor="#f86d21"
    >
      <Navbar />
      <div className="fixed right-0 bottom-0 left-0 flex items-end justify-between px-6 py-6 md:px-12 gap-8">
        {/* Branding Logos on the Left */}
        <div className="flex items-center gap-6 mb-1 md:mb-0">
          <img 
            src="/iste.webp" 
            alt="ISTE Logo" 
            className="h-10 md:h-12 w-auto object-contain brightness-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
          />
          <div className="h-8 md:h-10 w-px bg-white/20" />
          <img 
            src="/logo.png" 
            alt="Event Logo" 
            className="h-10 md:h-12 w-auto object-contain brightness-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
          />
        </div>

        {/* Action Button on the Right */}
        <a
          href="https://prody.nith.ac.in"
          target="_blank"
          rel="noopener noreferrer"
        >
          <InteractiveHoverButton className="bg-white/10 text-white border-white/20 hover:text-black">
            For more such events
          </InteractiveHoverButton>
        </a>
      </div>
    </WaterRipple>
  )
}
