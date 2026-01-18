"use client";

import { Waitlist } from "@clerk/nextjs";

export default function WaitlistPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Waitlist />
    </div>
  );
}
