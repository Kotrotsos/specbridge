"use client";

import { useAuth, useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            "Basic support",
        ],
        cta: "Current Plan",
        ctaDisabled: true,
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
            "Export to all formats",
            "Priority support",
            "Team collaboration",
            "Advanced analytics",
        ],
        cta: "Upgrade to Pro",
        ctaDisabled: false,
        highlighted: true,
    },
];

export default function PricingPage() {
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const { organization } = useOrganization();

    const handleUpgrade = () => {
        if (!isSignedIn) {
            // Redirect to sign in first
            router.push("/sign-in?redirect_url=/pricing");
            return;
        }

        // TODO: When Clerk Billing is enabled, this will open the checkout
        // For now, show a message or redirect to contact
        alert("Billing will be available soon. Contact us for early access to Pro features.");
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-5xl px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-semibold text-foreground">
                        Choose your plan
                    </h1>
                    <p className="mt-3 text-foreground-secondary max-w-2xl mx-auto">
                        Start free and upgrade when you need more features. All plans include unlimited specifications.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl border p-8 ${
                                plan.highlighted
                                    ? "border-blue-500 bg-gradient-to-b from-blue-50/50 to-transparent shadow-lg"
                                    : "border-gray-200 bg-white"
                            }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                                        <Sparkles className="h-3 w-3" />
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                    <span className="text-foreground-secondary">/{plan.period}</span>
                                </div>
                                <p className="mt-3 text-sm text-foreground-secondary">{plan.description}</p>
                            </div>

                            <ul className="mb-8 space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 shrink-0 text-green-600" />
                                        <span className="text-sm text-foreground-secondary">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={plan.ctaDisabled ? undefined : handleUpgrade}
                                disabled={plan.ctaDisabled}
                                className={`w-full ${
                                    plan.highlighted
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-gray-100 text-gray-500 cursor-default"
                                }`}
                            >
                                {plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-sm text-foreground-muted">
                        All plans include a 14-day money-back guarantee. No questions asked.
                    </p>
                </div>
            </div>
        </div>
    );
}
