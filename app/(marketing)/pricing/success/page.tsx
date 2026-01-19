"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingSuccessPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push("/dashboard");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center max-w-md px-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>

                <h1 className="text-2xl font-semibold text-foreground mb-2">
                    Subscription activated
                </h1>
                <p className="text-foreground-secondary mb-8">
                    Your organization has been upgraded. You now have access to all Pro features.
                </p>

                <Button onClick={() => router.push("/dashboard")} className="w-full">
                    Go to Dashboard
                </Button>

                <p className="mt-4 text-sm text-foreground-muted">
                    Redirecting in {countdown} seconds...
                </p>
            </div>
        </div>
    );
}
