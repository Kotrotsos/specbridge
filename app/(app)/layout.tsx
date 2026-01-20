import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  OrganizationSwitcher,
} from "@clerk/nextjs";
import Link from "next/link";
import { ProjectSidebar } from "@/components/sidebar/project-sidebar";
import { ProjectSidebarWrapper } from "@/components/ui/collapsible-sidebar";
import { ProgressProvider } from "@/components/ui/progress-bar";

function Navbar() {
  return (
    <nav className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-foreground">SpecBridge</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-[8px] bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <OrganizationSwitcher
            hidePersonal={false}
            afterCreateOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
            afterLeaveOrganizationUrl="/dashboard"
          />
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider waitlistUrl="/waitlist" dynamic>
      <ProgressProvider>
        <div className="h-screen bg-background flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 flex min-h-0">
            <SignedIn>
              <ProjectSidebarWrapper>
                <ProjectSidebar />
              </ProjectSidebarWrapper>
            </SignedIn>
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </ProgressProvider>
    </ClerkProvider>
  );
}
