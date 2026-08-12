import { useState } from "react";
import { invoiceServiceV3 } from "../services/invoiceServiceV3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Upload, FileText, X } from "lucide-react";
import { formatCurrency } from "../services/currencyService";
import { receiptServiceV3 } from "../services/receiptServiceV3";
import { useToast } from "@/hooks/use-toast";

const RecordPaymentModal = ({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
  currency = "USD",
  remainingBalance = 0,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "bank_transfer",
    paymentDate: new Date().toISOString().split("T")[0],
    payer: "",
    referenceNumber: "",
    notes: "",
  });
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.amount || !formData.paymentMethod) {
      setError("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (amount > remainingBalance + 0.01) {
      setError(
        `Payment amount (${formatCurrency(
          amount,
          currency
        )}) would exceed remaining balance of ${formatCurrency(
          remainingBalance,
          currency
        )}`
      );
      return;
    }

    setLoading(true);

    try {
      // Use FormData if we have a file to upload
      let response;
      if (proofFile) {
        const uploadData = new FormData();
        uploadData.append("amount", amount);
        uploadData.append("currency", currency);
        uploadData.append("paymentMethod", formData.paymentMethod);
        uploadData.append("paymentDate", formData.paymentDate);
        if (formData.payer) uploadData.append("payer", formData.payer);
        if (formData.referenceNumber) uploadData.append("referenceNumber", formData.referenceNumber);
        if (formData.notes) uploadData.append("notes", formData.notes);
        uploadData.append("proofFile", proofFile);
        
        response = await receiptServiceV3.createWithProof(invoiceId, uploadData);
      } else {
        response = await invoiceServiceV3.recordPayment(invoiceId, {
          amount,
          currency,
          paymentMethod: formData.paymentMethod,
          paymentDate: formData.paymentDate,
          payer: formData.payer,
          referenceNumber: formData.referenceNumber,
          notes: formData.notes,
        });
      }

      if (response?.status === "success") {
        toast({
          title: "Success",
          description: "Payment recorded successfully.",
          variant: "success",
        });
        setFormData({
          amount: "",
          paymentMethod: "bank_transfer",
          paymentDate: new Date().toISOString().split("T")[0],
          payer: "",
          referenceNumber: "",
          notes: "",
        });
        setProofFile(null);
        onSuccess();
      } else {
        setError(response.message || "Failed to record payment");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to record payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed for payment proof");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setProofFile(file);
      setError("");
    }
  };

  const removeFile = () => {
    setProofFile(null);
  };

  const paymentMethodOptions = [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "cheque", label: "Cheque" },
    { value: "wire_transfer", label: "Wire Transfer" },
    { value: "ach", label: "ACH" },
    { value: "other", label: "Other" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment for Invoice {invoiceNumber}</DialogTitle>
          <DialogDescription>
            Enter payment details. Remaining balance:{" "}
            <span className="font-semibold">
              {formatCurrency(remainingBalance, currency)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="col-span-3"
              required
              min="0.01"
              max={remainingBalance + 0.01}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentMethod" className="text-right">
              Method *
            </Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentMethod: value })
              }
              disabled={loading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentDate" className="text-right">
              Date *
            </Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) =>
                setFormData({ ...formData, paymentDate: e.target.value })
              }
              className="col-span-3"
              required
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payer" className="text-right">
              Payer
            </Label>
            <Input
              id="payer"
              value={formData.payer}
              onChange={(e) =>
                setFormData({ ...formData, payer: e.target.value })
              }
              className="col-span-3"
              placeholder="e.g., Client Company Name"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="referenceNumber" className="text-right">
              Reference
            </Label>
            <Input
              id="referenceNumber"
              value={formData.referenceNumber}
              onChange={(e) =>
                setFormData({ ...formData, referenceNumber: e.target.value })
              }
              className="col-span-3"
              placeholder="Transaction ID, Cheque No."
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="col-span-3"
              placeholder="Any additional notes for the payment"
              disabled={loading}
            />
          </div>
          
          {/* Receipt/Proof Upload */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Receipt Proof
            </Label>
            <div className="col-span-3 space-y-2">
              {proofFile ? (
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border">
                  <FileText className="h-5 w-5 text-[#00B4D8]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{proofFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(proofFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    disabled={loading}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="proofFile"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="cursor-pointer"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload a PDF receipt or proof of payment (optional, max 10MB)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPaymentModal;
