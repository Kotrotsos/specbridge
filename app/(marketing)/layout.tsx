"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

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
              href="#features"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
              How it works
            </Link>
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
            <span className="text-lg font-semibold text-foreground">SpecBridge</span>
            <p className="mt-3 text-sm text-foreground-secondary leading-relaxed">
              Bridge the gap between domain experts and technical teams.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
                  Terms
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
