"use client";

import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with specification management.",
    features: [
      "Up to 3 projects",
      "Unlimited specifications per project",
      "AI-powered interviews",
      "Export to markdown",
      "Community support",
    ],
    cta: "Get started free",
    href: "/dashboard",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For teams that need more power and flexibility.",
    features: [
      "Unlimited projects",
      "Unlimited specifications",
      "AI-powered interviews",
      "Export to all formats (PDF, Word, JSON)",
      "Priority support",
      "Team collaboration",
      "Version history",
      "Advanced analytics",
    ],
    cta: "Start 14-day trial",
    href: "/dashboard",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "per organization",
    description: "For large teams with advanced security and compliance needs.",
    features: [
      "Everything in Pro",
      "SSO / SAML authentication",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantees",
      "Audit logs",
      "On-premise deployment option",
    ],
    cta: "Contact sales",
    href: "mailto:enterprise@specbridge.ai",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-foreground-secondary max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include AI-powered interviews
            and unlimited specifications.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-all hover:shadow-lg ${
                plan.highlighted
                  ? "border-foreground bg-background-card shadow-xl scale-105"
                  : "border-border bg-background-card hover:border-foreground/20"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background">
                    <Sparkles className="h-4 w-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period !== "per organization" && (
                    <span className="text-foreground-secondary">/{plan.period}</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-foreground-secondary">{plan.description}</p>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                    <span className="text-sm text-foreground-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`group w-full flex items-center justify-center gap-2 rounded-full py-3 px-6 text-sm font-medium transition-all ${
                  plan.highlighted
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "border border-border hover:border-foreground/30 hover:bg-foreground/5 text-foreground"
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ teaser */}
        <div className="mt-20 text-center">
          <p className="text-foreground-secondary">
            Have questions?{" "}
            <Link href="mailto:hello@specbridge.ai" className="text-foreground underline hover:no-underline">
              Contact us
            </Link>
          </p>
        </div>

        {/* Trust badges */}
        <div className="mt-16 pt-16 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-8 text-foreground-muted text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              14-day money-back guarantee
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
