"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  GitBranch,
  FileText,
  Zap,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ParticleField } from "@/components/ui/particle-field";
import { AnimatedDemo } from "@/components/marketing/animated-demo";

// Hook for scroll-triggered animations
function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// Parallax hook for subtle depth effect
function useParallax(speed = 0.5) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrolled = window.scrollY;
        const rate = scrolled * speed * 0.1;
        setOffset(rate);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return { ref, offset };
}

// Hero Section
function HeroSection() {
  const { ref: parallaxRef, offset } = useParallax(0.3);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background-sidebar" />

      {/* Scan lines animation */}
      <ParticleField
        lineCount={35}
        color="26, 26, 26"
        maxOpacity={0.12}
        mouseInfluence={300}
      />

      {/* Floating decorative elements with parallax */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-foreground/[0.02] rounded-full blur-3xl"
          style={{ transform: `translateY(${offset * 0.5}px)` }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-foreground/[0.015] rounded-full blur-3xl"
          style={{ transform: `translateY(${-offset * 0.3}px)` }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-foreground/5 px-4 py-1.5 mb-8 animate-fade-in">
          <Sparkles className="h-4 w-4 text-foreground-secondary" />
          <span className="text-sm text-foreground-secondary">
            AI-powered knowledge extraction
          </span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground tracking-tight leading-[1.1] animate-fade-in-up">
          Bridge the gap between
          <br />
          <span className="text-foreground-secondary">experts and engineers</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-lg sm:text-xl text-foreground-secondary max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-100">
          SpecBridge interviews domain experts in their own language, then translates
          their knowledge into diagrams, flowcharts, and formalized logic for technical teams.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-200">
          <Link
            href="/dashboard"
            className="group rounded-full bg-foreground px-8 py-3.5 text-base font-medium text-background hover:bg-foreground/90 transition-all hover:shadow-xl hover:shadow-foreground/10 flex items-center gap-2"
          >
            Start for free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-full border border-border px-8 py-3.5 text-base font-medium text-foreground hover:bg-foreground/5 transition-all"
          >
            See how it works
          </Link>
        </div>

        {/* Social proof hint */}
        <p className="mt-12 text-sm text-foreground-muted animate-fade-in-up animation-delay-300">
          Trusted by forward-thinking teams at companies shipping faster
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-foreground-muted/30 flex justify-center pt-2">
          <div className="w-1 h-2 bg-foreground-muted/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}

// Problem/Solution Section
function ProblemSection() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-24 bg-background-sidebar">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className={`max-w-3xl mx-auto text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
            The hidden cost of miscommunication
          </h2>
          <p className="mt-6 text-lg text-foreground-secondary leading-relaxed">
            30-40% of implementation time is spent just understanding requirements.
            Domain experts think in business language. Developers need precise specifications.
            The gap between them costs enterprises millions in rework and failed projects.
          </p>
        </div>

        <div className="mt-16 flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-0">
          {[
            {
              problem: "Experts struggle to articulate tacit knowledge",
              solution: "AI asks the right questions in their language",
            },
            {
              problem: "Edge cases emerge weeks into development",
              solution: "Systematic probing catches them upfront",
            },
            {
              problem: "Knowledge gets lost between meetings",
              solution: "Everything captured and structured automatically",
            },
          ].map((item, i, arr) => (
            <div
              key={i}
              className={`flex items-center transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="bg-background rounded-2xl p-6 h-full border border-border hover:shadow-lg hover:shadow-foreground/5 transition-all flex-1 md:w-72">
                <div className="text-foreground-muted line-through text-sm mb-3">
                  {item.problem}
                </div>
                <div className="text-foreground font-medium flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  {item.solution}
                </div>
              </div>
              {i < arr.length - 1 && (
                <div className="hidden md:flex items-center justify-center w-12 flex-shrink-0">
                  <ArrowRight className="h-5 w-5 text-foreground-muted" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Features Section with parallax cards
function FeaturesSection() {
  const { ref, isVisible } = useScrollAnimation();
  const { ref: parallaxRef, offset } = useParallax(0.2);

  const features = [
    {
      icon: MessageSquare,
      title: "Intelligent Interviews",
      description:
        "Our AI interviewer speaks business language, asks contextual follow-ups, and knows when to dig deeper versus move on.",
    },
    {
      icon: GitBranch,
      title: "Visual Decision Trees",
      description:
        "Automatically generate flowcharts and decision trees that reveal the true complexity of business processes.",
    },
    {
      icon: FileText,
      title: "Formalized Rules",
      description:
        "Transform fuzzy business logic into precise IF/THEN statements with priorities and edge case handling.",
    },
    {
      icon: Zap,
      title: "Instant Artifacts",
      description:
        "Generate overviews, diagrams, rules, variables, and edge cases on demand. Export to your preferred format.",
    },
    {
      icon: Users,
      title: "Async Collaboration",
      description:
        "Experts capture knowledge on their schedule. Developers consume it when they need it. No more meeting overload.",
    },
    {
      icon: CheckCircle2,
      title: "Validation Ready",
      description:
        "Built-in test case generation helps you validate implementations match the captured business intent.",
    },
  ];

  return (
    <section ref={ref} id="features" className="py-24 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div
        ref={parallaxRef}
        className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-foreground/[0.02] to-transparent pointer-events-none"
        style={{ transform: `translateY(${offset * 0.2}px)` }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
            Everything you need to capture knowledge
          </h2>
          <p className="mt-4 text-lg text-foreground-secondary max-w-2xl mx-auto">
            A complete toolkit for extracting, structuring, and sharing domain expertise
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group bg-background-card rounded-2xl p-6 border border-border hover:border-foreground/20 transition-all duration-500 hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-1 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors">
                <feature.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-foreground-secondary text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const { ref, isVisible } = useScrollAnimation();

  const steps = [
    {
      step: "01",
      title: "Expert describes the process",
      description:
        "Start with a simple description in plain language. No technical jargon required.",
    },
    {
      step: "02",
      title: "AI asks intelligent questions",
      description:
        "Our interviewer probes for edge cases, thresholds, exceptions, and the nuances that matter.",
    },
    {
      step: "03",
      title: "Knowledge becomes artifacts",
      description:
        "Get flowcharts, decision trees, formalized rules, and test cases. Ready for implementation.",
    },
    {
      step: "04",
      title: "Teams align and build",
      description:
        "Developers get precise specs. Stakeholders can validate. Everyone moves faster.",
    },
  ];

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="py-24 bg-background-sidebar"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-lg text-foreground-secondary">
            From conversation to implementation in four simple steps
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, i) => (
              <div
                key={i}
                className={`relative transition-all duration-700 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="bg-background rounded-2xl p-6 border border-border relative z-10 h-full">
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-foreground-secondary text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Product Demo Section - Animated preview of the interface
function ProductDemoSection() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
            See it in action
          </h2>
          <p className="mt-4 text-lg text-foreground-secondary max-w-2xl mx-auto">
            A simple conversation becomes comprehensive documentation
          </p>
        </div>

        <div
          className={`relative transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <AnimatedDemo />

          {/* Floating decoration */}
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-foreground/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-foreground/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

// Testimonial/Social Proof Section
function TestimonialSection() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div
          className={`bg-background-card rounded-3xl p-8 sm:p-12 border border-border text-center transition-all duration-700 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <blockquote className="text-xl sm:text-2xl text-foreground font-medium leading-relaxed">
            "It's like having a business analyst who asked all the right questions,
            documented everything perfectly, and is available 24/7."
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-foreground/10" />
            <div className="text-left">
              <div className="font-medium text-foreground">Engineering Lead</div>
              <div className="text-sm text-foreground-secondary">
                Enterprise Software Company
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Final CTA Section
function CTASection() {
  const { ref, isVisible } = useScrollAnimation();
  const { ref: parallaxRef, offset } = useParallax(0.3);

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 bg-gradient-to-t from-background-sidebar via-background to-background pointer-events-none"
        style={{ transform: `translateY(${offset * 0.1}px)` }}
      />

      <div
        className={`relative z-10 mx-auto max-w-3xl px-6 text-center transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
          Ready to bridge the gap?
        </h2>
        <p className="mt-4 text-lg text-foreground-secondary">
          Start capturing domain knowledge today. Free to try, no credit card required.
        </p>
        <div className="mt-10">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-base font-medium text-background hover:bg-foreground/90 transition-all hover:shadow-xl hover:shadow-foreground/10"
          >
            Get started for free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Main Page Component
export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ProductDemoSection />
      <TestimonialSection />
      <CTASection />
    </>
  );
}
