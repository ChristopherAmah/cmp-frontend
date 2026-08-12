import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { invoiceServiceV3 } from "../services/invoiceServiceV3";
import { receiptServiceV3 } from "../services/receiptServiceV3";
import { documentGenerationService } from "../services/documentGenerationService";
import RecordPaymentModal from "../components/RecordPaymentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvoiceStatusBadge } from "../components/StatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  Coins,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Receipt,
  Eye,
  Download,
  X,
} from "lucide-react";
import { formatCurrency } from "../services/currencyService";
import { formatDate } from "../lib/utils";
import { useToast } from "@/hooks/use-toast";
import Breadcrumb from "../components/Breadcrumb";
import PdfViewer from "../components/PdfViewer";

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ledger, setLedger] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showReceiptPreviewModal, setShowReceiptPreviewModal] = useState(false);
  const [receiptPreviewHtml, setReceiptPreviewHtml] = useState("");
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (id) {
    fetchInvoiceData();
    }
  }, [id]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invoiceResponse, receiptsResponse] = await Promise.all([
        invoiceServiceV3.getById(id),
        receiptServiceV3.getByInvoice(id),
      ]);

      if (invoiceResponse?.status === "success") {
        setLedger(invoiceResponse.data);
      }
      if (receiptsResponse?.status === "success") {
        setReceipts(receiptsResponse.data || []);
      }
    } catch (err) {
      console.error("Error fetching invoice data:", err);
      setError("Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    try {
      setIssuing(true);
      const response = await invoiceServiceV3.issue(id);
      if (response?.status === "success") {
        toast({
          title: "Success",
          description: "Invoice issued successfully",
        });
        await fetchInvoiceData();
        // Generate PDF in background (completely silent - no errors shown)
        // Use setTimeout to ensure it runs after the UI updates
        setTimeout(() => {
          handleGeneratePdf(true).catch(() => {
            // Silently fail - don't log, show, or throw anything
          });
        }, 100);
      }
    } catch (err) {
      // Only show error if it's not a network/timeout/socket error
      const isNetworkError = 
        err.code === "ECONNABORTED" || 
        err.code === "ERR_NETWORK" ||
        err.message?.includes("timeout") || 
        err.message?.includes("socket") ||
        err.message?.includes("hang up");
      
      if (!isNetworkError && err.response?.status !== 500) {
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed to issue invoice",
          variant: "destructive",
        });
      }
      // Silently ignore network/timeout errors
    } finally {
      setIssuing(false);
    }
  };

  const handleGeneratePdf = async (silent = false) => {
    try {
      if (!silent) {
        setGeneratingPdf(true);
      }
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("PDF generation timeout")), 25000);
      });
      
      const response = await Promise.race([
        documentGenerationService.generateInvoicePdf(id, "regenerate"),
        timeoutPromise,
      ]);
      
      if (response?.status === "success" && !silent) {
        toast({
          title: "Success",
          description: "Invoice PDF generated successfully",
        });
        await fetchInvoiceData();
      } else if (response?.status === "success" && silent) {
        // Silently refresh data without showing toast
        await fetchInvoiceData();
      }
    } catch (err) {
      // In silent mode, completely ignore all errors (including timeouts)
      if (!silent) {
        // Only show non-timeout errors
        if (!err.message?.includes("timeout")) {
          toast({
            title: "Error",
            description: err.response?.data?.message || "Failed to generate PDF",
            variant: "destructive",
          });
        }
      }
      // Don't log, throw, or show anything in silent mode
    } finally {
      if (!silent) {
        setGeneratingPdf(false);
      }
    }
  };

  const handleViewPdf = async () => {
    const invoice = ledger?.invoice;
    if (invoice?.generatedPdfUrl) {
      setPdfUrl(invoice.generatedPdfUrl);
      setPdfFileName(`Invoice-${invoice.invoiceNumber}.pdf`);
      setShowPdfViewer(true);
    } else {
      // Generate first, then view
      try {
        setGeneratingPdf(true);
        const response = await documentGenerationService.generateInvoicePdf(id, "initial");
        if (response?.status === "success" && response.data?.pdfUrl) {
          setPdfUrl(response.data.pdfUrl);
          setPdfFileName(`Invoice-${invoice?.invoiceNumber || id}.pdf`);
          setShowPdfViewer(true);
          await fetchInvoiceData();
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to generate PDF",
          variant: "destructive",
        });
      } finally {
        setGeneratingPdf(false);
      }
    }
  };

  const handleDownloadPdf = async () => {
    const invoice = ledger?.invoice;
    if (invoice?.generatedPdfUrl) {
      documentGenerationService.openDocument(invoice.generatedPdfUrl);
    } else {
      // Generate first, then download
      try {
        setGeneratingPdf(true);
        const response = await documentGenerationService.generateInvoicePdf(id, "initial");
        if (response?.status === "success" && response.data?.pdfUrl) {
          documentGenerationService.openDocument(response.data.pdfUrl);
          await fetchInvoiceData();
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to generate PDF",
          variant: "destructive",
        });
      } finally {
        setGeneratingPdf(false);
      }
    }
  };

  const handlePreviewHtml = async () => {
    try {
      setLoadingPreview(true);
      const html = await documentGenerationService.getInvoiceHtml(id);
      setPreviewHtml(html);
      setShowPreviewModal(true);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to preview invoice",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
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

  const handleViewReceipt = async (receipt) => {
    // Prefer PDF URL if available
    if (receipt.generatedPdfUrl) {
      setPdfUrl(receipt.generatedPdfUrl);
      setPdfFileName(`Receipt-${receipt.receiptNumber || receipt._id}.pdf`);
      setShowPdfViewer(true);
    } else {
      // Generate PDF if it doesn't exist
      try {
        setGeneratingPdf(true);
        const response = await documentGenerationService.generateReceiptPdf(
          receipt._id,
          "initial"
        );
        if (response?.status === "success" && response.data?.pdfUrl) {
          setPdfUrl(response.data.pdfUrl);
          setPdfFileName(`Receipt-${receipt.receiptNumber || receipt._id}.pdf`);
          setShowPdfViewer(true);
          // Refresh invoice data to get updated receipt with PDF URL
          await fetchInvoiceData();
        } else {
          // Fallback to HTML if PDF generation fails
          if (receipt.generatedHtmlUrl) {
            try {
              const htmlContent = decodeURIComponent(
                receipt.generatedHtmlUrl.split(",")[1]
              );
              setReceiptPreviewHtml(htmlContent);
              setShowReceiptPreviewModal(true);
            } catch (err) {
              console.error("Error decoding receipt HTML:", err);
              toast({
                title: "Error",
                description: "Failed to load receipt preview",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Error",
              description: "Failed to generate receipt PDF",
              variant: "destructive",
            });
          }
        }
      } catch (err) {
        console.error("Error generating receipt PDF:", err);
        // Fallback to HTML if PDF generation fails
        if (receipt.generatedHtmlUrl) {
          try {
            const htmlContent = decodeURIComponent(
              receipt.generatedHtmlUrl.split(",")[1]
            );
            setReceiptPreviewHtml(htmlContent);
            setShowReceiptPreviewModal(true);
          } catch (htmlErr) {
            console.error("Error decoding receipt HTML:", htmlErr);
            toast({
              title: "Error",
              description: err.response?.data?.message || "Failed to load receipt",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Error",
            description: err.response?.data?.message || "Failed to generate receipt PDF",
            variant: "destructive",
          });
        }
      } finally {
        setGeneratingPdf(false);
      }
    }
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

  if (error && !ledger) {
    return (
      <DashboardLayout>
        <div className=" flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
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

  const invoice = ledger?.invoice || null;
  const computed = ledger?.computed || {};
  const totalPaid = computed.totalPaid || 0;
  const remainingBalance = computed.remainingBalance ?? (invoice?.totalAmount || 0);
  const status = computed.status || invoice?.status || "draft";
  const contractId =
    typeof invoice?.contract === "object"
      ? invoice?.contract?._id
      : invoice?.contract;

  return (
    <DashboardLayout>
      <RecordPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoiceId={id}
        invoiceNumber={invoice?.invoiceNumber}
        currency={invoice?.currency}
        remainingBalance={remainingBalance}
        onSuccess={() => {
          setShowPaymentModal(false);
          fetchInvoiceData();
        }}
      />

      {/* Invoice Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b border-border dark:border-border bg-background dark:bg-card">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-lg font-semibold flex-1">
                Invoice Preview - {invoice?.invoiceNumber}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    // Open in new window and trigger print (saves as PDF)
                    const printWindow = window.open("", "_blank");
                    printWindow.document.write(previewHtml);
                    printWindow.document.close();
                    setTimeout(() => {
                      printWindow.print();
                    }, 500);
                  }}
                  className="bg-[#00B4D8] hover:bg-[#0091B3]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download / Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreviewModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-80px)] bg-secondary dark:bg-card p-4">
            <iframe
              srcDoc={previewHtml}
              className="w-full min-h-[600px] bg-card rounded-lg shadow-lg border-0"
              style={{ height: "calc(90vh - 120px)" }}
              title="Invoice Preview"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Modal */}
      <Dialog open={showReceiptPreviewModal} onOpenChange={setShowReceiptPreviewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b border-border dark:border-border bg-background dark:bg-card">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-lg font-semibold flex-1">
                Receipt Preview
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    // Open in new window and trigger print (saves as PDF)
                    const printWindow = window.open("", "_blank");
                    printWindow.document.write(receiptPreviewHtml);
                    printWindow.document.close();
                    setTimeout(() => {
                      printWindow.print();
                    }, 500);
                  }}
                  className="bg-[#00B4D8] hover:bg-[#0091B3]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download / Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReceiptPreviewModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-80px)] bg-secondary dark:bg-card p-4">
            <iframe
              srcDoc={receiptPreviewHtml}
              className="w-full min-h-[600px] bg-card rounded-lg shadow-lg border-0"
              style={{ height: "calc(90vh - 120px)" }}
              title="Receipt Preview"
            />
          </div>
        </DialogContent>
      </Dialog>

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
              { label: invoice?.contract?.title || "Contract", href: contractId ? `/contracts/${contractId}` : "/contracts" },
              { label: invoice?.invoiceNumber || "Invoice" },
            ]}
          />

          {/* Header */}
          <div className="mb-8">

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground dark:text-foreground mb-2">
                  Invoice {invoice?.invoiceNumber}
                  </h1>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  {invoice?.contract?.title || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {(() => {
                  const daysOverdue =
                    status === "overdue" && invoice?.dueDate
                      ? Math.max(
                          0,
                          Math.floor(
                            (new Date() - new Date(invoice.dueDate)) /
                              (1000 * 60 * 60 * 24)
                          )
                        )
                      : null;
                  const paymentProgress =
                    invoice?.totalAmount > 0
                      ? ((totalPaid / invoice.totalAmount) * 100)
                      : null;

                  return (
                    <InvoiceStatusBadge
                      status={status}
                      className={getStatusColor(status)}
                      daysOverdue={daysOverdue}
                      paymentProgress={paymentProgress}
                    />
                  );
                })()}
                {status === "overdue" && invoice?.dueDate && (
                  <span className="text-sm text-destructive font-medium">
                    {Math.max(
                      0,
                      Math.floor(
                        (new Date() - new Date(invoice.dueDate)) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}{" "}
                    day
                    {Math.floor(
                      (new Date() - new Date(invoice.dueDate)) /
                        (1000 * 60 * 60 * 24)
                    ) !== 1
                      ? "s"
                      : ""}{" "}
                    overdue
                  </span>
                )}
                {/* Preview HTML */}
                <Button
                  variant="outline"
                  onClick={handlePreviewHtml}
                  disabled={loadingPreview}
                  title="Preview Invoice"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {loadingPreview ? "Loading..." : "Preview"}
                </Button>
                {/* View PDF */}
                {invoice?.generatedPdfUrl && (
                  <Button
                    variant="outline"
                    onClick={handleViewPdf}
                    title="View PDF"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View PDF
                  </Button>
                )}
                {/* Download PDF */}
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={generatingPdf}
                  title="Download PDF"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {generatingPdf ? "Generating..." : "Download PDF"}
                </Button>
                {invoice?.status === "draft" && (
                  <Button
                    onClick={handleIssue}
                    disabled={issuing}
                    className="bg-[#00B4D8] hover:bg-[#0091B3]"
                  >
                    {issuing ? "Issuing..." : "Issue Invoice"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground dark:text-foreground">
                  {formatCurrency(invoice?.totalAmount || 0, invoice?.currency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Total Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalPaid, invoice?.currency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(remainingBalance, invoice?.currency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const daysOverdue =
                    status === "overdue" && invoice?.dueDate
                      ? Math.max(
                          0,
                          Math.floor(
                            (new Date() - new Date(invoice.dueDate)) /
                              (1000 * 60 * 60 * 24)
                          )
                        )
                      : null;
                  const paymentProgress =
                    invoice?.totalAmount > 0
                      ? ((totalPaid / invoice.totalAmount) * 100)
                      : null;

                  return (
                    <>
                      <InvoiceStatusBadge
                        status={status}
                        className={getStatusColor(status)}
                        daysOverdue={daysOverdue}
                        paymentProgress={paymentProgress}
                      />
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
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Invoice Details</TabsTrigger>
              <TabsTrigger value="receipts">
                Receipts ({receipts.filter((r) => !r.isReversal).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Invoice Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Invoice Number
                      </p>
                      <p className="font-medium">{invoice?.invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Contract
                      </p>
                      <p className="font-medium">
                        {invoice?.contract?.title || invoice?.contract || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Issue Date
                      </p>
                      <p className="font-medium">
                        {invoice?.issueDate
                          ? formatDate(invoice.issueDate)
                          : "Not issued"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Due Date
                      </p>
                      <p className="font-medium">
                        {invoice?.dueDate ? formatDate(invoice.dueDate) : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Coins className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Currency
                      </p>
                      <p className="font-medium">{invoice?.currency}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              {invoice?.lineItems && invoice.lineItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-border dark:border-border">
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                              Description
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground text-right">
                              Qty
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground text-right">
                              Unit Price
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground text-right">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.lineItems.map((item, index) => (
                            <tr
                              key={index}
                              className="border-b border-slate-100 dark:border-border/50"
                            >
                              <td className="py-3 px-4">{item.description}</td>
                              <td className="py-3 px-4 text-right">
                                {item.quantity}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {formatCurrency(item.unitPrice, invoice.currency)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {formatCurrency(item.total, invoice.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td
                              colSpan="3"
                              className="text-right py-3 px-4 font-semibold"
                            >
                              Subtotal:
                            </td>
                            <td className="text-right py-3 px-4 font-semibold">
                              {formatCurrency(
                                invoice.subtotal || 0,
                                invoice.currency
                              )}
                            </td>
                          </tr>
                          {invoice.taxAmount > 0 && (
                            <tr>
                              <td colSpan="3" className="text-right py-3 px-4">
                                Tax ({invoice.taxRate}%):
                              </td>
                              <td className="text-right py-3 px-4">
                                {formatCurrency(
                                  invoice.taxAmount,
                                  invoice.currency
                                )}
                              </td>
                            </tr>
                          )}
                          {invoice.discount > 0 && (
                            <tr>
                              <td colSpan="3" className="text-right py-3 px-4">
                                Discount:
                              </td>
                              <td className="text-right py-3 px-4">
                                -{formatCurrency(
                                  invoice.discount,
                                  invoice.currency
                                )}
                              </td>
                            </tr>
                          )}
                          <tr className="border-t-2 font-bold">
                            <td colSpan="3" className="text-right py-3 px-4">
                              Total:
                            </td>
                            <td className="text-right py-3 px-4 text-lg">
                              {formatCurrency(
                                invoice.totalAmount,
                                invoice.currency
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {invoice?.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">
                      {invoice.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="receipts" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Payment Receipts</h2>
                {status === "draft" ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            disabled
                            className="bg-[#00B4D8] hover:bg-[#0091B3] opacity-50 cursor-not-allowed"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Record Payment
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Issue the invoice before recording payments.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : status === "voided" ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            disabled
                            className="bg-[#00B4D8] hover:bg-[#0091B3] opacity-50 cursor-not-allowed"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Record Payment
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This invoice has been voided and cannot receive payments.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : remainingBalance > 0 ? (
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-[#00B4D8] hover:bg-[#0091B3]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                ) : (
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">
                    Invoice fully paid
                  </div>
                )}
              </div>

              {receipts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground dark:text-muted-foreground">
                      {status === "draft"
                        ? "Issue the invoice first to record payments"
                        : "No receipts yet"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {receipts
                    .filter((r) => !r.isReversal)
                    .map((receipt) => (
                      <Card key={receipt._id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">
                                  {receipt.receiptNumber}
                                </h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground">
                                <span>
                                  Amount:{" "}
                                  <span className="font-semibold text-foreground dark:text-foreground">
                                    {formatCurrency(
                                      receipt.amount,
                                      receipt.currency
                                    )}
                                  </span>
                                </span>
                                <span>
                                  Date: {formatDate(receipt.paymentDate)}
                                </span>
                                <span className="capitalize">
                                  Method: {receipt.paymentMethod.replace("_", " ")}
                                </span>
                                {receipt.referenceNumber && (
                                  <span>Ref: {receipt.referenceNumber}</span>
                                )}
                              </div>
                              {receipt.payer && (
                                <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-2">
                                  Payer: {receipt.payer}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {receipt.proofUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPdfUrl(receipt.proofUrl);
                                    setPdfFileName(`Receipt-Proof-${receipt.receiptNumber || receipt._id}.pdf`);
                                    setShowPdfViewer(true);
                                  }}
                                  title="View proof file"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Proof
                                </Button>
                              )}
                              {(receipt.generatedPdfUrl || receipt.generatedHtmlUrl) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewReceipt(receipt)}
                                  disabled={generatingPdf}
                                  title="View receipt"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  {generatingPdf ? "Generating..." : "View"}
                                </Button>
                              )}
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

export default InvoiceDetail;
