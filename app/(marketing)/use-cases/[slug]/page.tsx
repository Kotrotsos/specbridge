"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Quote,
  ChevronRight,
} from "lucide-react";
import {
  USE_CASE_CATEGORIES,
  getUseCaseBySlug,
  getAdjacentUseCases,
} from "../data";

interface UseCasePageProps {
  params: Promise<{ slug: string }>;
}

export default function UseCasePage({ params }: UseCasePageProps) {
  const { slug } = use(params);
  const category = getUseCaseBySlug(slug);

  if (!category) {
    notFound();
  }

  const { prev, next } = getAdjacentUseCases(slug);

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
          {/* Sidebar navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Link
                href="/use-cases"
                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                All use cases
              </Link>

              <nav className="space-y-1">
                {USE_CASE_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/use-cases/${cat.slug}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      cat.slug === slug
                        ? `${cat.color.bg} ${cat.color.text} font-medium`
                        : "text-foreground-secondary hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                    <cat.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{cat.shortTitle}</span>
                  </Link>
                ))}
              </nav>

              {/* CTA in sidebar */}
              <div className="mt-8 p-4 bg-background-sidebar rounded-xl border border-border">
                <p className="text-sm text-foreground font-medium mb-2">
                  Ready to try it?
                </p>
                <p className="text-xs text-foreground-secondary mb-3">
                  Start capturing knowledge in minutes.
                </p>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Get started free
                </Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main>
            {/* Mobile back link */}
            <Link
              href="/use-cases"
              className="lg:hidden flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              All use cases
            </Link>

            {/* Header */}
            <div className="mb-12">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${category.color.bg} ${category.color.text} text-sm font-medium mb-4`}
              >
                <category.icon className="h-4 w-4" />
                {category.title}
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-4">
                {category.title}
              </h1>
              <p className="text-lg text-foreground-secondary leading-relaxed max-w-2xl">
                {category.description}
              </p>
            </div>

            {/* Use cases section */}
            <section className="mb-16">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                What you can capture
              </h2>
              <div className="space-y-4">
                {category.useCases.map((useCase, index) => (
                  <div
                    key={index}
                    className="bg-background-card rounded-xl border border-border p-6 hover:border-foreground/20 transition-colors"
                  >
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-foreground-secondary text-sm leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Before/After example */}
            <section className="mb-16">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Real example: {category.example.scenario}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Before */}
                <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-4">
                    <Quote className="h-4 w-4" />
                    Before SpecBridge
                  </div>
                  <p className="text-red-900/80 text-sm italic leading-relaxed">
                    {category.example.before}
                  </p>
                </div>

                {/* After */}
                <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-4">
                    <Check className="h-4 w-4" />
                    After SpecBridge
                  </div>
                  <p className="text-green-900/80 text-sm leading-relaxed">
                    {category.example.after}
                  </p>
                </div>
              </div>
            </section>

            {/* Benefits */}
            <section className="mb-16">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Key benefits
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {category.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full ${category.color.bg} ${category.color.text} flex items-center justify-center flex-shrink-0 mt-0.5`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-foreground-secondary text-sm">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="bg-background-sidebar rounded-2xl p-8 text-center mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Ready to capture your {category.shortTitle.toLowerCase()} knowledge?
              </h2>
              <p className="text-foreground-secondary mb-6 max-w-lg mx-auto">
                Start a free interview and see how SpecBridge transforms
                unstructured expertise into actionable documentation.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3 rounded-full font-medium hover:bg-foreground/90 transition-all hover:shadow-lg"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>

            {/* Prev/Next navigation */}
            <div className="flex items-center justify-between pt-8 border-t border-border">
              {prev ? (
                <Link
                  href={`/use-cases/${prev.slug}`}
                  className="group flex items-center gap-3 text-foreground-secondary hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <div>
                    <div className="text-xs text-foreground-muted mb-0.5">
                      Previous
                    </div>
                    <div className="text-sm font-medium">{prev.shortTitle}</div>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {next ? (
                <Link
                  href={`/use-cases/${next.slug}`}
                  className="group flex items-center gap-3 text-foreground-secondary hover:text-foreground transition-colors text-right"
                >
                  <div>
                    <div className="text-xs text-foreground-muted mb-0.5">
                      Next
                    </div>
                    <div className="text-sm font-medium">{next.shortTitle}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
