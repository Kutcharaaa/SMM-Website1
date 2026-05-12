"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Pricing", href: "/pricing" },
    { name: "API", href: "/api" },
    { name: "Support", href: "/support" },
  ];

  return (
    <header className="border-b border-zinc-800 backdrop-blur-xl bg-black/70 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        {/* Logo */}
        <Link href="/">
          <img
            src="/logo.png"
            alt="Ascend Service"
            className="h-14 w-auto cursor-pointer"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition font-medium ${
                  isActive
                    ? "text-blue-400"
                    : "text-white hover:text-blue-400"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <Link
            href="/login"
            className="hover:text-blue-400 transition"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl font-semibold transition"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1"
        >
          <span className="w-6 h-[2px] bg-white"></span>
          <span className="w-6 h-[2px] bg-white"></span>
          <span className="w-6 h-[2px] bg-white"></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-black/95 backdrop-blur-xl">
          <div className="flex flex-col px-6 py-6 gap-5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`transition font-medium ${
                    isActive
                      ? "text-blue-400"
                      : "text-white hover:text-blue-400"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.name}
                </Link>
              );
            })}

            <Link
              href="/login"
              className="hover:text-blue-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>

            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition text-center"
              onClick={() => setMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}