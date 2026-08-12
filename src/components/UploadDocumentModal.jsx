import { useState } from "react";
import { documentService } from "../services/documentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UploadDocumentModal = ({
  organizationId,
  contractId,
  onClose,
  onSuccess,
  isOpen = true,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    documentName: "",
    documentType: "Other",
    startDate: "",
    expiryDate: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const documentTypes = [
    "SLA",
    "SOW",
    "Co-location",
    "NDA",
    "Contract",
    "Other",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    // Validate PDF file
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }

    setLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("documentName", formData.documentName);
      uploadFormData.append("documentType", formData.documentType);
      if (formData.startDate) {
        uploadFormData.append("startDate", formData.startDate);
      }
      if (formData.expiryDate) {
        uploadFormData.append("expiryDate", formData.expiryDate);
      }
      // Link to contract if provided
      if (contractId) {
        uploadFormData.append("contractId", contractId);
      }

      // Upload to organization
      const response = await documentService.upload(
        organizationId,
        uploadFormData
      );

      if (response?.status === "success") {
        toast({
          title: "Success",
          description: "Document uploaded successfully.",
          variant: "success",
        });
        // Reset form
        setFormData({
          documentName: "",
          documentType: "Other",
          startDate: "",
          expiryDate: "",
        });
        setFile(null);
        onSuccess();
      } else {
        setError(response?.message || "Failed to upload document");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00B4D8]/10 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#00B4D8]" />
            </div>
            <div>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a PDF document
                {contractId ? " for this contract" : " for this organization"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="documentName">
              Document Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="documentName"
              name="documentName"
              type="text"
              required
              placeholder="Enter document name"
              value={formData.documentName}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type</Label>
            <Select
              value={formData.documentType}
              onValueChange={(value) =>
                setFormData({ ...formData, documentType: value })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">
              PDF File <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                name="file"
                type="file"
                accept=".pdf,application/pdf"
                required
                onChange={handleFileChange}
                disabled={loading}
                className="cursor-pointer"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Only PDF files are allowed (max 10MB)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !file}
              className="bg-[#00B4D8] hover:bg-[#0091B3]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDocumentModal;
