import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import TicketDetailDrawer from "../components/support/TicketDetailDrawer";
import NewTicketDrawer from "../components/support/NewTicketDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ticketService } from "../services/ticketService";
import { organizationService } from "../services/organizationService";
import { notificationService } from "../services/notificationService";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import {
  Plus,
  RefreshCw,
  Download,
  ChevronRight,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  FileCheck2,
  FileWarning,
  Layers,
  Eye,
  Check,
  Trash2,
  MessageSquare,
} from "lucide-react";

// Ticket data is loaded from the backend

const LEGACY_SLA_TARGET_HOURS = { Critical: 4, High: 8, Medium: 24, Low: 72 };

const getTicketAssignees = (ticket) => {
  const assignees = ticket.assignedTo ?? ticket.developer;
  return Array.isArray(assignees) ? assignees : assignees ? [assignees] : [];
};

const formatSlaDuration = (milliseconds) => {
  const absolute = Math.abs(milliseconds);
  const hours = Math.floor(absolute / 3_600_000);
  const minutes = Math.floor((absolute % 3_600_000) / 60_000);
  const seconds = Math.floor((absolute % 60_000) / 1_000);
  const prefix = milliseconds < 0 ? "-" : "";
  return `${prefix}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const toSlaRecord = (ticket, now = Date.now()) => {
  const targetHours = Number(ticket.slaTargetHours ?? ticket.sla?.targetHours) || LEGACY_SLA_TARGET_HOURS[ticket.priority] || LEGACY_SLA_TARGET_HOURS.Low;
  const targetMs = targetHours * 3_600_000;
  const createdAt = new Date(ticket.createdAt || ticket.created);
  const elapsedMs = Number.isNaN(createdAt.getTime()) ? 0 : Math.max(0, now - createdAt.getTime());
  const progress = Math.min(100, Math.round((elapsedMs / targetMs) * 100));
  const isResolved = ["Resolved", "Closed"].includes(ticket.status);
  const status = isResolved
    ? "Resolved"
    : elapsedMs >= targetMs
      ? "Breached"
      : elapsedMs >= targetMs * 0.75
        ? "At Risk"
        : "Compliant";

  return {
    ticket,
    ref: ticket.id,
    title: ticket.subject,
    severity: ticket.priority,
    assignee: getTicketAssignees(ticket).join(", "),
    target: `${targetHours}h`,
    progress: isResolved ? 100 : progress,
    remaining: isResolved ? "Resolved" : formatSlaDuration(targetMs - elapsedMs),
    status,
  };
};

const statTints = {
  sky: "bg-sky-50 text-sky-500 dark:bg-sky-950/40 dark:text-sky-400",
  emerald:
    "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400",
  red: "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400",
};

const severityMeta = {
  Critical: {
    dot: "bg-red-500",
    pill: "border-red-200 text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
  },
  High: {
    dot: "bg-orange-500",
    pill: "border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50",
  },
  Medium: {
    dot: "bg-amber-500",
    pill: "border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
  },
  Low: {
    dot: "bg-sky-500",
    pill: "border-sky-200 text-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50",
  },
};

const slaStatusStyles = {
  Compliant:
    "border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
  Breached:
    "border-red-200 text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
  "At Risk":
    "border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
  Resolved: "border-border text-muted-foreground bg-secondary",
};

const progressBarColor = {
  Compliant: "bg-emerald-500",
  Breached: "bg-red-500",
  "At Risk": "bg-amber-500",
  Resolved: "bg-slate-300 dark:bg-slate-600",
};

const remainingTextColor = {
  Compliant: "text-emerald-600 dark:text-emerald-400",
  Breached: "text-red-600 dark:text-red-400",
  "At Risk": "text-amber-600 dark:text-amber-400",
  Resolved: "text-muted-foreground",
};

const SLA_TABS = ["All Tickets", "Breached", "At Risk", "Compliant", "Resolved"];

const notificationVisuals = {
  Assignment: { icon: User, iconClass: "bg-sky-50 text-sky-600" },
  "SLA Alert": { icon: AlertTriangle, iconClass: "bg-red-50 text-red-500" },
  "Status Change": { icon: RefreshCw, iconClass: "bg-violet-50 text-violet-600" },
  Comment: { icon: MessageSquare, iconClass: "bg-emerald-50 text-emerald-600" },
  System: { icon: FileText, iconClass: "bg-slate-50 text-slate-600" },
};

const formatNotificationTime = (createdAt) => {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1_000));
  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3_600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86_400) return `${Math.floor(elapsedSeconds / 3_600)}h ago`;
  return `${Math.floor(elapsedSeconds / 86_400)}d ago`;
};

const toDisplayNotification = (notification) => ({
  ...notification,
  ...notificationVisuals[notification.category],
  unread: !notification.isRead,
  time: formatNotificationTime(notification.createdAt),
});

const INITIAL_NOTIFICATION_PREFERENCES = {
  Assignments: true,
  "SLA Alerts": true,
  "Status Changes": true,
  Comments: false,
  System: true,
};

const PREFERENCE_FOR_CATEGORY = {
  Assignment: "Assignments",
  "SLA Alert": "SLA Alerts",
  "Status Change": "Status Changes",
  Comment: "Comments",
  System: "System",
};

const getInitialNotificationPreferences = () => {
  try {
    const saved = window.localStorage.getItem("support-notification-preferences");
    return saved
      ? { ...INITIAL_NOTIFICATION_PREFERENCES, ...JSON.parse(saved) }
      : INITIAL_NOTIFICATION_PREFERENCES;
  } catch {
    return INITIAL_NOTIFICATION_PREFERENCES;
  }
};

const SEVERITY_LEGEND = [
  { label: "Critical ", dot: "bg-red-500" },
  { label: "High ", dot: "bg-orange-500" },
  { label: "Medium ", dot: "bg-amber-500" },
  { label: "Low ", dot: "bg-sky-500" },
];

// -------------------- Badge styles --------------------
const priorityStyles = {
  Critical:
    "border-red-200 text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
  High: "border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50",
  Medium:
    "border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
  Low: "border-border text-muted-foreground bg-secondary",
};

const statusStyles = {
  Open: "border-sky-200 text-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50",
  "In Progress":
    "border-indigo-200 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50",
  Resolved:
    "border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
  Closed: "border-border text-muted-foreground bg-secondary",
};

const slaStyles = {
  ok: "border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
  warn: "border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
  breached:
    "border-red-200 text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
};

const Pill = ({ className, children }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
      className
    )}
  >
    {children}
  </span>
);

const formatTicketDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));

const TABS = [
  { key: "tickets", label: "Tickets" },
  { key: "sla", label: "SLA Monitoring" },
  { key: "notification", label: "Notification" },
];

const Support = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("tickets");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [priority, setPriority] = useState("all");
  const [ticketType, setTicketType] = useState("all");
  const [organization, setOrganization] = useState("all");
  const [developer, setDeveloper] = useState("all");
  const [tickets, setTickets] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationPreferences, setNotificationPreferences] = useState(
    getInitialNotificationPreferences
  );

  const loadTickets = async () => {
    setLoadingTickets(true);
    setTicketsError("");

    try {
      const data = await ticketService.getTickets();
      setTickets(data);
    } catch (error) {
      console.error("Failed to load support tickets", error);
      setTicketsError("Unable to load tickets at this time.");
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadNotifications = async () => {
    setNotificationsError("");
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.map(toDisplayNotification));
    } catch (error) {
      console.error("Failed to load notifications", error);
      setNotificationsError("Unable to load notifications at this time.");
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await organizationService.getAll({ limit: 500 });
      setOrganizations(response.data || []);
    } catch (error) {
      console.error("Failed to load organizations", error);
      setOrganizations([]);
    }
  };

  useEffect(() => {
    loadTickets();
    loadNotifications();
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (location.state?.openNewTicket) {
      setActiveTab("tickets");
      setNewTicketOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const ticketId = new URLSearchParams(location.search).get("ticket");
    if (!ticketId || tickets.length === 0) return;

    const ticket = tickets.find((item) => item.id === ticketId);
    if (ticket) {
      setActiveTab("tickets");
      setSelectedTicket(ticket);
    }
  }, [location.search, tickets]);

  // SLA monitoring state
  const [slaSearch, setSlaSearch] = useState("");
  const [slaStatus, setSlaStatus] = useState("all");
  const [slaTab, setSlaTab] = useState("All Tickets");
  const [slaNow, setSlaNow] = useState(Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setSlaNow(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const slaRows = useMemo(
    () => tickets.map((ticket) => toSlaRecord(ticket, slaNow)),
    [tickets, slaNow]
  );

  const slaStats = useMemo(() => {
    const count = (statusName) => slaRows.filter((row) => row.status === statusName).length;
    const breached = count("Breached");
    const atRisk = count("At Risk");
    return [
      { label: "Total Tickets", value: slaRows.length, trend: "Live", icon: FileText, tint: "sky" },
      { label: "Active (Breached + At Risk)", value: breached + atRisk, trend: "Live", icon: Layers, tint: "emerald" },
      { label: "Resolved", value: count("Resolved"), trend: "Live", icon: FileCheck2, tint: "sky" },
      { label: "Tickets Breached", value: breached, trend: "Live", icon: Clock, tint: "amber" },
      { label: "At Risk", value: atRisk, trend: "Live", icon: FileWarning, tint: "red" },
      { label: "Compliant", value: count("Compliant"), trend: "Live", icon: FileCheck2, tint: "sky" },
    ];
  }, [slaRows]);

  const slaFiltered = useMemo(() => {
    return slaRows.filter((r) => {
      const q = slaSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.ref.toLowerCase().includes(q) ||
        (r.assignee || "").toLowerCase().includes(q);
      const matchesStatus = slaStatus === "all" || r.status === slaStatus;
      const matchesTab = slaTab === "All Tickets" || r.status === slaTab;
      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [slaRows, slaSearch, slaStatus, slaTab]);

  const developers = useMemo(
    () => [...new Set(tickets.flatMap(getTicketAssignees))],
    [tickets]
  );

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.customer.toLowerCase().includes(q);
      const matchesStatus = status === "all" || t.status === status;
      const matchesPriority = priority === "all" || t.priority === priority;
      const matchesSeverity = severity === "all" || t.priority === severity;
      const matchesType = ticketType === "all" || t.type === ticketType;
      const matchesOrg = organization === "all" || t.customer === organization;
      const matchesDev =
        developer === "all" ||
        (developer === "unassigned"
          ? getTicketAssignees(t).length === 0
          : getTicketAssignees(t).includes(developer));
      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesSeverity &&
        matchesType &&
        matchesOrg &&
        matchesDev
      );
    });
  }, [tickets, search, status, severity, priority, ticketType, organization, developer]);

  const exportTickets = () => {
    const rows = filtered.map((ticket) => ({
      "Ticket ID": ticket.id,
      Subject: ticket.subject,
      Priority: ticket.priority,
      Category: ticket.type || ticket.category || "",
      Status: ticket.status,
      "Assigned To": getTicketAssignees(ticket).join(", "),
      SLA: ticket.sla?.label || ticket.sla?.state || "",
      Customer: ticket.customer,
      Created: formatTicketDate(ticket.created),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 36 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
      { wch: 32 },
      { wch: 16 },
      { wch: 30 },
      { wch: 16 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    XLSX.writeFile(workbook, `support-tickets-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const createTicket = async (ticket) => {
    const created = await ticketService.createTicket({
      ...ticket,
      // Map the drawer's labels to the backend Ticket schema.
      subject: ticket.title,
      customer: ticket.organization,
      priority: ticket.priority || ticket.severity,
      slaTargetHours: ticket.slaTargetHours ? Number(ticket.slaTargetHours) : undefined,
    });
    if (!created) {
      throw new Error("The ticket was not returned by the server.");
    }
    setTickets((currentTickets) => [created, ...currentTickets]);
    void loadNotifications();
    return created;
  };

  useEffect(() => {
    window.localStorage.setItem(
      "support-notification-preferences",
      JSON.stringify(notificationPreferences)
    );
  }, [notificationPreferences]);

  const visibleNotifications = notifications.filter((notification) => {
    const preference = PREFERENCE_FOR_CATEGORY[notification.category];
    return (
      notificationPreferences[preference] &&
      (notificationFilter === "all" || notification.unread)
    );
  });
  const unreadNotifications = visibleNotifications.filter(
    (notification) => notification.unread
  ).length;
  const failedNotifications = visibleNotifications.filter(
    (notification) => notification.delivery === "failed"
  ).length;
  const deliveredNotifications = visibleNotifications.filter(
    (notification) => notification.delivery === "delivered"
  ).length;

  const markNotificationRead = async (id) => {
    try {
      const updated = await notificationService.markRead(id);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? toDisplayNotification(updated) : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      setNotificationsError("Unable to update the notification.");
    }
  };

  const removeNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((current) => current.filter((notification) => notification.id !== id));
    } catch (error) {
      console.error("Failed to delete notification", error);
      setNotificationsError("Unable to delete the notification.");
    }
  };

  return (
    <DashboardLayout>
      <div className="px-6 sm:px-8 lg:px-12 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
              Support
            </h1>
            <p className="text-base text-muted-foreground">
              Comprehensive insights and analytics for your contract portfolio
            </p>
          </div>
          <Button onClick={() => setNewTicketOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 self-start">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex items-center gap-6">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              const tabCount = tab.key === "sla"
                ? slaRows.length
                : tab.key === "notification"
                  ? unreadNotifications
                  : tab.count;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative flex items-center gap-2 pb-3 pt-1 text-sm font-medium transition-colors -mb-px border-b-2",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {tabCount != null && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-medium text-muted-foreground">
                      {tabCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "tickets" && (
          <>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
              <span>Dashboard</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span>Support</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">Tickets</span>
            </nav>

            {/* Sub-header */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Support Tickets
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {ticketsError ? (
                    ticketsError
                  ) : loadingTickets ? (
                    "Loading tickets..."
                  ) : (
                    <>
                      <span className="font-medium text-foreground">
                        {filtered.length}
                      </span>{" "}
                      Tickets
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-9 border-border"
                  onClick={loadTickets}
                  disabled={loadingTickets}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" className="h-9 border-border" onClick={exportTickets} disabled={loadingTickets}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <Input
                  placeholder="Search Tickets"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 border-border rounded-lg lg:col-span-2"
                />
                <FilterSelect
                  value={status}
                  onChange={setStatus}
                  placeholder="All Statuses"
                  options={["Open", "In Progress", "Resolved", "Closed"]}
                />
                <FilterSelect
                  value={severity}
                  onChange={setSeverity}
                  placeholder="All Severity"
                  options={["Critical", "High", "Medium", "Low"]}
                />
                <FilterSelect
                  value={priority}
                  onChange={setPriority}
                  placeholder="All Priority"
                  options={["Critical", "High", "Medium", "Low"]}
                />
                <FilterSelect
                  value={ticketType}
                  onChange={setTicketType}
                  placeholder="All Ticket Type"
                  options={["Bug", "Incident", "Request"]}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <FilterSelect
                  value={organization}
                  onChange={setOrganization}
                  placeholder="All Organization"
                  options={organizations.map((organizationItem) => organizationItem.name)}
                />
                <Select value={developer} onValueChange={setDeveloper}>
                  <SelectTrigger className="h-10 border-border rounded-lg">
                    <SelectValue placeholder="Assigned Developers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Assigned Developers</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {developers.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="h-10 justify-start border-border text-muted-foreground font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Date Created
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border text-left">
                      {[
                        "Ticket ID",
                        "Subject",
                        "Priority",
                        "Category",
                        "Status",
                        "Assigned To",
                        "SLA",
                        "Customer",
                        "Created",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-4 py-16 text-center text-muted-foreground"
                        >
                          No tickets match your filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTicket(t)}
                          className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button onClick={(event) => { event.stopPropagation(); setSelectedTicket(t); }} className="font-medium text-primary hover:underline">
                              {t.id}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-foreground max-w-[240px]">
                            <span className="block truncate">{t.subject}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Pill className={priorityStyles[t.priority]}>
                              {t.priority}
                            </Pill>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {t.type || t.category || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Pill className={statusStyles[t.status]}>
                              {t.status}
                            </Pill>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getTicketAssignees(t).length ? (
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                                  <User className="h-3.5 w-3.5 text-primary" />
                                </span>
                                <span className="text-foreground">
                                  {getTicketAssignees(t).join(", ")}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                </span>
                                <span className="italic text-muted-foreground">
                                  Unassigned
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Pill className={slaStyles[t.sla.state]}>
                              {t.sla.state === "breached" ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {t.sla.label}
                            </Pill>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[180px]">
                            <span className="block truncate">{t.customer}</span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {formatTicketDate(t.created)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedTicket(t);
                              }}
                              aria-label={`View ticket ${t.id}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "sla" && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {slaStats.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="p-5 rounded-xl border border-border bg-card hover:border-slate-300 dark:hover:border-border transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        {s.label}
                      </p>
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          statTints[s.tint]
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="text-3xl font-semibold text-foreground mb-4">
                      {s.value}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {s.trend}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Search + status */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <Input
                placeholder="Search tickets"
                value={slaSearch}
                onChange={(e) => setSlaSearch(e.target.value)}
                className="h-10 border-border rounded-lg flex-1"
              />
              <Select value={slaStatus} onValueChange={setSlaStatus}>
                <SelectTrigger className="h-10 border-border rounded-lg w-full sm:w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Compliant">Compliant</SelectItem>
                  <SelectItem value="At Risk">At Risk</SelectItem>
                  <SelectItem value="Breached">Breached</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter chips + legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                {SLA_TABS.map((tab) => {
                  const active = slaTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setSlaTab(tab)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab}
                      {tab === "All Tickets" && (
                        <span
                          className={cn(
                            "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]",
                            active
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-background text-muted-foreground"
                          )}
                        >
                          {slaRows.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {SEVERITY_LEGEND.map((l) => (
                  <span
                    key={l.label}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className={cn("h-2 w-2 rounded-full", l.dot)} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            {/* SLA table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border text-left">
                      {[
                        "Ref ID",
                        "Title",
                        "Severity",
                        "Assignee",
                        "Time Target",
                        "Progress",
                        "Remaining",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slaFiltered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-16 text-center text-muted-foreground"
                        >
                          No records match your filters.
                        </td>
                      </tr>
                    ) : (
                      slaFiltered.map((r) => (
                        <tr
                          key={r.ref}
                          className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(r.ticket)}
                              className="font-medium text-primary hover:underline"
                            >
                              {r.ref}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-foreground max-w-[260px]">
                            <span className="block truncate">{r.title}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Pill className={severityMeta[r.severity].pill}>
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  severityMeta[r.severity].dot
                                )}
                              />
                              {r.severity}
                            </Pill>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {r.assignee ? (
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                                  <User className="h-3.5 w-3.5 text-primary" />
                                </span>
                                <span className="text-foreground">
                                  {r.assignee}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {r.target}
                          </td>
                          <td className="px-4 py-3 w-40">
                            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  progressBarColor[r.status]
                                )}
                                style={{ width: `${r.progress}%` }}
                              />
                            </div>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {r.progress}%
                            </span>
                          </td>
                          <td
                            className={cn(
                              "px-4 py-3 whitespace-nowrap font-semibold tabular-nums",
                              remainingTextColor[r.status]
                            )}
                          >
                            {r.remaining}
                          </td>
                          <td className="px-4 py-3">
                            <Pill className={slaStatusStyles[r.status]}>
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  progressBarColor[r.status]
                                )}
                              />
                              {r.status}
                            </Pill>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "notification" && (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_14rem]">
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  Notifications
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-50 px-1.5 text-xs font-semibold text-cyan-600">
                    {visibleNotifications.length}
                  </span>
                </h2>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => setNotificationFilter("all")}
                    className={cn(
                      "rounded-xl px-4 py-2.5 transition-colors",
                      notificationFilter === "all"
                        ? "bg-cyan-500 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationFilter("unread")}
                    className={cn(
                      "rounded-xl px-3 py-2.5 transition-colors",
                      notificationFilter === "unread"
                        ? "bg-cyan-500 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    Unread
                  </button>
                </div>
              </div>

              <div>
                {notificationsError && (
                  <p className="border-b border-border px-6 py-3 text-sm text-destructive">
                    {notificationsError}
                  </p>
                )}
                {visibleNotifications.length === 0 ? (
                  <p className="px-6 py-16 text-center text-sm text-muted-foreground">
                    No notifications match the selected preferences and view.
                  </p>
                ) : (
                  visibleNotifications.map((notification) => {
                    const Icon = notification.icon;
                    return (
                      <article
                        key={notification.id}
                        className={cn(
                          "flex gap-3 border-b border-border px-5 py-4 last:border-0 sm:px-6",
                          notification.unread && "bg-slate-50/50 dark:bg-slate-900/20"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            notification.iconClass
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {notification.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
                            <span
                              className={cn(
                                "rounded px-2 py-1",
                                notification.category === "SLA Alert"
                                  ? "bg-red-50 text-red-600"
                                  : notification.category === "Status Change"
                                    ? "bg-violet-50 text-violet-600"
                                    : notification.category === "Comment"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : notification.category === "System"
                                        ? "bg-slate-100 text-slate-600"
                                        : "bg-sky-50 text-sky-600"
                              )}
                            >
                              {notification.category}
                            </span>
                            <span
                              className={cn(
                                "rounded px-2 py-1",
                                notification.delivery === "failed"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-emerald-50 text-emerald-700"
                              )}
                            >
                              {notification.delivery}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-start gap-2 text-muted-foreground">
                          <time className="mr-2 pt-1 text-xs whitespace-nowrap">
                            {notification.time}
                          </time>
                          {notification.unread && (
                            <button
                              type="button"
                              onClick={() => markNotificationRead(notification.id)}
                              aria-label={`Mark ${notification.title} as read`}
                              className="rounded p-1 hover:bg-secondary hover:text-primary"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeNotification(notification.id)}
                            aria-label={`Delete ${notification.title} notification`}
                            className="rounded p-1 hover:bg-secondary hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-base font-semibold text-foreground">Preferences</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Choose the notification types to show.
                </p>
                <div className="mt-3 divide-y divide-border">
                  {Object.entries(notificationPreferences).map(([label, enabled]) => (
                    <div key={label} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`${enabled ? "Disable" : "Enable"} ${label} notifications`}
                        onClick={() =>
                          setNotificationPreferences((current) => ({
                            ...current,
                            [label]: !current[label],
                          }))
                        }
                        className={cn(
                          "relative h-5 w-9 overflow-hidden rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                          enabled ? "bg-cyan-500" : "bg-slate-200 dark:bg-slate-700"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left]",
                            enabled ? "left-4" : "left-0.5"
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-base font-semibold text-foreground">Current view</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Showing</dt>
                    <dd className="font-semibold text-foreground">{visibleNotifications.length}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Unread</dt>
                    <dd className="font-semibold text-foreground">{unreadNotifications}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Delivered</dt>
                    <dd className="font-semibold text-emerald-600">{deliveredNotifications}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Failed</dt>
                    <dd className="font-semibold text-red-600">{failedNotifications}</dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        )}
      </div>
      {selectedTicket && (
        <TicketDetailDrawer
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onTicketUpdated={(updatedTicket) => {
            setTickets((currentTickets) =>
              currentTickets.map((ticket) =>
                ticket.id === updatedTicket?.id ? updatedTicket : ticket,
              ),
            );
            setSelectedTicket(updatedTicket);
          }}
        />
      )}
      {newTicketOpen && <NewTicketDrawer canSetSlaTarget={["admin", "super_admin", "support_lead"].includes(user?.role)} organizations={organizations} onClose={() => setNewTicketOpen(false)} onCreate={createTicket} />}
    </DashboardLayout>
  );
};

const FilterSelect = ({ value, onChange, placeholder, options }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-10 border-border rounded-lg">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">{placeholder}</SelectItem>
      {options.map((o) => (
        <SelectItem key={o} value={o}>
          {o}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default Support;
