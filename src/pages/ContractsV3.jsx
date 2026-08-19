import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import CreateContractWizard from "../components/CreateContractWizard";
import { contractServiceV3 } from "../services/contractServiceV3";
import { organizationService } from "../services/organizationService";
import { usePermissions } from "../hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ContractStatusBadge } from "../components/StatusBadge";
import {
  Plus,
  FileText,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  TrendingUp,
} from "lucide-react";
import { cn, formatDate } from "../lib/utils";
import { formatCurrency } from "../services/currencyService";

const STATUS_COLORS = {
  draft: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  pending_signature: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
  expired: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  terminated: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400",
  renewed: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const isAtsContract = (contract) =>
  contract.category === "support" ||
  contract.tags?.some((tag) => tag.toLowerCase().includes("ats"));

const ContractsV3 = () => {
  const navigate = useNavigate();
  const { canCreateContracts, canViewContracts } = usePermissions();
  const [contracts, setContracts] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateContractModal, setShowCreateContractModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [contractTab, setContractTab] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { limit: 100 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (organizationFilter !== "all") params.organizationId = organizationFilter;

      const [contractsResponse, organizationsResponse, metricsResponse] =
        await Promise.all([
          contractServiceV3.getAll(params),
          organizationService.getAll(),
          contractServiceV3.getMetrics(),
        ]);

      if (contractsResponse?.status === "success") {
        setContracts(contractsResponse.data || []);
      }
      if (organizationsResponse?.status === "success") {
        setOrganizations(organizationsResponse.data || []);
      }
      if (metricsResponse?.status === "success") {
        setMetrics(metricsResponse.data);
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load contracts. Please try again."
      );
      setContracts([]);
      setOrganizations([]);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, organizationFilter]);

  useEffect(() => {
    if (!canViewContracts) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [canViewContracts, fetchData]);

  const searchedContracts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contracts;

    return contracts.filter((contract) => {
      const organizationName = contract.parties?.[0]?.organizationId?.name || "";
      return [
        contract.title,
        contract.contractNumber,
        contract.description,
        organizationName,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [contracts, search]);

  const displayedContracts = useMemo(() => {
    if (contractTab === "license") {
      return searchedContracts.filter((contract) => contract.category === "license");
    }
    if (contractTab === "ats") {
      return searchedContracts.filter(isAtsContract);
    }
    return searchedContracts;
  }, [searchedContracts, contractTab]);

  const tabCounts = useMemo(
    () => ({
      all: contracts.length,
      license: contracts.filter((contract) => contract.category === "license").length,
      ats: contracts.filter(isAtsContract).length,
    }),
    [contracts]
  );

  const expiringWithinNinetyDays = useMemo(
    () =>
      contracts.filter((contract) => {
        const days = getDaysUntilExpiration(contract.timeline?.expirationDate);
        return days !== null && days > 0 && days <= 90;
      }).length,
    [contracts]
  );

  const overviewCards = [
    { label: "Total Contracts", value: metrics?.total || 0, icon: FileText, tone: "cyan" },
    { label: "Active Contracts", value: metrics?.byStatus?.active || 0, icon: CheckCircle2, tone: "green" },
    { label: "Draft Contracts", value: metrics?.byStatus?.draft || 0, icon: FileText, tone: "cyan" },
    { label: "Pending Approvals", value: metrics?.byStatus?.pending_signature || 0, icon: Clock, tone: "orange" },
    { label: "Expiring Soon (<90 Days)", value: expiringWithinNinetyDays, icon: AlertCircle, tone: "red" },
    { label: "Expired Contracts", value: metrics?.byStatus?.expired || 0, icon: FileText, tone: "cyan" },
  ];

  if (!canViewContracts) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h2 className="mb-2 text-xl font-semibold">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to view contracts.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-1">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Contracts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Comprehensive insights and analytics for your contract portfolio
            </p>
          </div>
          {canCreateContracts && (
            <Button
              onClick={() => setShowCreateContractModal(true)}
              className="h-10 bg-cyan-500 px-4 text-white hover:bg-cyan-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Contract
            </Button>
          )}
        </header>

        <nav className="mb-5 flex items-center gap-6 border-b border-border" aria-label="Contract types">
          {[
            ["all", "All"],
            ["license", "License Contracts"],
            ["ats", "ATS Contracts"],
          ].map(([key, label]) => {
            const active = contractTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setContractTab(key)}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-1 py-3 text-xs font-medium transition-colors",
                  active
                    ? "border-cyan-500 text-cyan-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                {key !== "all" && (
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {tabCounts[key]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Contract overview">
          {overviewCards.map((card) => {
            const Icon = card.icon;
            const iconClass = {
              cyan: "bg-cyan-50 text-cyan-500 dark:bg-cyan-950/30 dark:text-cyan-400",
              green: "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400",
              orange: "bg-orange-50 text-orange-500 dark:bg-orange-950/30 dark:text-orange-400",
              red: "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400",
            }[card.tone];
            return (
              <article key={card.label} className="min-h-32 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{card.value}</p>
                  </div>
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", iconClass)}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <span className="mt-8 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                  <TrendingUp className="h-3 w-3" /> Live data
                </span>
              </article>
            );
          })}
        </section>

        <section className="mb-3 flex flex-col gap-3 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search organizations"
            className="h-10 max-w-md rounded-lg border-border"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full rounded-lg border-border sm:w-44">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_signature">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="renewed">Renewed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
            <SelectTrigger className="h-10 w-full rounded-lg border-border sm:w-52">
              <SelectValue placeholder="All Organizations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map((organization) => (
                <SelectItem key={organization._id} value={organization._id}>
                  {organization.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-cyan-500" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : displayedContracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold">No contracts found</h2>
              <p className="mt-1 text-sm text-muted-foreground">No contracts match your current filters.</p>
              {canCreateContracts && (
                <Button onClick={() => setShowCreateContractModal(true)} className="mt-5 bg-cyan-500 hover:bg-cyan-600">
                  <Plus className="mr-2 h-4 w-4" /> Create Contract
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-xs">
                <thead className="border-b border-border bg-secondary/50 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {[
                      "Ref ID", "Customer", "Contract Name", "Status", "Amount", "Payment Due",
                      "End Date", "Assignee", "Last Updated", "Action",
                    ].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 font-medium">{heading}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {displayedContracts.map((contract) => {
                    const organization = contract.parties?.[0]?.organizationId;
                    const assignee = contract.updatedBy?.name || contract.createdBy?.name || "Unassigned";
                    return (
                      <tr
                        key={contract._id}
                        onClick={() => navigate(`/contracts/${contract._id}`)}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-cyan-600">{contract.contractNumber || "—"}</td>
                        <td className="max-w-44 px-4 py-3">
                          <span className="flex items-center gap-2 truncate text-foreground">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-500"><Building2 className="h-3 w-3" /></span>
                            <span className="truncate">{organization?.name || "N/A"}</span>
                          </span>
                        </td>
                        <td className="max-w-52 px-4 py-3"><p className="truncate text-foreground">{contract.title}</p><p className="mt-0.5 text-[10px] capitalize text-muted-foreground">{contract.category}</p></td>
                        <td className="px-4 py-3"><ContractStatusBadge status={contract.status} className={cn("px-1.5 py-0 text-[10px]", STATUS_COLORS[contract.status] || STATUS_COLORS.draft)} /></td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{contract.pricing?.baseAmount ? formatCurrency(contract.pricing.baseAmount, contract.pricing.currency) : "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            Number(contract.outstandingBalance) > 0
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700",
                          )}>
                            {Number(contract.outstandingBalance) > 0 ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(contract.timeline?.expirationDate)}</td>
                        <td className="max-w-32 truncate px-4 py-3 text-foreground">{assignee}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(contract.updatedAt)}</td>
                        <td className="px-4 py-3 text-center">
                          <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/contracts/${contract._id}`); }} aria-label={`View ${contract.title}`} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-cyan-600"><Eye className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
      <CreateContractWizard
        isOpen={showCreateContractModal}
        onClose={() => setShowCreateContractModal(false)}
        onSuccess={() => { setShowCreateContractModal(false); fetchData(); }}
      />
    </DashboardLayout>
  );
};

const getDaysUntilExpiration = (expirationDate) => {
  if (!expirationDate) return null;
  return Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
};

export default ContractsV3;
