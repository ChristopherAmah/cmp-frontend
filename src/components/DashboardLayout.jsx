import { useState } from "react";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const workspaceRoles = [
  { id: "client-user", label: "Client User", shortLabel: "Client" },
  { id: "developer", label: "Developer", shortLabel: "Dev" },
  { id: "support-lead", label: "Support Lead", shortLabel: "Support" },
  { id: "admin", label: "Admin", shortLabel: "Admin" },
];

const roleToWorkspaceRole = {
  client: "client-user",
  client_user: "client-user",
  user: "client-user",
  developer: "developer",
  support_lead: "support-lead",
  "support-lead": "support-lead",
  admin: "admin",
  super_admin: "admin",
};

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentRole = roleToWorkspaceRole[user?.role];

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette />
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      {/* Top Bar with Menu Button and Current Role Indicator */}
      <div className={cn(
        "fixed top-0 right-0 left-0 md:left-[80px] xl:left-[280px] h-12 sm:h-14 md:h-16 lg:h-20 bg-background/95 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 md:px-5 lg:px-6 transition-all duration-300 ease-in-out",
        mobileMenuOpen ? "z-50" : "z-30"
      )}>
        {/* Mobile Menu Button - Left side, aligned with bell icon */}
        <div className="md:hidden flex items-center h-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "relative h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-md hover:bg-accent/50 active:bg-accent transition-all duration-200 touch-manipulation flex items-center justify-center"
            )}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6 text-foreground/80 hover:text-foreground transition-colors" />
            ) : (
              <Menu className="h-5 w-5 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6 text-foreground/80 hover:text-foreground transition-colors" />
            )}
          </Button>
        </div>
        <div className="ml-auto flex h-full min-w-0 items-center">
          <div
            className="grid h-10 w-[260px] grid-cols-4 rounded-[9.32px]  bg-[#F9FAFB] p-1 shadow-sm dark:border-border/90 dark:bg-background/80 dark:shadow-black/30 sm:h-11 sm:w-[430px] md:w-[450px]"
            aria-label={`Current workspace role: ${user?.role || "not available"}`}
          >
            {workspaceRoles.map((role) => {
              const isCurrent = currentRole === role.id;

              return (
                <span
                  key={role.id}
                  aria-current={isCurrent ? "true" : undefined}
                  title={isCurrent ? `${role.label} (current role)` : role.label}
                  className={cn(
                    "flex min-w-0 items-center justify-center rounded-[7.19px] px-2 text-[14px] font-medium text-[#6A7282] dark:text-muted-foreground",
                    isCurrent &&
                      "bg-[#FFFFFF] text-[#1E2939] shadow-sm ring-1 ring-border/50 dark:bg-card dark:text-foreground dark:ring-white/10 dark:shadow-black/30"
                  )}
                >
                  <span className="truncate sm:hidden">{role.shortLabel}</span>
                  <span className="hidden truncate sm:inline">{role.label}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <main className="md:pl-[80px] xl:pl-[280px] pt-12 sm:pt-14 md:pt-16 lg:pt-20 transition-all duration-300 ease-in-out">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10 animate-page-enter max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
