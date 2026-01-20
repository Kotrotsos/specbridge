import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-4xl font-semibold text-foreground tracking-tight mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-neutral max-w-none text-foreground-secondary">
          <p className="text-lg mb-8">
            Last updated: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              When you use SpecBridge, we collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Account information (name, email address)</li>
              <li>Project and specification data you create</li>
              <li>Communications with our AI assistant during interviews</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your specifications and generate documentation</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Data Storage and Security</h2>
            <p className="mb-4">
              Your data is stored securely using industry-standard encryption. We implement appropriate
              technical and organizational measures to protect your personal information against
              unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. AI Processing</h2>
            <p className="mb-4">
              SpecBridge uses AI to conduct interviews and generate specifications. Your interview
              conversations are processed by our AI systems to create documentation. We do not use
              your specific project data to train our AI models.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Data Retention</h2>
            <p className="mb-4">
              We retain your information for as long as your account is active or as needed to provide
              you services. You can request deletion of your account and associated data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Your Rights</h2>
            <p className="mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <Link href="mailto:marco@specbridge.ai" className="text-foreground underline hover:no-underline">
                marco@specbridge.ai
              </Link>
            </p>
          </section>
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
