"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { USE_CASE_CATEGORIES } from "./data";

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight">
            Use Cases
          </h1>
          <p className="mt-4 text-lg text-foreground-secondary max-w-2xl mx-auto">
            See how teams across industries use SpecBridge to capture knowledge,
            eliminate miscommunication, and ship faster.
          </p>
        </div>

        {/* Use case grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {USE_CASE_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/use-cases/${category.slug}`}
              className="group relative bg-background-card rounded-2xl border border-border p-6 transition-all hover:border-foreground/20 hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-1"
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl ${category.color.bg} ${category.color.text} flex items-center justify-center mb-4 transition-colors group-hover:${category.color.light}`}
              >
                <category.icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {category.title}
              </h2>
              <p className="text-foreground-secondary text-sm leading-relaxed mb-4">
                {category.description}
              </p>

              {/* Use case count */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">
                  {category.useCases.length} use cases
                </span>
                <span className="flex items-center gap-1 text-sm font-medium text-foreground group-hover:gap-2 transition-all">
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-foreground-secondary mb-4">
            Don't see your use case?
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-foreground font-medium hover:gap-3 transition-all"
          >
            Try SpecBridge free and discover what's possible
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
