import { createElement, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService } from "../services/dashboardService";
import { contractServiceV3 } from "../services/contractServiceV3";
import { ticketService } from "../services/ticketService";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  FileText,
  Clock,
  ArrowRight,
  Plus,
  Loader2,
  File,
  User,
  Coins,
  CalendarClock,
  Headphones,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";
import { formatCurrency } from "../services/currencyService";
import { ContractStatusBadge } from "../components/StatusBadge";

const SLA_TARGET_HOURS = { Critical: 4, High: 8, Medium: 24, Low: 72 };

const getSlaStatus = (ticket, now = Date.now()) => {
  const targetHours = SLA_TARGET_HOURS[ticket.priority] || SLA_TARGET_HOURS.Low;
  const targetMs = targetHours * 3_600_000;
  const createdAt = new Date(ticket.createdAt || ticket.created);
  const elapsedMs = Number.isNaN(createdAt.getTime())
    ? 0
    : Math.max(0, now - createdAt.getTime());
  const isResolved = ["Resolved", "Closed"].includes(ticket.status);

  return isResolved
    ? "Resolved"
    : elapsedMs >= targetMs
      ? "Breached"
      : elapsedMs >= targetMs * 0.75
        ? "At Risk"
        : "Compliant";
};

const Dashboard = () => {
  const { user } = useAuth();
  const {
    canCreateContracts,
    canCreateOrganizations,
    canUploadDocuments,
    canCreatePayments,
  } = usePermissions();
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalDocuments: 0,
    recentUploads: 0,
    expired: 0,
    expiringSoon: 0,
    recentDocuments: [],
    documentDistribution: [],
    expiringSoonList: [],
    expiredList: [],
  });
  const [recentContracts, setRecentContracts] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [user?.role]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsResponse, ticketsResponse, contractsResponse] =
        await Promise.all([
          dashboardService.getStats(),
          ticketService.getTickets(),
          contractServiceV3.getAll({
            limit: 1000,
            sortBy: "createdAt",
            sortOrder: "desc",
            isArchived: false,
          }),
        ]);

      if (statsResponse && statsResponse.status === "success") {
        setStats(statsResponse.data);
      }

      if (Array.isArray(ticketsResponse)) {
        setTickets(ticketsResponse);
      }

      if (contractsResponse && contractsResponse.status === "success") {
        const allContracts = contractsResponse.data || [];
        setContracts(allContracts);
        setRecentContracts(allContracts.slice(0, 8));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const recentDocuments = stats.recentDocuments || [];
  const expiringSoonList = stats.expiringSoonList || [];
  const expiredList = stats.expiredList || [];
  const now = Date.now();
  const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

  const isExpiringSoon = (contract) => {
    const expirationDate = contract.timeline?.expirationDate;
    if (!expirationDate) return false;
    const expirationTime = new Date(expirationDate).getTime();
    return expirationTime >= now && expirationTime <= thirtyDaysFromNow;
  };

  const licenseContracts = contracts.filter(
    (contract) => contract.category === "license" && !contract.isArchived
  );
  const atsContracts = contracts.filter(
    (contract) => contract.category === "support" && !contract.isArchived
  );
  const contractsExpiringSoon = contracts.filter(
    (contract) => !contract.isArchived && isExpiringSoon(contract)
  ).length;
  const openTickets = tickets.filter(
    (ticket) => String(ticket.status || "").toLowerCase() === "open"
  ).length;
  const ticketsBreachingSla = tickets.filter(
    (ticket) => getSlaStatus(ticket) === "Breached"
  ).length;
  const atsRenewalsDue = atsContracts.filter((contract) => isExpiringSoon(contract)).length;
  const expiredDocumentsCount = stats.expired ?? 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

    {/* Header - Stripe Style */}
    <div className="mb-6 sm:mb-8 md:mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-[30px] font-bold tracking-tight text-foreground mb-2">
            Management Overview
          </h1>
          <p className="text-sm sm:text-[16px] text-muted-foreground">
            Comprehensive insights and analytics for your contract
            portfolio
          </p>
        </div>
        <Button
          onClick={() => navigate("/organizations")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 sm:h-11 px-4 Components/Button/Border Radiussm:px-6 rounded-lg font-medium transition-colors w-full sm:w-auto flex-shrink-0 text-[15px]"
        >
          <Building2 className="mr-2 h-4 w-4" />
          Manage Organizations
        </Button>
      </div>
    </div>

      <div>
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <DashboardMetricCard title="License Contracts" value={licenseContracts.length} icon={FileText} tone="cyan" />
            <DashboardMetricCard title="ATS Contracts" value={atsContracts.length} icon={Building2} tone="green" />
            <DashboardMetricCard title="Contracts Expiring Soon" value={contractsExpiringSoon} icon={FileText} tone="cyan" />
            <DashboardMetricCard title="Open Tickets" value={openTickets} icon={Clock} tone="orange" />
            <DashboardMetricCard title="Tickets Breaching ATS" value={ticketsBreachingSla} icon={FileText} tone="red" />
            <DashboardMetricCard title="ATS Renewals Due" value={atsRenewalsDue} icon={FileText} tone="cyan" />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-8 mb-8">
            {/* Quick Actions */}
            <Card className="border border-border rounded-lg bg-card lg:col-span-3">
              <CardHeader className="border-b border-border px-5 py-4">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Quick Actions
                </CardTitle>
                <p className="text-sm text-muted-foreground">High-signal items that need action</p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {canCreateContracts && (
                    <QuickActionButton
                      icon={FileText}
                      label="New Contract"
                      onClick={() => navigate("/contracts/new")}
                      color="cyan"
                    />
                  )}
                  {canCreatePayments && (
                    <QuickActionButton
                      icon={Headphones}
                      label="Create Tickets"
                      onClick={() =>
                        navigate("/support", { state: { openNewTicket: true } })
                      }
                      color="orange"
                    />
                  )}
                  {canCreateOrganizations && (
                    <QuickActionButton
                      icon={Building2}
                      label="Add Organization"
                      onClick={() => navigate("/organizations")}
                      color="green"
                    />
                  )}
                  {canUploadDocuments && (
                    <QuickActionButton
                      icon={BarChart3}
                      label="View Reports"
                      onClick={() => navigate("/audit-logs")}
                      color="purple"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="border border-border rounded-lg bg-card lg:col-span-5">
              <CardHeader className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-orange-50 p-2.5 dark:bg-orange-950/30">
                      <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Upcoming Deadlines
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => navigate("/contracts")}
                  >
                    Review <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="min-h-[165px] p-4">
                <div className="space-y-2">
                  {expiringSoonList.length > 0 ? (
                    expiringSoonList.slice(0, 4).map((item, idx) => (
                      <DeadlineItem
                        key={item._id || idx}
                        title={item.documentName || item.title}
                        subtitle={item.organization?.name || "—"}
                        date={item.expiryDate || item.endDate}
                      />
                    ))
                  ) : (
                    <div className="flex min-h-[125px] flex-col items-center justify-center text-center">
                      <CalendarClock className="mb-2 h-11 w-11 text-muted-foreground/40" />
                      <p className="text-lg font-medium text-muted-foreground/50">Upcoming Deadlines</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Risk & Renewals */}
              <Card className="border border-border rounded-xl bg-card">
                <CardHeader className="border-b border-border px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        Risk & Renewals
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        High-signal items that need action
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="h-9 text-muted-foreground hover:text-foreground"
                      onClick={() => navigate("/dashboard/documents")}
                    >
                      Review <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Expiring (30 days)
                        </p>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50">
                          {stats.expiringSoon || 0}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {expiringSoonList.length > 0 ? (
                          expiringSoonList.slice(0, 4).map((d) => (
                            <div
                              key={d._id}
                              className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-border last:border-0"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {d.documentName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {d.organization?.name || "—"}
                                </p>
                              </div>
                              <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                {d.expiryDate
                                  ? new Date(d.expiryDate).toLocaleDateString()
                                  : "—"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No expirations in the next 30 days
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Recently expired
                        </p>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50">
                          {expiredDocumentsCount}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {expiredList.length > 0 ? (
                          expiredList.slice(0, 4).map((d) => (
                            <div
                              key={d._id}
                              className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-border last:border-0"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {d.documentName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {d.organization?.name || "—"}
                                </p>
                              </div>
                              <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                {d.expiryDate
                                  ? new Date(d.expiryDate).toLocaleDateString()
                                  : "—"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No expired documents
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Uploads with Uploader Info */}
              <Card className="border border-border rounded-xl bg-card">
                <CardHeader className="border-b border-border px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        Recent Uploads
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Latest document uploads with uploader information
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/dashboard/documents")}
                      className="h-9 text-muted-foreground hover:text-foreground"
                    >
                      View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {recentDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {recentDocuments.slice(0, 8).map((doc) => (
                        <div
                          key={doc._id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background/50 dark:bg-card/30 hover:bg-secondary/50 dark:hover:bg-card/50 hover:border-[#00B4D8]/30 dark:hover:border-[#00B4D8]/40 transition-all cursor-pointer group"
                          onClick={() =>
                            navigate(
                              `/organization/${
                                doc.organization._id || doc.organization
                              }`
                            )
                          }
                        >
                          <div className="p-2 bg-card rounded-lg border border-border group-hover:border-[#00B4D8]/30 dark:group-hover:border-[#00B4D8]/40 transition-colors">
                            <FileText className="h-5 w-5 text-[#00B4D8]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground group-hover:text-[#00B4D8] transition-colors truncate">
                              {doc.documentName}
                            </h4>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1.5">
                                {doc.uploadedBy?.profilePicture ? (
                                  <img
                                    src={doc.uploadedBy.profilePicture}
                                    alt={doc.uploadedBy.name}
                                    className="w-4 h-4 rounded-full object-cover border border-border dark:border-border"
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-[#00B4D8]/20 flex items-center justify-center">
                                    <User className="h-2.5 w-2.5 text-[#00B4D8]" />
                                  </div>
                                )}
                                <span className="text-xs text-muted-foreground font-medium">
                                  {doc.uploadedBy?.name || "Unknown"}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                                •
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {doc.organization?.name || "—"}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                                •
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-card text-muted-foreground whitespace-nowrap">
                            {doc.documentType}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center rounded-xl border border-dashed border-border bg-background dark:bg-card/50">
                      <div className="mx-auto w-12 h-12 bg-secondary dark:bg-card rounded-full flex items-center justify-center mb-3">
                        <File className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
                        No recent uploads found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Recent Contracts */}
            <div className="space-y-6">
              {/* Recent Contracts */}
              <Card className="border border-border rounded-xl bg-card">
                  <CardHeader className="border-b border-border px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold text-foreground">
                            Recent Contracts
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Latest contract updates
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => navigate("/contracts")}
                      >
                        View All <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {recentContracts.length > 0 ? (
                        recentContracts.map((contract) => (
                          <ContractItem
                            key={contract._id}
                            contract={contract}
                            navigate={navigate}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-3">
                            No contracts yet
                          </p>
                          {canCreateContracts && (
                            <Button
                              size="sm"
                              onClick={() => navigate("/contracts/new")}
                              className="mt-2"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create Contract
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
            </div>
          </div>
      </div>
    </DashboardLayout>
  );
};

const DashboardMetricCard = ({ title, value, icon: Icon, tone }) => {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300",
    green: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300",
    red: "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-300",
  };

  return (
    <Card className="min-h-[180px] rounded-lg border-border bg-card shadow-sm">
      <CardContent className="flex h-full min-h-[180px] flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">{value}</p>
          </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
            {createElement(Icon, { className: "h-5 w-5" })}
          </div>
        </div>
        <div className="mt-auto flex items-center gap-1 pt-6 text-sm font-medium text-green-600 dark:text-green-400">
          <TrendingUp className="h-4 w-4" />
          <span>Live</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Action Button
const QuickActionButton = ({ icon: Icon, label, onClick, color }) => {
  const colorConfig = {
    cyan: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:bg-cyan-950/60",
    green: "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",
    purple: "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/60",
    orange: "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/60",
  };

  return (
    <button
      onClick={onClick}
      className={`flex min-h-12 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${colorConfig[color]}`}
    >
      {createElement(Icon, { className: "h-4 w-4 shrink-0" })}
      <span className="truncate">{label}</span>
    </button>
  );
};

// Deadline Item
const DeadlineItem = ({ title, subtitle, date }) => {
  const daysUntil = date ? Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isUrgent = daysUntil !== null && daysUntil <= 7;
  
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors">
      <div className={`w-1 h-10 rounded-full ${isUrgent ? "bg-red-500" : "bg-amber-500"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className={`text-xs font-medium ${isUrgent ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
          {daysUntil !== null ? (daysUntil <= 0 ? "Overdue" : `${daysUntil} days`) : "—"}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {date ? new Date(date).toLocaleDateString() : "—"}
        </p>
      </div>
    </div>
  );
};

// Contract Item Component
const ContractItem = ({ contract, navigate }) => {
  const contractValue = contract.pricing?.baseAmount || 0;
  const currency = contract.pricing?.currency || "USD";
  const organization = contract.parties?.[0]?.organizationId;
  const organizationName = organization?.name || "N/A";
  const contractTitle = contract.title || contract.contractNumber || "Untitled Contract";
  const status = contract.status || "draft";
  const createdDate = contract.createdAt ? new Date(contract.createdAt).toLocaleDateString() : "—";

  const handleClick = () => {
    navigate(`/contracts/${contract._id}`);
  };

  return (
    <div
      className="flex gap-3 items-start p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors group"
      onClick={handleClick}
    >
      <div className="mt-0.5 h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <FileText className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {contractTitle}
          </h4>
          <ContractStatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{organizationName}</span>
          </div>
          {contractValue > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Coins className="h-3 w-3" />
                <span>{formatCurrency(contractValue, currency)}</span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Created {createdDate}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
