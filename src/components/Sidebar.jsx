import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../components/ThemeProvider";
import { usePermissions } from "../hooks/usePermissions";
import {
  LayoutDashboard,
  Building2,
  FileText,
  ScrollText,
  User,
  Users,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Shield,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import logoblack from "../assets/logoblack.png";
import logowhite from "../assets/logowhite.png";

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { canViewOrganizations, canViewAuditLogs } = usePermissions();
  const [collapsed, setCollapsed] = useState(false);
  const roleLabel = {
    super_admin: "Super Admin",
    admin: "Admin",
    support_lead: "Support Lead",
    "support-lead": "Support Lead",
    developer: "Developer",
    user: "User",
  };

  useEffect(() => {
    const handleResize = () => {
      // Mobile (< 640px): collapsed, Tablet/Medium (640-1280px): collapsed, Desktop (>= 1280px): expanded
      if (window.innerWidth < 1280) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('aside') && !event.target.closest('button[aria-label="Toggle menu"]') && !event.target.closest('[aria-label="Toggle menu"]')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen, setMobileMenuOpen]);


  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    ...(canViewOrganizations
      ? [{ icon: Building2, label: "Organizations", path: "/organizations" }]
      : []),
    { icon: FileText, label: "Documents", path: "/dashboard/documents" },
    { icon: ScrollText, label: "Contracts", path: "/contracts" },
    ...(user?.role === "admin" || user?.role === "super_admin"
      ? [{ icon: Users, label: "Users", path: "/users" }]
      : []),
    ...(canViewAuditLogs
      ? [{ icon: Shield, label: "Audit Logs", path: "/audit-logs" }]
      : []),
    { icon: LifeBuoy, label: "Support", path: "/support" },
    { icon: User, label: "Profile", path: "/dashboard/profile" },
  ];

  const isActive = (path) => {
    if (path === "/dashboard" && location.pathname === "/dashboard")
      return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path))
      return true;
    return false;
  };

  const isExpanded = !collapsed;

  return (
    <TooltipProvider>
      {/* Sidebar - Responsive */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen",
          "bg-background/95 backdrop-blur-sm",
          "transition-all duration-300 ease-in-out",
          // Mobile: full width when open, hidden when closed
          "w-full sm:w-64 md:w-72",
          // Tablet/Medium (md-lg): collapsed (80px), always visible
          "md:w-[80px]",
          // Desktop (xl): collapsed (80px) or expanded (280px)
          isExpanded ? "xl:w-[280px]" : "xl:w-[80px]",
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo - Responsive */}
          <div
            className={cn(
              "h-12 sm:h-14 md:h-16 lg:h-20 flex items-center",
              "relative px-3 sm:px-4 md:px-2 lg:px-3"
            )}
          >
            {/* Logo - Responsive */}
            <div
              className={cn(
                "flex items-center transition-all duration-300 flex-1",
                // Mobile: center logo when sidebar is open
                "justify-center md:justify-center",
                // Desktop: center when collapsed, align left when expanded
                isExpanded && "md:justify-start md:px-2"
              )}
            >
              <img
                src={theme === "dark" ? logowhite : logoblack}
                alt="Logo"
                className={cn(
                  "object-contain transition-all duration-300",
                  mobileMenuOpen || isExpanded
                    ? "h-8 sm:h-9 md:h-10 w-auto max-w-[120px] sm:max-w-[140px]"
                    : "h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                )}
              />
            </div>
            <hr className="absolute bottom-0 left-3 right-3 border-[#CBD5E1]" />
          </div>

          {/* Navigation - Responsive */}
          <nav className="flex-1 py-4 sm:py-5 md:py-6 overflow-y-auto overscroll-contain">
            <div className={cn("space-y-1 sm:space-y-1.5", isExpanded || mobileMenuOpen ? "px-3 sm:px-4" : "px-2 sm:px-3")}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const showLabel = isExpanded || mobileMenuOpen;
                const showTooltip = !isExpanded && !mobileMenuOpen;
                
                const linkContent = (
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 rounded-lg transition-all duration-200 ease-in-out",
                      "min-h-[44px] touch-manipulation", // Minimum tap target for mobile
                      showLabel 
                        ? "px-3 sm:px-4 py-2.5 sm:py-3" 
                        : "justify-center p-2.5 sm:p-3",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 transition-transform duration-200",
                        active && "scale-105"
                      )}
                      strokeWidth={1.75}
                    />
                    {showLabel && (
                      <span className="text-sm sm:text-[14px] font-medium transition-opacity duration-200">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );

                if (showTooltip) {
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return <div key={item.path}>{linkContent}</div>;
              })}
            </div>
          </nav>

          {/* Footer */}
          <div
            className={cn(
              "py-5",
              isExpanded || mobileMenuOpen ? "px-4" : "px-3"
            )}
          >
            {/* User */}
            {(isExpanded || mobileMenuOpen) ? (
              <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-secondary rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {roleLabel[user?.role] || "User"}
                  </p>
                </div>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <div className="text-center">
                    <p className="font-medium text-[15px]">{user?.name || "User"}</p>
                    <p className="text-[14px] text-muted-foreground">
                      {roleLabel[user?.role] || "User"}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Actions */}
            <div
              className={cn(
                "space-y-1.5",
                !isExpanded && !mobileMenuOpen && "flex flex-col items-center"
              )}
            >
              {!isExpanded && !mobileMenuOpen ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className={cn(
                          "flex items-center justify-center rounded-lg transition-all duration-200 ease-in-out",
                          "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          "min-h-[44px] touch-manipulation p-3"
                        )}
                        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                      >
                        {theme === "dark" ? (
                          <Sun className="w-5 h-5 transition-transform duration-200 hover:rotate-12" strokeWidth={1.75} />
                        ) : (
                          <Moon className="w-5 h-5 transition-transform duration-200 hover:rotate-12" strokeWidth={1.75} />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleLogout}
                        className={cn(
                          "flex items-center justify-center rounded-lg transition-all duration-200 ease-in-out",
                          "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                          "min-h-[44px] touch-manipulation p-3"
                        )}
                        aria-label="Logout"
                      >
                        <LogOut className="w-5 h-5 transition-transform duration-200 hover:translate-x-0.5" strokeWidth={1.75} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      Logout
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={cn(
                      "flex items-center gap-3 rounded-lg transition-all duration-200 ease-in-out",
                      "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      "min-h-[44px] touch-manipulation w-full px-4 py-3"
                    )}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {theme === "dark" ? (
                      <Sun className="w-5 h-5 transition-transform duration-200 hover:rotate-12" strokeWidth={1.75} />
                    ) : (
                      <Moon className="w-5 h-5 transition-transform duration-200 hover:rotate-12" strokeWidth={1.75} />
                    )}
                    <span className="text-[14px] font-medium">
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className={cn(
                      "flex items-center gap-3 rounded-lg transition-all duration-200 ease-in-out",
                      "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                      "min-h-[44px] touch-manipulation w-full px-4 py-3"
                    )}
                    aria-label="Logout"
                  >
                    <LogOut className="w-5 h-5 transition-transform duration-200 hover:translate-x-0.5" strokeWidth={1.75} />
                    <span className="text-[14px] font-medium">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay - Only on mobile screens */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </TooltipProvider>
  );
};

export default Sidebar;
