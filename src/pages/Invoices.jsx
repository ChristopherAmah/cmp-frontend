import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { invoiceServiceV3 } from "../services/invoiceServiceV3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvoiceStatusBadge } from "../components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
  Calendar,
  Coins,
  Filter,
  Plus,
  Eye,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "../services/currencyService";
import { formatDate } from "../lib/utils";

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (search) {
        params.search = search;
      }
      const response = await invoiceServiceV3.getAll(params);
      if (response?.status === "success") {
        setInvoices(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const getStatusColor = (status) => {
    const statusColors = {
      draft: "bg-secondary text-foreground border-border dark:bg-card dark:text-muted-foreground",
      issued: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
      partially_paid: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
      paid: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
      overdue: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
      voided: "bg-secondary text-foreground border-border dark:bg-card dark:text-muted-foreground",
    };
    return statusColors[status] || statusColors.draft;
  };

  const getStatusLabel = (status) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-[#00B4D8]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="">
        <div className=" px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground dark:text-foreground">
                  Invoices
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground dark:text-muted-foreground mt-1">
                  Manage and track all invoices
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by invoice number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6 border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoices Table */}
          {invoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                  No invoices found
                </h3>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by creating an invoice from a contract"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Contract</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => {
                        const status = invoice.computed?.status || invoice.status;
                        const totalPaid = invoice.computed?.totalPaid || 0;
                        const totalAmount = invoice.totalAmount || 0;

                        return (
                          <TableRow
                            key={invoice._id}
                            className="cursor-pointer hover:bg-background dark:hover:bg-card"
                            onClick={() => navigate(`/invoices/${invoice._id}`)}
                          >
                            <TableCell className="font-medium">
                              {invoice.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              {invoice.contract?.title || invoice.contract || "N/A"}
                            </TableCell>
                            <TableCell>
                              {invoice.issueDate
                                ? formatDate(invoice.issueDate)
                                : "Not issued"}
                            </TableCell>
                            <TableCell>
                              {formatDate(invoice.dueDate)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(totalAmount, invoice.currency)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(totalPaid, invoice.currency)}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const daysOverdue =
                                  status === "overdue" && invoice.dueDate
                                    ? Math.max(
                                        0,
                                        Math.floor(
                                          (new Date() - new Date(invoice.dueDate)) /
                                            (1000 * 60 * 60 * 24)
                                        )
                                      )
                                    : null;
                                const paymentProgress =
                                  totalAmount > 0 ? ((totalPaid / totalAmount) * 100) : null;

                                return (
                                  <InvoiceStatusBadge
                                    status={status}
                                    className={getStatusColor(status)}
                                    daysOverdue={daysOverdue}
                                    paymentProgress={paymentProgress}
                                  />
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/invoices/${invoice._id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
