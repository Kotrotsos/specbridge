import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { ProjectSidebar } from "@/components/sidebar/project-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpecBridge",
  description: "Bridge the gap between domain experts and technical implementers",
};

function Navbar() {
  return (
    <nav className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-foreground">SpecBridge</span>
        </Link>
        <SignedIn>
          <Link
            href="/pricing"
            className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
        </SignedIn>
      </div>
      <div className="flex items-center gap-4">
        <SignedOut>
          <Link
            href="/pricing"
            className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <SignInButton mode="modal">
            <button className="rounded-[8px] bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}

function NavbarPlaceholder() {
  return (
    <nav className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-foreground">SpecBridge</span>
        </Link>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if Clerk is configured
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // If no Clerk key, render without auth
  if (!clerkPubKey) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-background antialiased flex flex-col">
          <NavbarPlaceholder />
          <div className="flex-1 flex">
            <ProjectSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-background antialiased flex flex-col">
          <Navbar />
          <div className="flex-1 flex">
            <ProjectSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
