import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-4xl font-semibold text-foreground tracking-tight mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-neutral max-w-none text-foreground-secondary">
          <p className="text-lg mb-8">
            Last updated: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using SpecBridge, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p className="mb-4">
              SpecBridge is a software requirements specification platform that uses AI-powered
              interviews to help you document business requirements, processes, and specifications.
              The service includes project management, specification generation, and export capabilities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account. You must provide accurate and
              complete information when creating an account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Acceptable Use</h2>
            <p className="mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Upload malicious code or content</li>
              <li>Violate the intellectual property rights of others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Intellectual Property</h2>
            <p className="mb-4">
              You retain ownership of the content you create using SpecBridge. We retain ownership
              of the SpecBridge platform, including its software, design, and documentation.
              You grant us a license to use your content solely to provide and improve our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. AI-Generated Content</h2>
            <p className="mb-4">
              SpecBridge uses AI to assist in generating specifications and documentation. While we
              strive for accuracy, AI-generated content should be reviewed and validated by qualified
              professionals. You are responsible for verifying the accuracy and completeness of all
              generated specifications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Limitation of Liability</h2>
            <p className="mb-4">
              SpecBridge is provided &quot;as is&quot; without warranties of any kind. We shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages resulting
              from your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account at any time for violations of these terms.
              You may terminate your account at any time by contacting us. Upon termination, your
              right to use the service will cease immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. We will notify users of
              significant changes via email or through the service. Continued use after changes
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Contact</h2>
            <p className="mb-4">
              For questions about these Terms of Service, please contact us at{" "}
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
