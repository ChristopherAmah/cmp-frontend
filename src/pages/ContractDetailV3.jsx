import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { contractServiceV3 } from "../services/contractServiceV3";
import { invoiceServiceV3 } from "../services/invoiceServiceV3";
import { documentService } from "../services/documentService";
import { usePermissions } from "../hooks/usePermissions";
import CreateInvoiceWizard from "../components/CreateInvoiceWizard";
import EditInvoiceWizard from "../components/EditInvoiceWizard";
import EditContractWizard from "../components/EditContractWizard";
import UploadDocumentModal from "../components/UploadDocumentModal";
import PdfViewer from "../components/PdfViewer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContractStatusBadge, InvoiceStatusBadge } from "../components/StatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit as EditIcon,
  Building2,
  Calendar,
  Coins,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Users,
  Mail,
  Phone,
  Receipt,
  Eye,
  Plus,
  Upload,
  Download,
  Paperclip,
  Pencil,
  X,
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { SkeletonCard } from "../components/ui/skeleton";
import EmptyState from "../components/EmptyState";
import { formatCurrency } from "../services/currencyService";
import { formatDate } from "../lib/utils";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS = {
  draft: "bg-secondary text-foreground border-border dark:bg-card dark:text-muted-foreground dark:border-border",
  pending_signature:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  expired:
    "bg-secondary text-foreground border-border dark:bg-card dark:text-muted-foreground dark:border-border",
  terminated:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  renewed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  cancelled:
    "bg-secondary text-foreground border-border dark:bg-card dark:text-muted-foreground dark:border-border",
};

