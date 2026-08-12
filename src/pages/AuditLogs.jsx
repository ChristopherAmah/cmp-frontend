import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { auditLogService } from "../services/auditLogService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StyledDatePicker } from "@/components/ui/datepicker";
import {
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Building2,
  Coins,
  User,
  FileCheck,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate, formatDateTime, formatRelativeTime, exportToCSV, exportToJSON } from "../lib/utils";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "../hooks/usePermissions";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ACTION_ICONS = {
  CONTRACT: FileText,
  INVOICE: Coins,
  ORGANIZATION: Building2,
  USER: User,
  DOCUMENT: FileCheck,
};

const SEVERITY_COLORS = {
  low: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  high: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  critical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const STATUS_ICONS = {
  success: CheckCircle2,
  failure: XCircle,
  pending: Clock,
};

const STATUS_COLORS = {
  success: "text-green-600 dark:text-green-400",
  failure: "text-red-600 dark:text-red-400",
  pending: "text-amber-600 dark:text-amber-400",
};

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date" },
  { value: "userName", label: "User" },
  { value: "action", label: "Action" },
  { value: "severity", label: "Severity" },
  { value: "status", label: "Status" },
  { value: "resourceType", label: "Resource Type" },
];

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  developer: "Developer",
  user: "User",
};

