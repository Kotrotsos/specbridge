"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { USE_CASE_CATEGORIES } from "./use-cases/data";

function UseCasesDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground transition-colors"
      >
        Use Cases
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-background-card rounded-xl border border-border shadow-xl p-2 z-50">
          <div className="mb-2 px-3 pt-1">
            <Link
              href="/use-cases"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
            >
              View all use cases
            </Link>
          </div>
          {USE_CASE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/use-cases/${cat.slug}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/5 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-lg ${cat.color.bg} ${cat.color.text} flex items-center justify-center`}
              >
                <cat.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {cat.shortTitle}
                </div>
                <div className="text-xs text-foreground-muted">
                  {cat.useCases.length} use cases
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-foreground tracking-tight">
              SpecBridge
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <UseCasesDropdown />
            <Link
              href="/pricing"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-all hover:shadow-lg"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background-sidebar">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-semibold text-foreground">
              SpecBridge
            </span>
            <p className="mt-3 text-sm text-foreground-secondary leading-relaxed">
              Bridge the gap between domain experts and technical teams.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#features"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/use-cases"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Use Cases
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">
              Use Cases
            </h4>
            <ul className="space-y-2">
              {USE_CASE_CATEGORIES.slice(0, 4).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/use-cases/${cat.slug}`}
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {cat.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-foreground-muted text-center">
            2025 SpecBridge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
