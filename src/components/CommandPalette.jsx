import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  Building2,
  FileText,
  ScrollText,
  User,
  Users,
  Search,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../contexts/AuthContext";

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const commands = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", keywords: "home overview" },
    { icon: Building2, label: "Organizations", path: "/organizations", keywords: "companies clients" },
    { icon: FileText, label: "Documents", path: "/dashboard/documents", keywords: "files uploads" },
    { icon: ScrollText, label: "Contracts", path: "/contracts", keywords: "agreements deals" },
    ...(user?.role === "admin" || user?.role === "super_admin"
      ? [{ icon: Users, label: "Users", path: "/users", keywords: "team members" }]
      : []),
    { icon: User, label: "Profile", path: "/dashboard/profile", keywords: "account settings" },
  ];

  const filteredCommands = commands.filter((cmd) =>
    `${cmd.label} ${cmd.keywords}`.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard shortcut to open
  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          navigate(filteredCommands[selectedIndex].path);
          setOpen(false);
        }
      }
    },
    [filteredCommands, selectedIndex, navigate]
  );

  const handleSelect = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-lg overflow-hidden">
        <div className="flex items-center border-b border-border px-4">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 py-4 text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border border-border bg-muted px-2 font-mono text-xs text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.path}
                  onClick={() => handleSelect(cmd.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                    index === selectedIndex
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                  <span className="flex-1 font-medium">{cmd.label}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">↓</kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">↵</kbd>
            to select
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
