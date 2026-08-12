import { useState, useEffect } from "react";
import { documentService } from "../services/documentService";
import { organizationService } from "../services/organizationService";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Search,
  Filter,
  Building2,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Eye,
  X,
} from "lucide-react";
import PdfViewer from "../components/PdfViewer";

const AllDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [serverStats, setServerStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterOrg, setFilterOrg] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsResponse, orgsResponse] = await Promise.all([
        documentService.getAll({ light: true, limit: 200, includeStats: true }),
        organizationService.getAll(),
      ]);

      if (docsResponse.status === "success") {
        setDocuments(docsResponse.data);
        setServerStats(docsResponse.stats || null);
      }
      if (orgsResponse.status === "success") {
        setOrganizations(orgsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (documentId) => {
    try {
      const blob = await documentService.preview(documentId);
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      const doc = documents.find((d) => d._id === documentId);
      setPdfFileName(doc?.documentName || `document-${documentId}.pdf`);
      setShowPdfViewer(true);
      // Note: We don't revoke the URL here as it's needed for viewing
      // It will be revoked when the viewer is closed
    } catch (error) {
      console.error("Error previewing document:", error);
      alert("Failed to preview document");
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const blob = await documentService.download(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Failed to download document");
    }
  };

  const handleCardClick = (doc) => {
    setSelectedDocument(doc);
    setIsModalOpen(true);

    if (doc?.uploadedBy) return;

    setDetailsLoading(true);
    documentService
      .getById(doc._id)
      .then((r) => {
        if (r?.status === "success") setSelectedDocument(r.data);
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setDetailsLoading(false));
  };

  const getDocumentTypeColor = (type) => {
    const colors = {
      SLA: "bg-[#00B4D8]/10 text-[#00B4D8] border-[#00B4D8]/30 dark:bg-[#00B4D8]/20 dark:text-[#00B4D8] dark:border-[#00B4D8]/40",
      SOW: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
      "Co-location":
        "bg-[#00B4D8]/10 text-[#00B4D8] border-[#00B4D8]/30 dark:bg-[#00B4D8]/20 dark:text-[#00B4D8] dark:border-[#00B4D8]/40",
      NDA: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
      Contract:
        "bg-[#00B4D8]/10 text-[#00B4D8] border-[#00B4D8]/30 dark:bg-[#00B4D8]/20 dark:text-[#00B4D8] dark:border-[#00B4D8]/40",
      Other:
        "bg-background text-foreground border-border",
    };
    return colors[type] || colors.Other;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      (doc.documentName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (doc.organization?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || doc.documentType === filterType;
    const matchesOrg =
      filterOrg === "all" ||
      doc.organization?._id === filterOrg ||
      doc.organization === filterOrg;
    return matchesSearch && matchesType && matchesOrg;
  });

  const stats = serverStats || {
    total: documents.length,
    expired: documents.filter(
      (doc) => doc.expiryDate && new Date(doc.expiryDate) < new Date()
    ).length,
    expiringSoon: documents.filter(
      (doc) =>
        doc.expiryDate &&
        new Date(doc.expiryDate) > new Date() &&
        new Date(doc.expiryDate) <
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length,
    active: documents.filter(
      (doc) => doc.expiryDate && new Date(doc.expiryDate) > new Date()
    ).length,
  };

  return (
    <DashboardLayout>
      <div className="">
        <div className=" px-6 sm:px-8 lg:px-12 py-12">
          {/* Header - Stripe Style */}
          <div className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground dark:text-foreground mb-2">
              All Documents
            </h1>
            <p className="text-base text-muted-foreground dark:text-muted-foreground">
              Access, organize, and track all contract documentation
            </p>
          </div>

          {/* Stats Cards - Stripe Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-xl border border-border dark:border-border bg-card hover:border-slate-300 dark:hover:border-border transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Total Documents
                </p>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold text-foreground dark:text-foreground">
                {stats.total}
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border dark:border-border bg-card hover:border-slate-300 dark:hover:border-border transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Active
                </p>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-semibold text-foreground dark:text-foreground">
                {stats.active}
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border dark:border-border bg-card hover:border-slate-300 dark:hover:border-border transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Expiring Soon
                </p>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-semibold text-foreground dark:text-foreground">
                {stats.expiringSoon}
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border dark:border-border bg-card hover:border-slate-300 dark:hover:border-border transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Expired
                </p>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-2xl font-semibold text-foreground dark:text-foreground">
                {stats.expired}
              </p>
            </div>
          </div>

          {/* Filters - Stripe Style */}
          <div className="mb-6 rounded-xl dark:border-border bg-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 border-border dark:border-border rounded-lg bg-card dark:bg-background focus:border-slate-400 dark:focus:border-slate-600"
              />

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-10 border-border dark:border-border rounded-lg bg-card dark:bg-background">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="SLA">SLA</SelectItem>
                  <SelectItem value="SOW">SOW</SelectItem>
                  <SelectItem value="Co-location">Co-location</SelectItem>
                  <SelectItem value="NDA">NDA</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterOrg} onValueChange={setFilterOrg}>
                <SelectTrigger className="h-10 border-border dark:border-border rounded-lg bg-card dark:bg-background">
                  <Building2 className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org._id} value={org._id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="mb-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground dark:text-foreground uppercase tracking-wider">
                Documents ({filteredDocuments.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="rounded-xl border border-border dark:border-border bg-card p-16">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-2">
                    No documents found
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {searchTerm || filterType !== "all" || filterOrg !== "all"
                      ? "Try adjusting your filters."
                      : "No documents available."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
                  const isExpired =
                    doc.expiryDate && new Date(doc.expiryDate) < new Date();
                  const isExpiringSoon =
                    doc.expiryDate &&
                    new Date(doc.expiryDate) > new Date() &&
                    new Date(doc.expiryDate) <
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                  return (
                    <div
                      key={doc._id}
                      className="group relative p-5 rounded-xl border border-border dark:border-border bg-card hover:border-slate-300 dark:hover:border-border hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => handleCardClick(doc)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-secondary dark:bg-card rounded-lg">
                          <FileText className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
                        </div>
                        {isExpired ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50">
                            Expired
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50">
                            Expiring Soon
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-1.5 line-clamp-2">
                          {doc.documentName}
                        </h3>
                        <div className="flex items-center text-xs text-muted-foreground dark:text-muted-foreground mb-2">
                          <Building2 className="h-3.5 w-3.5 mr-1.5" />
                          <span className="truncate">
                            {doc.organization?.name || "N/A"}
                          </span>
                        </div>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getDocumentTypeColor(
                            doc.documentType
                          )}`}
                        >
                          {doc.documentType}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-4 border-t border-slate-100 dark:border-border">
                        <div>
                          <p className="text-muted-foreground dark:text-muted-foreground mb-0.5">
                            Size
                          </p>
                          <p className="font-medium text-foreground">
                            {formatFileSize(doc.fileSize)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground dark:text-muted-foreground mb-0.5">
                            Uploaded
                          </p>
                          <p className="font-medium text-foreground">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions - Show on Hover */}
                      <div className="absolute bottom-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-secondary dark:hover:bg-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(doc._id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-secondary dark:hover:bg-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc._id);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Document Details Modal - Stripe Style */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-3xl rounded-xl border border-border dark:border-border bg-card">
              <DialogHeader className="border-b border-border dark:border-border pb-4">
                <DialogTitle className="text-lg font-semibold text-foreground dark:text-foreground">
                  Document Details
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                  Comprehensive information about this document
                </DialogDescription>
              </DialogHeader>

              {selectedDocument && (
                <div className="space-y-6 py-6">
                  {/* <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-secondary dark:bg-card rounded-lg">
                        <FileText className="h-6 w-6 text-muted-foreground dark:text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground dark:text-foreground mb-2">
                          {selectedDocument.documentName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getDocumentTypeColor(
                              selectedDocument.documentType
                            )}`}
                          >
                            {selectedDocument.documentType}
                          </span>
                          {(() => {
                            const isExpired =
                              selectedDocument.expiryDate &&
                              new Date(selectedDocument.expiryDate) <
                                new Date();
                            const isExpiringSoon =
                              selectedDocument.expiryDate &&
                              new Date(selectedDocument.expiryDate) >
                                new Date() &&
                              new Date(selectedDocument.expiryDate) <
                                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                            return isExpired ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50">
                                <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                                Expired
                              </span>
                            ) : isExpiringSoon ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50">
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                Expiring Soon
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                Active
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-border dark:border-border h-9"
                        onClick={() => {
                          handlePreview(selectedDocument._id);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-9 transition-colors"
                        onClick={() => {
                          handleDownload(selectedDocument._id);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div> */}

                  <div className="flex justify-between items-start">
                  {/* Left */}
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-500" />
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-foreground leading-none">
                        {selectedDocument.documentName}
                      </h3>

                      {/* Company */}
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <FileText className="w-4 h-4" />
                        <span>{selectedDocument.organizationName}</span>
                      </div>

                      {/* Type */}
                      <span
                        className={`inline-flex px-4 py-1 rounded-full text-sm font-medium border ${getDocumentTypeColor(
                          selectedDocument.documentType
                        )}`}
                      >
                        {selectedDocument.documentType}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    {(() => {
                      const isExpired =
                        selectedDocument.expiryDate &&
                        new Date(selectedDocument.expiryDate) < new Date();

                      const isExpiringSoon =
                        selectedDocument.expiryDate &&
                        new Date(selectedDocument.expiryDate) >
                          new Date() &&
                        new Date(selectedDocument.expiryDate) <
                          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                      return isExpired ? (
                        <span className="px-4 py-1 rounded-full border border-red-300 text-red-600 bg-red-50 text-sm">
                          Expired
                        </span>
                      ) : isExpiringSoon ? (
                        <span className="px-4 py-1 rounded-full border border-amber-300 text-amber-600 bg-amber-50 text-sm">
                          Expiring Soon
                        </span>
                      ) : (
                        <span className="px-4 py-1 rounded-full border border-green-400 bg-green-100 text-green-600 text-sm">
                          Active
                        </span>
                      );
                    })()}
                  </div>
                </div>

{/* Divider */}
<div className="mt-8 border-b border-slate-300"></div>

{/* Bottom Row */}
<div className="mt-6 flex justify-between items-center">
  <div className="flex gap-12">
    <div>
      <p className="text-slate-500 text-sm">Size</p>
      <p className="text-xl font-semibold">
        {selectedDocument.fileSize}
      </p>
    </div>

    <div>
      <p className="text-slate-500 text-sm">Uploaded</p>
      <p className="text-xl font-semibold">
        {selectedDocument.uploadDate}
      </p>
    </div>
  </div>

  {/* Actions */}
  <div className="flex items-center gap-6 text-slate-500">
    <button
      onClick={() => handlePreview(selectedDocument._id)}
      className="hover:text-primary transition"
    >
      <Eye className="w-6 h-6" />
    </button>

    <button
      onClick={() => handleDownload(selectedDocument._id)}
      className="hover:text-primary transition"
    >
      <Download className="w-6 h-6" />
    </button>
  </div>
</div>

                  <div className="rounded-lg border border-border dark:border-border bg-background dark:bg-card/50 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider mb-2">
                          Organization
                        </p>
                        <p className="text-sm font-medium text-foreground dark:text-foreground">
                          {selectedDocument.organization?.name || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider mb-2">
                          Uploaded By
                        </p>
                        <p className="text-sm font-medium text-foreground dark:text-foreground">
                          {detailsLoading
                            ? "Loading…"
                            : selectedDocument.uploadedBy?.name ||
                              selectedDocument.uploadedBy?.email ||
                              "Unknown"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider mb-2">
                          Upload Date
                        </p>
                        <p className="text-sm font-medium text-foreground dark:text-foreground">
                          {new Date(
                            selectedDocument.createdAt
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                          {new Date(
                            selectedDocument.createdAt
                          ).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider mb-2">
                          Expiry Date
                        </p>
                        {selectedDocument.expiryDate ? (
                          <>
                            <p className="text-sm font-medium text-foreground dark:text-foreground">
                              {new Date(
                                selectedDocument.expiryDate
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                              {Math.ceil(
                                (new Date(selectedDocument.expiryDate) -
                                  new Date()) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              days remaining
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                            -
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider mb-2">
                          File Type
                        </p>
                        <p className="text-sm font-medium text-foreground dark:text-foreground uppercase">
                          {selectedDocument.fileType || "PDF"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider mb-2">
                          File Size
                        </p>
                        <p className="text-sm font-medium text-foreground dark:text-foreground">
                          {formatFileSize(selectedDocument.fileSize)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* PDF Viewer Modal */}
          {showPdfViewer && pdfUrl && (
            <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
              <DialogContent className="max-w-7xl max-h-[95vh] p-0 overflow-hidden [&>button]:hidden">
                <DialogHeader className="px-6 py-4 border-b border-border bg-background">
                  <div className="flex items-center justify-between gap-4">
                    <DialogTitle className="text-lg font-semibold flex-1">
                      {pdfFileName || "PDF Viewer"}
                    </DialogTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowPdfViewer(false);
                        // Revoke the blob URL when closing
                        if (pdfUrl.startsWith("blob:")) {
                          window.URL.revokeObjectURL(pdfUrl);
                        }
                        setPdfUrl(null);
                        setPdfFileName("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogHeader>
                <div className="h-[calc(95vh-80px)]">
                  <PdfViewer
                    pdfUrl={pdfUrl}
                    fileName={pdfFileName}
                    onClose={() => {
                      setShowPdfViewer(false);
                      // Revoke the blob URL when closing
                      if (pdfUrl.startsWith("blob:")) {
                        window.URL.revokeObjectURL(pdfUrl);
                      }
                      setPdfUrl(null);
                      setPdfFileName("");
                    }}
                    showCloseButton={false}
                    height="100%"
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AllDocuments;
