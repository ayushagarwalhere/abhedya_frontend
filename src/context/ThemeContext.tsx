"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeContextType = {
  isBlackText: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isBlackText, setIsBlackText] = useState(false);

  const toggleTheme = () => {
    setIsBlackText((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isBlackText, toggleTheme }}>
      {isBlackText && (
        <style dangerouslySetInnerHTML={{ __html: `
          * {
            color: #000000 !important;
            fill: #000000 !important;
            border-color: rgba(0,0,0,0.2) !important;
          }
          canvas {
            filter: grayscale(1) brightness(0.7) contrast(1.2);
          }
        `}} />
      )}
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
