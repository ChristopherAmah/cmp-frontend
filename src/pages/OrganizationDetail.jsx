import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { organizationService } from "../services/organizationService";
import { documentService } from "../services/documentService";
import { contractServiceV3 } from "../services/contractServiceV3";
import DashboardLayout from "../components/DashboardLayout";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Download,
  FileText,
  Loader2,
  Upload,
  Building2,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ScrollText,
  Eye,
  X,
} from "lucide-react";
import PdfViewer from "../components/PdfViewer";
import Breadcrumb from "../components/Breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canCreateContracts, canUploadDocuments } = usePermissions();
  const { toast } = useToast();
  const [organization, setOrganization] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [contractSearchTerm, setContractSearchTerm] = useState("");
  const [uploadData, setUploadData] = useState({
    documentName: "",
    documentType: "Other",
    file: null,
    startDate: "",
    expiryDate: "",
  });
  const [uploading, setUploading] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orgResponse, docsResponse, contractsResponse] = await Promise.all([
        organizationService.getById(id),
        documentService.getAll({ organizationId: id }),
        contractServiceV3.getAll({ organizationId: id }),
      ]);

      if (orgResponse?.status === "success") {
        setOrganization(orgResponse.data);
      }
      if (docsResponse?.status === "success") {
        setDocuments(docsResponse.data || []);
      } else {
        setDocuments([]);
      }
      if (contractsResponse?.status === "success") {
        setContracts(contractsResponse.data || []);
      } else {
        setContracts([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setDocuments([]);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Only PDF files are allowed");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setUploadData({ ...uploadData, file });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Only PDF files are allowed");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setUploadData({ ...uploadData, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.documentName) {
      alert("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      // documentService.upload handles organizationId
      formData.append("documentName", uploadData.documentName);
      formData.append("documentType", uploadData.documentType);
      if (uploadData.startDate)
        formData.append("startDate", uploadData.startDate);
      if (uploadData.expiryDate)
        formData.append("expiryDate", uploadData.expiryDate);
      formData.append("file", uploadData.file);

      const response = await documentService.upload(id, formData);
      if (response?.status === "success") {
        setIsUploadModalOpen(false);
        setUploadData({
          documentName: "",
          documentType: "Other",
          file: null,
          startDate: "",
          expiryDate: "",
        });
        await fetchData();
      } else {
        alert(response?.message || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert(error.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const getDownloadUrl = (url) => {
    if (!url) return "#";
    // Cloudinary trick to force download instead of preview
    if (url.includes("cloudinary.com") && url.includes("/upload/")) {
      return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
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

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: documents.length,
    active: documents.filter(
      (doc) => !doc.expiryDate || new Date(doc.expiryDate) > new Date()
    ).length,
    expired: documents.filter(
      (doc) => doc.expiryDate && new Date(doc.expiryDate) < new Date()
    ).length,
  };

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.title
        ?.toLowerCase()
        .includes(contractSearchTerm.toLowerCase()) ||
      contract.contractNumber
        ?.toLowerCase()
        .includes(contractSearchTerm.toLowerCase()) ||
      contract.status?.toLowerCase().includes(contractSearchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      active:
        "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
      draft:
        "bg-muted/50 text-muted-foreground border-border",
      pending_signature:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      expired: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
      cancelled:
        "bg-muted/50 text-muted-foreground border-border",
    };
    return colors[status] || colors.draft;
  };

  const handleCreateContract = () => {
    navigate(`/contracts/new?organizationId=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#00B4D8]" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="">
        <div className=" px-6 sm:px-8 lg:px-12 py-12">
          {/* Header Section - Stripe Style */}
          <div className="mb-10">
            <Breadcrumb
              items={[
                { label: "Organizations", href: "/organizations" },
                { label: organization?.name || "Organization" },
              ]}
            />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary dark:bg-card rounded-xl">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground dark:text-foreground mb-1">
                    {organization?.name || "Organization"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {organization?.organizationType || "Managed Entity"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {canCreateContracts && (
                  <Button
                    onClick={handleCreateContract}
                    variant="outline"
                    className="border-border dark:border-border h-10"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contract
                  </Button>
                )}
                {canUploadDocuments && (
                  <Button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid - Stripe Style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Contracts
                </p>
                <ScrollText className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {contracts.length}
              </p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Documents
                </p>
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Documents
                </p>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {stats.active}
              </p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Expired
                </p>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {stats.expired}
              </p>
            </div>
          </div>

          {/* Tabs: Contracts & Documents */}
          <Tabs defaultValue="contracts" className="mb-8">
            <Card className="border border-border rounded-xl bg-card">
              <CardHeader className="border-b border-border px-6 py-4">
                <TabsList className="mb-4">
                  <TabsTrigger
                    value="contracts"
                    className="flex items-center gap-2"
                  >
                    <ScrollText className="h-4 w-4" />
                    Contracts ({contracts.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Documents ({documents.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="contracts" className="mt-0">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="w-full sm:w-64">
                      <Input
                        placeholder="Search contracts..."
                        value={contractSearchTerm}
                        onChange={(e) => setContractSearchTerm(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  {filteredContracts.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <ScrollText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        No contracts yet
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                        Create your first contract for this organization.
                      </p>
                      {canCreateContracts && (
                        <Button
                          onClick={handleCreateContract}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Contract
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Contract</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredContracts.map((contract) => (
                            <TableRow
                              key={contract._id}
                              className="cursor-pointer hover:bg-secondary/50"
                              onClick={() =>
                                navigate(`/contracts/${contract._id}`)
                              }
                            >
                              <TableCell className="font-medium">
                                <div>
                                  <p className="text-sm font-semibold">
                                    {contract.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {contract.contractNumber}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={getStatusColor(contract.status)}
                                >
                                  {contract.status?.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {contract.category || "—"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {contract.timeline?.effectiveDate
                                  ? new Date(
                                      contract.timeline.effectiveDate
                                    ).toLocaleDateString()
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/contracts/${contract._id}`);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <CardContent className="p-0">
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="w-full sm:w-64">
                      <Input
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                  {documents.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        No documents yet
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                        Upload your first document to get started.
                      </p>
                      {canUploadDocuments && (
                        <Button
                          onClick={() => setIsUploadModalOpen(true)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Document
                        </Button>
                      )}
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        No documents match your search.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-border hover:bg-transparent">
                            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                              Document Name
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                              Type
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                              Period
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                              Uploaded
                            </TableHead>
                            <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDocuments.map((doc) => {
                            const isExpired =
                              doc.expiryDate &&
                              new Date(doc.expiryDate) < new Date();
                            return (
                              <TableRow
                                key={doc._id}
                                className="border-b border-border hover:bg-secondary transition-colors"
                              >
                                <TableCell className="px-6 py-4 font-medium text-foreground">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-secondary rounded-lg">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {doc.documentName}
                                      </p>
                                      {isExpired && (
                                        <span className="text-xs text-destructive font-medium flex items-center gap-1 mt-0.5">
                                          <AlertTriangle className="h-3 w-3" />
                                          Expired
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                  <span
                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getDocumentTypeColor(
                                      doc.documentType
                                    )}`}
                                  >
                                    {doc.documentType}
                                  </span>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                                  <div className="text-xs space-y-1">
                                    {doc.startDate && (
                                      <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3 opacity-70" />
                                        <span>
                                          {new Date(
                                            doc.startDate
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                    {doc.expiryDate && (
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="h-3 w-3 opacity-70" />
                                        <span>
                                          {new Date(
                                            doc.expiryDate
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                    {!doc.startDate && !doc.expiryDate && (
                                      <span className="text-muted-foreground">
                                        -
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right">
                                  <div className="flex items-center gap-2 justify-end">
                                    <Button
                                      variant="ghost"
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
                                      className="h-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                      title="View PDF"
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const url = doc.cloudinaryUrl || doc.url;
                                          // Fetch the file as a blob to ensure proper download
                                          const response = await fetch(url, {
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
                                          link.download = doc.documentName || doc.fileName || "document.pdf";
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);

                                          // Clean up blob URL after download starts
                                          setTimeout(() => {
                                            URL.revokeObjectURL(blobUrl);
                                          }, 100);
                                        } catch (error) {
                                          console.error("Error downloading document:", error);
                                          // Fallback to opening in new tab
                                          window.open(
                                            doc.cloudinaryUrl || doc.url,
                                            "_blank"
                                          );
                                        }
                                      }}
                                      className="h-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                      title="Download PDF"
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </TabsContent>
            </Card>
          </Tabs>

          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogContent className="sm:max-w-[550px] rounded-xl border border-border bg-card">
              <DialogHeader className="border-b border-border dark:border-border pb-4">
                <DialogTitle className="text-lg font-semibold text-foreground dark:text-foreground">
                  Upload Document
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Add a new contract or document to {organization?.name}. Only
                  PDF files are supported.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-6 mt-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="documentName"
                      className="text-foreground text-sm font-medium"
                    >
                      Document Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="documentName"
                      value={uploadData.documentName}
                      onChange={(e) =>
                        setUploadData({
                          ...uploadData,
                          documentName: e.target.value,
                        })
                      }
                      required
                      placeholder="e.g. Master Service Agreement 2024"
                      className="bg-background dark:bg-card/60 border-border dark:border-border text-foreground dark:text-foreground placeholder:text-muted-foreground focus:border-[#00B4D8] transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="documentType"
                      className="text-foreground text-sm font-medium"
                    >
                      Document Type
                    </Label>
                    <Select
                      value={uploadData.documentType}
                      onValueChange={(value) =>
                        setUploadData({ ...uploadData, documentType: value })
                      }
                    >
                      <SelectTrigger className="bg-background dark:bg-card/60 border-border dark:border-border text-foreground dark:text-foreground focus:ring-0 focus:border-[#00B4D8]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card dark:bg-card border-border dark:border-border text-foreground dark:text-foreground">
                        {[
                          "SLA",
                          "SOW",
                          "Co-location",
                          "NDA",
                          "Contract",
                          "Other",
                        ].map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                            className="focus:bg-secondary cursor-pointer"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="startDate"
                        className="text-foreground text-sm font-medium"
                      >
                        Start Date
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={uploadData.startDate}
                        onChange={(e) =>
                          setUploadData({
                            ...uploadData,
                            startDate: e.target.value,
                          })
                        }
                        className="bg-background dark:bg-card/60 border-border dark:border-border text-foreground dark:text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="expiryDate"
                        className="text-foreground text-sm font-medium"
                      >
                        Expiry Date
                      </Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={uploadData.expiryDate}
                        onChange={(e) =>
                          setUploadData({
                            ...uploadData,
                            expiryDate: e.target.value,
                          })
                        }
                        className="bg-background dark:bg-card/60 border-border dark:border-border text-foreground dark:text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="file"
                      className="text-foreground text-sm font-medium"
                    >
                      Document File (PDF){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div 
                      className="border-2 border-dashed border-slate-300 dark:border-border rounded-lg p-6 hover:bg-background dark:hover:bg-card/30 hover:border-[#00B4D8]/50 transition-all text-center cursor-pointer relative group"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <Input
                        id="file"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        required
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-secondary dark:bg-card flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="h-5 w-5 text-[#00B4D8]" />
                        </div>
                        {uploadData.file ? (
                          <div className="text-sm">
                            <p className="text-[#00B4D8] font-medium">
                              {uploadData.file.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {(uploadData.file.size / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <p className="text-foreground font-medium">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-muted-foreground text-xs">
                              PDF available up to 10MB
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-3 mt-6 pt-4 border-t border-border dark:border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="h-9 border-border dark:border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="bg-card hover:bg-secondary text-foreground shadow-sm h-9 min-w-[100px]"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading
                      </>
                    ) : (
                      "Upload Document"
                    )}
                  </Button>
                </DialogFooter>
              </form>
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationDetail;
