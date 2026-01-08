import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "BridgeSpec",
  description: "Bridge the gap between domain experts and technical implementers",
};

function AuthButton() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <SignedOut>
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
        <body className="min-h-screen bg-background antialiased">
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-background antialiased">
          <AuthButton />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