const ContractDetailV3 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canUpdateContracts, canCreatePayments } = usePermissions();
  const [contract, setContract] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false);
  const [showEditContractModal, setShowEditContractModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");

  useEffect(() => {
    // Safety check: if id is "new", this route shouldn't be matched, but handle it gracefully
    if (id === "new" || id === "dashboard") {
      setLoading(false);
      return;
    }

    if (id) {
      fetchContract();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const [contractResponse, invoicesResponse, documentsResponse] = await Promise.all([
        contractServiceV3.getById(id),
        invoiceServiceV3.getAll({ contractId: id }),
        documentService.getAll({ contractId: id }).catch(() => ({ data: [] })),
      ]);

      if (contractResponse?.status === "success") {
        setContract(contractResponse.data);
      }
      if (invoicesResponse?.status === "success") {
        setInvoices(invoicesResponse.data || []);
      }
      if (documentsResponse?.status === "success" || documentsResponse?.data) {
        setDocuments(documentsResponse.data || []);
      }
    } catch (err) {
      console.error("Error fetching contract:", err);
      setError("Failed to load contract details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setChangingStatus(true);
      const response = await contractServiceV3.updateStatus(id, newStatus);
      if (response?.status === "success") {
        await fetchContract();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change status");
    } finally {
      setChangingStatus(false);
    }
  };

  const getDaysUntilExpiration = () => {
    if (!contract?.timeline?.expirationDate) return null;
    const diff = new Date(contract.timeline.expirationDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

  if (error && !contract) {
    return (
      <DashboardLayout>
        <div className=" flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate("/contracts")}>
                Back to Contracts
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) return null;

  const daysUntilExpiration = getDaysUntilExpiration();
  const isExpiringSoon =
    daysUntilExpiration !== null && daysUntilExpiration <= 30 && daysUntilExpiration > 0;

  // Calculate financial summary
  const totalContractValue = contract.pricing?.baseAmount || 0;
  const currency = contract.pricing?.currency || "USD";
  const totalPaid = invoices.reduce((sum, invoice) => {
    return sum + (invoice.computed?.totalPaid || 0);
  }, 0);
  const outstandingBalance = Math.max(0, totalContractValue - totalPaid);
  
  // Calculate remaining invoiceable amount
  const totalInvoiced = invoices.reduce((sum, invoice) => {
    return sum + (invoice.totalAmount || 0);
  }, 0);
  const remainingInvoiceable = Math.max(0, totalContractValue - totalInvoiced);

  return (
    <DashboardLayout>
      <CreateInvoiceWizard
        isOpen={showCreateInvoiceModal}
        onClose={() => setShowCreateInvoiceModal(false)}
        contractId={id}
        contract={contract}
        existingInvoices={invoices}
        onSuccess={() => {
          setShowCreateInvoiceModal(false);
          fetchContract();
        }}
      />
      <EditInvoiceWizard
        isOpen={showEditInvoiceModal}
        onClose={() => {
          setShowEditInvoiceModal(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        contract={contract}
        existingInvoices={invoices}
        onSuccess={() => {
          setShowEditInvoiceModal(false);
          setSelectedInvoice(null);
          fetchContract();
        }}
      />
      <EditContractWizard
        isOpen={showEditContractModal}
        onClose={() => setShowEditContractModal(false)}
        contract={contract}
        onSuccess={() => {
          setShowEditContractModal(false);
          fetchContract();
        }}
      />
      <UploadDocumentModal
        isOpen={showUploadDocumentModal}
        onClose={() => setShowUploadDocumentModal(false)}
        organizationId={contract?.parties?.[0]?.organizationId?._id || contract?.parties?.[0]?.organizationId}
        contractId={id}
        onSuccess={() => {
          setShowUploadDocumentModal(false);
          fetchContract();
        }}
      />
      
      {/* PDF Viewer Modal */}
      {showPdfViewer && pdfUrl && (
        <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
          <DialogContent className="max-w-7xl max-h-[95vh] p-0 overflow-hidden [&>button]:hidden">
            <DialogHeader className="px-6 py-4 border-b border-border bg-background">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-lg font-semibold">
                    {pdfFileName || "PDF Viewer"}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    PDF document viewer
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPdfViewer(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="h-[calc(95vh-80px)]">
              <PdfViewer
                pdfUrl={pdfUrl}
                fileName={pdfFileName}
                onClose={() => setShowPdfViewer(false)}
                showCloseButton={false}
                height="100%"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="">
        <div className=" px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { label: "Contracts", href: "/contracts" },
              { label: contract?.title || "Contract" },
            ]}
          />

          {/* Header */}
          <div className="mb-8">

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-foreground break-words">
                    {contract.title}
                  </h1>
                  <ContractStatusBadge
                    status={contract.status}
                    className={STATUS_COLORS[contract.status] || STATUS_COLORS.draft}
                  />
                  {contract.priority && contract.priority !== "normal" && (
                    <Badge variant="outline" className="text-xs">
                      {contract.priority.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground dark:text-muted-foreground mb-2">
                  {contract.contractNumber}
                </p>
                {contract.description && (
                  <p className="text-sm sm:text-base text-foreground break-words">
                    {contract.description}
                  </p>
                )}
                {contract.status === "pending_signature" && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
                        Signature Progress
                      </span>
                      <span className="text-xs text-amber-700 dark:text-amber-300">
                        {contract.signedBy?.length || 0} of {contract.parties?.length || 0} parties
                      </span>
                    </div>
                    <div className="w-full bg-amber-100 dark:bg-amber-900/40 rounded-full h-2">
                      <div
                        className="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            ((contract.signedBy?.length || 0) /
                              Math.max(1, contract.parties?.length || 1)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                      Awaiting signatures from all parties. Invoicing will be available once all parties have signed.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {contract.allowedTransitions?.length > 0 && (
                  <Select
                    value={contract.status}
                    onValueChange={handleStatusChange}
                    disabled={changingStatus}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contract.allowedTransitions.map((status) => (
                        <SelectItem key={status} value={status}>
                          Change to {status
                            .split("_")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {contract.canEdit && canUpdateContracts && (
                  <Button
                    variant="outline"
                    onClick={() => setShowEditContractModal(true)}
                    className="w-full sm:w-auto"
                  >
                    <EditIcon className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {isExpiringSoon && (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      This contract expires in {daysUntilExpiration} days
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-full sm:w-auto min-w-max sm:min-w-0">
                <TabsTrigger value="overview" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="parties" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
                  Parties
                </TabsTrigger>
                <TabsTrigger value="financials" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
                  Financials
                </TabsTrigger>
                <TabsTrigger value="invoices" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
                  Invoices ({invoices.length})
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
                  Documents ({documents.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              {/* Financial Summary */}
              {totalContractValue > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Total Contract Value
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {formatCurrency(totalContractValue, currency)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        Amount Paid
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {formatCurrency(totalPaid, currency)}
                      </p>
                      {totalContractValue > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {((totalPaid / totalContractValue) * 100).toFixed(1)}% paid
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className={`${outstandingBalance > 0 ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10' : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'}`}>
                    <CardHeader>
                      <CardTitle className={`text-sm font-medium flex items-center gap-2 ${outstandingBalance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        <TrendingUp className="h-4 w-4" />
                        Outstanding Balance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${outstandingBalance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        {formatCurrency(outstandingBalance, currency)}
                      </p>
                      {outstandingBalance === 0 && totalContractValue > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Fully paid
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold capitalize">
                      {contract.category}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[contract.status] || STATUS_COLORS.draft}
                    >
                      {contract.status
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold capitalize">
                      {contract.priority}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {contract.tags && contract.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {contract.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contract Timeline - Moved from Timeline tab */}
              {contract.timeline && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Contract Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contract.timeline.effectiveDate && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Effective Date
                          </p>
                          <p className="font-medium">
                            {formatDate(contract.timeline.effectiveDate)}
                          </p>
                        </div>
                      </div>
                    )}

                    {contract.timeline.expirationDate && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Expiration Date
                          </p>
                          <p className="font-medium">
                            {formatDate(contract.timeline.expirationDate)}
                            {daysUntilExpiration !== null && (
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({daysUntilExpiration > 0 ? `${daysUntilExpiration} days remaining` : "Expired"})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {contract.timeline.signedDate && (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <div>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Signed Date
                          </p>
                          <p className="font-medium">
                            {formatDate(contract.timeline.signedDate)}
                          </p>
                        </div>
                      </div>
                    )}

                    {contract.timeline.terminationDate && (
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-400" />
                        <div>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Termination Date
                          </p>
                          <p className="font-medium">
                            {formatDate(contract.timeline.terminationDate)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="parties" className="space-y-6">
              {contract.parties && contract.parties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contract.parties.map((party, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium capitalize">
                          {party.role}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">
                            Organization
                          </p>
                          <p className="font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {party.organizationId?.name || "N/A"}
                          </p>
                        </div>

                        {party.primaryContact && (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                              Primary Contact
                            </p>
                            {party.primaryContact.name && (
                              <p className="font-medium">{party.primaryContact.name}</p>
                            )}
                            {party.primaryContact.title && (
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                {party.primaryContact.title}
                              </p>
                            )}
                            {party.primaryContact.email && (
                              <p className="text-sm flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {party.primaryContact.email}
                              </p>
                            )}
                            {party.primaryContact.phone && (
                              <p className="text-sm flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {party.primaryContact.phone}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground dark:text-muted-foreground">
                      No parties assigned
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="financials" className="space-y-6">
              {contract.pricing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Pricing Model</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold capitalize mb-4">
                        {contract.pricing.model}
                      </p>
                      {contract.pricing.baseAmount > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">
                            Base Amount
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(
                              contract.pricing.baseAmount,
                              contract.pricing.currency
                            )}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Billing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">
                          Billing Cycle
                        </p>
                        <p className="font-medium capitalize">
                          {contract.pricing.billingCycle?.replace("-", " ")}
                        </p>
                      </div>
                      {contract.pricing.paymentTerms && (
                        <div>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">
                            Payment Terms
                          </p>
                          <p className="font-medium">
                            Net {contract.pricing.paymentTerms.netDays} days
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold">Invoices</h3>
                {contract && canCreatePayments && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="w-full sm:w-auto">
                          <Button
                            onClick={() => setShowCreateInvoiceModal(true)}
                            className="bg-[#00B4D8] hover:bg-[#0091B3] w-full sm:w-auto"
                            disabled={contract.status !== "active" || remainingInvoiceable <= 0}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Invoice
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {contract.status !== "active" && (
                        <TooltipContent>
                          <p>Contract must be active before invoices can be created.</p>
                        </TooltipContent>
                      )}
                      {contract.status === "active" && remainingInvoiceable <= 0 && (
                        <TooltipContent>
                          <p>All contract value has been invoiced.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {invoices.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground dark:text-muted-foreground mb-2">
                      {contract.status === "active"
                        ? "No invoices created yet. Activate the contract to start billing."
                        : contract.status === "pending_signature"
                        ? "This contract is awaiting signatures. Invoicing will be available once all parties have signed."
                        : "No invoices yet"}
                    </p>
                    {contract.status !== "active" && (
                      <p className="text-xs text-muted-foreground/70 dark:text-muted-foreground/70 mt-2">
                        Contract status: {contract.status.replace("_", " ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => {
                    const invoiceStatus = invoice.computed?.status || invoice.status;
                    const statusColor =
                      invoiceStatus === "paid"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : invoiceStatus === "overdue"
                        ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                        : invoiceStatus === "partially_paid"
                        ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-secondary text-foreground border-border dark:bg-card dark:text-muted-foreground";

                    // Calculate days overdue
                    const daysOverdue =
                      invoiceStatus === "overdue" && invoice.dueDate
                        ? Math.max(
                            0,
                            Math.floor(
                              (new Date() - new Date(invoice.dueDate)) /
                                (1000 * 60 * 60 * 24)
                            )
                          )
                        : null;

                    // Calculate payment progress
                    const paymentProgress =
                      invoice.totalAmount > 0
                        ? ((invoice.computed?.totalPaid || 0) /
                            invoice.totalAmount) *
                          100
                        : null;

                    return (
                      <Card
                        key={invoice._id}
                        className="cursor-pointer hover:border-[#00B4D8] transition-colors"
                        onClick={() => navigate(`/invoices/${invoice._id}`)}
                      >
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                <h3 className="font-semibold text-base sm:text-lg break-words">
                                  {invoice.invoiceNumber}
                                </h3>
                                <InvoiceStatusBadge
                                  status={invoiceStatus}
                                  className={statusColor}
                                  daysOverdue={daysOverdue}
                                  paymentProgress={paymentProgress}
                                />
                                {daysOverdue !== null && daysOverdue > 0 && (
                                  <span className="text-xs text-destructive font-medium">
                                    {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mb-2">
                                <span>
                                  Due: {formatDate(invoice.dueDate)}
                                </span>
                                <span>
                                  Total: {formatCurrency(
                                    invoice.totalAmount,
                                    invoice.currency
                                  )}
                                </span>
                                {invoice.computed?.totalPaid > 0 && (
                                  <span>
                                    Paid: {formatCurrency(
                                      invoice.computed.totalPaid,
                                      invoice.currency
                                    )}
                                  </span>
                                )}
                                {invoice.computed?.remainingBalance > 0 && (
                                  <span>
                                    Remaining: {formatCurrency(
                                      invoice.computed.remainingBalance,
                                      invoice.currency
                                    )}
                                  </span>
                                )}
                              </div>
                              {paymentProgress !== null && paymentProgress > 0 && paymentProgress < 100 && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                    <span>Payment Progress</span>
                                    <span>{paymentProgress.toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full transition-all"
                                      style={{ width: `${paymentProgress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {invoice.status === "draft" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedInvoice(invoice);
                                            setShowEditInvoiceModal(true);
                                          }}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit invoice</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {invoice.status !== "draft" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled
                                          className="opacity-50"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Only draft invoices can be edited.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/invoices/${invoice._id}`);
                                }}
                                title="View invoice"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Documents Tab - Uploaded Contract Documents */}
            <TabsContent value="documents" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Contract Documents</h3>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Uploaded documents related to this contract
                  </p>
                </div>
                <Button
                  onClick={() => setShowUploadDocumentModal(true)}
                  className="bg-[#00B4D8] hover:bg-[#0091B3] w-full sm:w-auto"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>

              {documents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Paperclip className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground dark:text-muted-foreground">
                      No documents uploaded for this contract
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <Card key={doc._id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 bg-secondary dark:bg-card rounded-lg flex-shrink-0">
                              <FileText className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-foreground dark:text-foreground break-words">
                                {doc.documentName}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {doc.documentType}
                                </Badge>
                                <span>•</span>
                                <span>{formatDate(doc.createdAt)}</span>
                                {doc.fileSize && (
                                  <>
                                    <span>•</span>
                                    <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const blob = await documentService.preview(doc._id);
                                  if (!blob || blob.size === 0) {
                                    throw new Error("Received empty PDF file");
                                  }
                                  const url = window.URL.createObjectURL(blob);
                                  setPdfUrl(url);
                                  setPdfFileName(doc.documentName || "document.pdf");
                                  setShowPdfViewer(true);
                                } catch (error) {
                                  console.error("Error previewing document:", error);
                                  toast({
                                    variant: "destructive",
                                    title: "Failed to Preview Document",
                                    description: error.message || "Please try again.",
                                  });
                                }
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  // Fetch the file as a blob to ensure proper download
                                  const response = await fetch(doc.cloudinaryUrl, {
                                    method: "GET",
                                    mode: "cors",
                                    credentials: "omit",
                                  });

                                  if (!response.ok) {
                                    throw new Error(`Failed to fetch file: ${response.status}`);
                                  }

                                  const blob = await response.blob();
                                  const blobUrl = URL.createObjectURL(blob);

                                  const link = document.createElement("a");
                                  link.href = blobUrl;
                                  link.download = doc.documentName || "document.pdf";
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);

                                  // Clean up blob URL after download starts
                                  setTimeout(() => {
                                    URL.revokeObjectURL(blobUrl);
                                  }, 100);
                                } catch (error) {
                                  console.error("Error downloading document:", error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to download document. Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContractDetailV3;