const AuditLogs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewAuditLogs } = usePermissions();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    userRole: "",
    action: "",
    resourceType: "",
    severity: "",
    status: "",
    startDate: null,
    endDate: null,
    ipAddress: "",
    page: 1,
    limit: 50,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (canViewAuditLogs) {
      fetchLogs();
    }
  }, [filters, canViewAuditLogs]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Convert "all" values to empty strings for API
      const apiFilters = {
        ...filters,
        userRole: filters.userRole === "all" ? "" : filters.userRole,
        resourceType: filters.resourceType === "all" ? "" : filters.resourceType,
        severity: filters.severity === "all" ? "" : filters.severity,
        status: filters.status === "all" ? "" : filters.status,
        startDate: filters.startDate ? filters.startDate.toISOString().split("T")[0] : null,
        endDate: filters.endDate ? filters.endDate.toISOString().split("T")[0] : null,
      };
      const response = await auditLogService.getAll(apiFilters);
      if (response.status === "success") {
        setLogs(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch audit logs";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setLogs([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filter changes
    }));
  };

  const handleSort = (field) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "desc" ? "asc" : "desc",
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleExport = async (format) => {
    try {
      toast({
        title: "Exporting...",
        description: `Preparing ${format.toUpperCase()} export...`,
      });

      // Fetch all logs for export (with current filters but no pagination limit)
      const exportFilters = {
        ...filters,
        userRole: filters.userRole === "all" ? "" : filters.userRole,
        resourceType: filters.resourceType === "all" ? "" : filters.resourceType,
        severity: filters.severity === "all" ? "" : filters.severity,
        status: filters.status === "all" ? "" : filters.status,
        startDate: filters.startDate ? filters.startDate.toISOString().split("T")[0] : null,
        endDate: filters.endDate ? filters.endDate.toISOString().split("T")[0] : null,
        limit: 10000, // Get more records for export
        page: 1,
      };

      const response = await auditLogService.getAll(exportFilters);
      
      if (response.status === "success" && response.data) {
        // Format data for export
        const exportData = response.data.map((log) => ({
          Timestamp: formatDateTime(log.createdAt),
          User: log.userName,
          Email: log.userEmail,
          Role: log.userRole,
          Action: log.action,
          ResourceType: log.resourceType,
          ResourceName: log.resourceName || "",
          ResourceID: log.resourceId || "",
          Severity: log.severity,
          Status: log.status,
          IPAddress: log.ipAddress || "",
          ErrorMessage: log.errorMessage || "",
          Metadata: JSON.stringify(log.metadata || {}),
        }));

        const timestamp = new Date().toISOString().split("T")[0];
        if (format === "csv") {
          exportToCSV(exportData, `audit-logs-${timestamp}.csv`);
        } else {
          exportToJSON(exportData, `audit-logs-${timestamp}.json`);
        }

        toast({
          title: "Export Successful",
          description: `Audit logs exported as ${format.toUpperCase()}`,
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export audit logs",
        variant: "destructive",
      });
    }
  };

  const getResourceLink = (log) => {
    if (!log.resourceId) return null;
    
    switch (log.resourceType) {
      case "Contract":
        return `/contracts/${log.resourceId}`;
      case "Invoice":
        return `/invoices/${log.resourceId}`;
      case "Organization":
        return `/organization/${log.resourceId}`;
      case "User":
        return `/users`; // Users page, could add user detail page later
      default:
        return null;
    }
  };

  const isCriticalActivity = (log) => {
    return log.severity === "critical" || 
           log.severity === "high" || 
           log.status === "failure" ||
           (log.action && log.action.includes("DELETE"));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      userRole: "",
      action: "",
      resourceType: "",
      severity: "",
      status: "",
      startDate: null,
      endDate: null,
      ipAddress: "",
      page: 1,
      limit: 50,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.search ||
      filters.userRole ||
      filters.action ||
      filters.resourceType ||
      filters.severity ||
      filters.status ||
      filters.startDate ||
      filters.endDate ||
      filters.ipAddress
    );
  }, [filters]);

  if (!canViewAuditLogs) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You do not have permission to view audit logs.
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track all user actions and system events
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button 
              onClick={fetchLogs} 
              variant="outline" 
              disabled={loading}
              size="sm"
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => handleExport("csv")}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial"
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                onClick={() => handleExport("json")}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial"
              >
                <Download className="mr-2 h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Filters - Responsive */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Filters</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Filter audit logs by various criteria
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
                <Button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {showAdvancedFilters ? "Hide" : "Advanced"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Search</Label>
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="h-10"
                />
              </div>

              {/* User Role */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">User Role</Label>
                <Select
                  value={filters.userRole || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("userRole", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resource Type */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Resource Type</Label>
                <Select
                  value={filters.resourceType || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("resourceType", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Invoice">Invoice</SelectItem>
                    <SelectItem value="Organization">Organization</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Severity</Label>
                <Select
                  value={filters.severity || "all"}
                  onValueChange={(value) => handleFilterChange("severity", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Order</Label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value) => handleFilterChange("sortOrder", value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Start Date</Label>
                    <StyledDatePicker
                      selected={filters.startDate}
                      onChange={(date) => handleFilterChange("startDate", date)}
                      placeholder="Select start date"
                      maxDate={filters.endDate || new Date()}
                      className="w-full h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">End Date</Label>
                    <StyledDatePicker
                      selected={filters.endDate}
                      onChange={(date) => handleFilterChange("endDate", date)}
                      placeholder="Select end date"
                      minDate={filters.startDate}
                      maxDate={new Date()}
                      className="w-full h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">IP Address</Label>
                    <Input
                      placeholder="Filter by IP address"
                      value={filters.ipAddress}
                      onChange={(e) => handleFilterChange("ipAddress", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Logs Table - Responsive */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Audit Logs</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {meta ? `${meta.total} total entries` : "Loading..."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">
                            <button
                              onClick={() => handleSort("createdAt")}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              Timestamp
                              {filters.sortBy === "createdAt" && (
                                filters.sortOrder === "desc" ? (
                                  <ArrowDown className="h-3 w-3" />
                                ) : (
                                  <ArrowUp className="h-3 w-3" />
                                )
                              )}
                            </button>
                          </TableHead>
                          <TableHead className="min-w-[150px]">
                            <button
                              onClick={() => handleSort("userName")}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              User
                              {filters.sortBy === "userName" && (
                                filters.sortOrder === "desc" ? (
                                  <ArrowDown className="h-3 w-3" />
                                ) : (
                                  <ArrowUp className="h-3 w-3" />
                                )
                              )}
                            </button>
                          </TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="min-w-[180px]">
                            <button
                              onClick={() => handleSort("action")}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              Action
                              {filters.sortBy === "action" && (
                                filters.sortOrder === "desc" ? (
                                  <ArrowDown className="h-3 w-3" />
                                ) : (
                                  <ArrowUp className="h-3 w-3" />
                                )
                              )}
                            </button>
                          </TableHead>
                          <TableHead>Resource</TableHead>
                          <TableHead>
                            <button
                              onClick={() => handleSort("severity")}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              Severity
                              {filters.sortBy === "severity" && (
                                filters.sortOrder === "desc" ? (
                                  <ArrowDown className="h-3 w-3" />
                                ) : (
                                  <ArrowUp className="h-3 w-3" />
                                )
                              )}
                            </button>
                          </TableHead>
                          <TableHead>
                            <button
                              onClick={() => handleSort("status")}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              Status
                              {filters.sortBy === "status" && (
                                filters.sortOrder === "desc" ? (
                                  <ArrowDown className="h-3 w-3" />
                                ) : (
                                  <ArrowUp className="h-3 w-3" />
                                )
                              )}
                            </button>
                          </TableHead>
                          <TableHead className="min-w-[120px]">IP Address</TableHead>
                          <TableHead className="min-w-[100px]">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => {
                          const ResourceIcon =
                            ACTION_ICONS[log.resourceType?.toUpperCase()] || FileText;
                          const StatusIcon = STATUS_ICONS[log.status] || Clock;
                          const resourceLink = getResourceLink(log);
                          const isCritical = isCriticalActivity(log);

                          return (
                            <TableRow
                              key={log._id}
                              className={cn(
                                isCritical && "bg-red-50/50 dark:bg-red-950/10 border-l-4 border-l-red-500"
                              )}
                            >
                              <TableCell className="font-mono text-xs">
                                <div className="flex flex-col">
                                  <span className="font-medium">{formatRelativeTime(log.createdAt)}</span>
                                  <span className="text-muted-foreground text-[10px]">
                                    {formatDateTime(log.createdAt)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-sm">{log.userName}</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {log.userEmail}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {ROLE_LABELS[log.userRole] || log.userRole}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <ResourceIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="font-medium text-sm truncate">{log.action}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {log.resourceName ? (
                                  <div>
                                    <div className="font-medium text-sm">{log.resourceType}</div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                        {log.resourceName}
                                      </span>
                                      {resourceLink && (
                                        <a
                                          href={resourceLink}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            navigate(resourceLink);
                                          }}
                                          className="text-primary hover:underline flex-shrink-0"
                                          title="View resource"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    {log.resourceType}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    SEVERITY_COLORS[log.severity],
                                    isCritical && "ring-2 ring-red-500"
                                  )}
                                >
                                  {log.severity}
                                  {isCritical && (
                                    <AlertTriangle className="h-3 w-3 ml-1 inline" />
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <StatusIcon
                                    className={cn(
                                      "h-4 w-4 flex-shrink-0",
                                      STATUS_COLORS[log.status]
                                    )}
                                  />
                                  <span className={cn("text-sm", STATUS_COLORS[log.status])}>
                                    {log.status}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {log.ipAddress ? (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {log.ipAddress}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() => setSelectedLog(log)}
                                    >
                                      View
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Audit Log Details</DialogTitle>
                                      <DialogDescription>
                                        Complete information for this audit log entry
                                      </DialogDescription>
                                    </DialogHeader>
                                    {selectedLog && (
                                      <div className="space-y-4 text-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Timestamp</Label>
                                            <p className="font-medium text-foreground">{formatDateTime(selectedLog.createdAt)}</p>
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Status</Label>
                                            <div className="flex items-center gap-2">
                                              <StatusIcon className={cn("h-4 w-4", STATUS_COLORS[selectedLog.status])} />
                                              <span className={cn("font-medium", STATUS_COLORS[selectedLog.status])}>
                                                {selectedLog.status}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">User</Label>
                                            <p className="font-medium text-foreground">{selectedLog.userName}</p>
                                            <p className="text-xs text-muted-foreground">{selectedLog.userEmail}</p>
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Role</Label>
                                            <Badge variant="outline" className="mt-0.5">{ROLE_LABELS[selectedLog.userRole] || selectedLog.userRole}</Badge>
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Action</Label>
                                            <p className="font-medium text-foreground">{selectedLog.action}</p>
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Severity</Label>
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                "mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 text-xs",
                                                SEVERITY_COLORS[selectedLog.severity]
                                              )}
                                            >
                                              {selectedLog.severity}
                                            </Badge>
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Resource Type</Label>
                                            <p className="font-medium text-foreground">{selectedLog.resourceType}</p>
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Resource Name</Label>
                                            <p className="font-medium text-foreground">{selectedLog.resourceName || "N/A"}</p>
                                          </div>
                                          {selectedLog.ipAddress && (
                                            <div className="space-y-1.5">
                                              <Label className="text-xs text-muted-foreground">IP Address</Label>
                                              <p className="font-mono text-xs text-foreground">{selectedLog.ipAddress}</p>
                                            </div>
                                          )}
                                          {selectedLog.errorMessage && (
                                            <div className="col-span-2 space-y-1.5">
                                              <Label className="text-xs text-muted-foreground">Error Message</Label>
                                              <p className="text-destructive text-xs">{selectedLog.errorMessage}</p>
                                            </div>
                                          )}
                                          {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                            <div className="col-span-2 space-y-1.5">
                                              <Label className="text-xs text-muted-foreground">Metadata</Label>
                                              <pre className="mt-1 p-2 bg-secondary rounded text-xs overflow-x-auto">
                                                {JSON.stringify(selectedLog.metadata, null, 2)}
                                              </pre>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pagination - Responsive */}
                {meta && meta.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Page {meta.page} of {meta.totalPages} ({meta.total} total)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(meta.page - 1)}
                        disabled={meta.page <= 1}
                        className="h-9"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                          let pageNum;
                          if (meta.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (meta.page <= 3) {
                            pageNum = i + 1;
                          } else if (meta.page >= meta.totalPages - 2) {
                            pageNum = meta.totalPages - 4 + i;
                          } else {
                            pageNum = meta.page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={meta.page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="h-9 w-9 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(meta.page + 1)}
                        disabled={meta.page >= meta.totalPages}
                        className="h-9"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AuditLogs;
