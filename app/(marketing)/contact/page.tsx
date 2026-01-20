import Link from "next/link";
import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-4xl font-semibold text-foreground tracking-tight mb-4">
          Contact
        </h1>
        <p className="text-lg text-foreground-secondary mb-12">
          Have questions or feedback? We&apos;d love to hear from you.
        </p>

        <div className="bg-background-card border border-border rounded-2xl p-8 max-w-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-foreground-secondary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                Marco Kotrotsos
              </h2>
              <Link
                href="mailto:marco@specbridge.ai"
                className="text-foreground-secondary hover:text-foreground transition-colors"
              >
                marco@specbridge.ai
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/" className="text-foreground-secondary hover:text-foreground transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
