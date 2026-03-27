"use client"

import Link from "next/link"
import { Menu, X, Sun, Moon } from "lucide-react"
import { Link004 } from "./ui/cssLinkbtn"
import { useState } from "react"
import { useTheme } from "../context/ThemeContext"

const navLinks = [
  { label: "Profile", href: "/profile" },
  { label: "Game Page", href: "/questions" },
  { label: "Leaderboard", href: "/leaderboard" },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { isBlackText, toggleTheme } = useTheme()

  return (
    <nav className="w-full bg-transparent px-6 py-3 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link004
          href="/"
          className={`px-1 text-lg font-sans tracking-tight uppercase ${isBlackText ? 'text-black' : 'text-white'}`}
        >
          prodyogiki
        </Link004>

        {/* Center nav links */}
        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link004
                href={link.href}
                className={`text-sm font-medium opacity-90 transition-opacity hover:opacity-100 ${isBlackText ? '!text-black' : 'text-white'}`}
              >
                {link.label}
              </Link004>
            </li>
          ))}
        </ul>

        {/* Right side actions */}
        <div className="hidden items-center gap-6 md:flex">
          <Link004
            href="/signup"
            className={`text-sm font-medium opacity-90 transition-opacity hover:opacity-100 ${isBlackText ? '!text-black' : 'text-white'}`}
          >
            Sign Up
          </Link004>
          <div className="flex items-center gap-4">
             <Link004
              href="/login"
              className={`text-sm font-medium opacity-90 transition-opacity hover:opacity-100 ${isBlackText ? '!text-black' : 'text-white'}`}
            >
              Log in
            </Link004>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${isBlackText ? 'bg-black/10 text-black hover:bg-black/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
              aria-label="Toggle theme"
            >
              {isBlackText ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className={`mt-3 flex flex-col gap-4 border-t border-white/20 pt-4 md:hidden ${isBlackText ? 'text-black' : 'text-white'}`}>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm font-medium opacity-90 ${isBlackText ? 'text-black' : 'text-white'}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-4 pt-2">
            <Link 
              href="/signup" 
              className={`text-sm font-medium opacity-90 ${isBlackText ? 'text-black' : 'text-white'}`}
            >
              Sign Up
            </Link>
            <Link 
              href="/login" 
              className={`text-sm font-medium opacity-90 ${isBlackText ? 'text-black' : 'text-white'}`}
            >
              Log in
            </Link>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${isBlackText ? 'bg-black/10 text-black hover:bg-black/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
              aria-label="Toggle theme"
            >
              {isBlackText ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <Link
              href="https://prody.nith.ac.in"
              className={`rounded-full border px-5 py-1.5 text-sm font-medium ${isBlackText ? 'border-black text-black' : 'border-white text-white'}`}
            >
              For more such events 
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}