import { useState, useEffect } from "react";
import { invoiceServiceV3 } from "../services/invoiceServiceV3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  Coins,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Edit,
  Info,
} from "lucide-react";
import { formatCurrency } from "../services/currencyService";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  {
    id: 1,
    title: "Financial Details",
    icon: Coins,
    description: "Amount, dates & terms",
  },
  {
    id: 2,
    title: "Review",
    icon: CheckCircle2,
    description: "Confirm & update",
  },
];

const EditInvoiceWizard = ({
  isOpen,
  onClose,
  invoice,
  contract,
  existingInvoices = [],
  onSuccess,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Calculate remaining contract balance (excluding current invoice)
  const totalContractValue = contract?.pricing?.baseAmount || 0;
  const otherInvoicesTotal = existingInvoices
    .filter((inv) => inv._id !== invoice?._id)
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const remainingBalance = Math.max(0, totalContractValue - otherInvoicesTotal);

  const [formData, setFormData] = useState({
    contractAmount: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    taxRate: "",
    discount: "",
    notes: "",
    currency: "USD",
  });

  useEffect(() => {
    if (isOpen && invoice) {
      // Initialize form with invoice data
      const invoiceAmount = invoice.totalAmount || 0;
      setCurrentStep(1);
      setError("");
      setValidationErrors({});
      setFormData({
        contractAmount: invoiceAmount > 0 ? String(invoiceAmount) : "",
        issueDate: invoice.issueDate
          ? new Date(invoice.issueDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        dueDate: invoice.dueDate
          ? new Date(invoice.dueDate).toISOString().split("T")[0]
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
        taxRate: invoice.taxRate ? String(invoice.taxRate) : "",
        discount: invoice.discount ? String(invoice.discount) : "",
        notes: invoice.notes || "",
        currency: invoice.currency || contract?.pricing?.currency || "USD",
      });
    }
  }, [isOpen, invoice, contract]);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = parseFloat(formData.contractAmount) || 0;
    const discountVal = parseFloat(formData.discount) || 0;
    const taxRateVal = parseFloat(formData.taxRate) || 0;
    const taxAmount = ((subtotal - discountVal) * taxRateVal) / 100;
    const totalAmount = subtotal - discountVal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();

  // Handle number input changes
  const handleNumberChange = (field, value) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData({ ...formData, [field]: value });
      setValidationErrors({ ...validationErrors, [field]: "" });

      if (field === "contractAmount") {
        const amount = parseFloat(value) || 0;
        if (value !== "" && amount > remainingBalance) {
          setValidationErrors({
            ...validationErrors,
            contractAmount: `Amount cannot exceed remaining balance of ${formatCurrency(
              remainingBalance,
              formData.currency
            )}`,
          });
        }
      }
    }
  };

  const validateStep = () => {
    const errors = {};

    if (currentStep === 1) {
      if (!formData.contractAmount || parseFloat(formData.contractAmount) <= 0) {
        errors.contractAmount = "Contract amount must be greater than 0";
      } else {
        const amount = parseFloat(formData.contractAmount);
        if (amount > remainingBalance) {
          errors.contractAmount = `Amount cannot exceed remaining balance of ${formatCurrency(
            remainingBalance,
            formData.currency
          )}`;
        }
      }

      if (!formData.dueDate) {
        errors.dueDate = "Due date is required";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      setError("");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      setCurrentStep(1);
      return;
    }

    // Only draft invoices can be edited
    if (invoice?.status !== "draft") {
      setError("Only draft invoices can be edited");
      setCurrentStep(1);
      return;
    }

    // Validate total invoices won't exceed contract value
    const newTotalInvoiced = otherInvoicesTotal + totalAmount;
    if (newTotalInvoiced > totalContractValue) {
      const maxAllowed = totalContractValue - otherInvoicesTotal;
      setError(
        `Updating this invoice would exceed the total contract value of ${formatCurrency(
          totalContractValue,
          formData.currency
        )}. Maximum allowed: ${formatCurrency(maxAllowed, formData.currency)}`
      );
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const amount = parseFloat(formData.contractAmount) || 0;
      const invoiceData = {
        lineItems: [
          {
            description: `Invoice for contract: ${contract?.title || "N/A"}`,
            quantity: 1,
            unitPrice: amount,
            total: amount,
          },
        ],
        issueDate: formData.issueDate || new Date().toISOString(),
        dueDate: formData.dueDate,
        taxRate: parseFloat(formData.taxRate) || 0,
        discount: parseFloat(formData.discount) || 0,
        notes: formData.notes,
        currency: formData.currency,
      };

      const response = await invoiceServiceV3.update(invoice._id, invoiceData);

      if (response?.status === "success") {
        toast({
          title: "Success",
          description: "Invoice updated successfully.",
          variant: "success",
        });
        onClose();
        onSuccess?.();
      } else {
        throw new Error(response.message || "Failed to update invoice.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update invoice. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  const isLastStep = currentStep === STEPS.length;
  const canEdit = invoice.status === "draft";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="absolute right-0 top-0 h-full w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#00B4D8] to-[#0091B3] flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Edit Invoice
              </h2>
              <p className="text-xs sm:text-sm text-foreground/80 dark:text-muted-foreground">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.title}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full absolute top-4 right-4 sm:relative sm:top-0 sm:right-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="hidden md:flex w-full md:w-64 lg:w-72 border-r border-border bg-secondary p-4 md:p-6 overflow-y-auto flex-shrink-0">
            <div className="space-y-2">
              {STEPS.map((step) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const isAccessible = currentStep >= step.id;

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (isAccessible) {
                        setCurrentStep(step.id);
                        setError("");
                      }
                    }}
                    disabled={!isAccessible}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                      isCurrent
                        ? "bg-[#00B4D8]/10 border-2 border-[#00B4D8]"
                        : isCompleted
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800"
                        : "border-2 border-transparent hover:bg-secondary"
                    } ${
                      !isAccessible
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCurrent
                          ? "bg-[#00B4D8] text-primary-foreground"
                          : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-semibold text-sm ${
                          isCurrent
                            ? "text-[#00B4D8]"
                            : isCompleted
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-foreground/80 dark:text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
                        {step.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!canEdit && (
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Only draft invoices can be edited. This invoice status is: {invoice.status}
                </AlertDescription>
              </Alert>
            )}

            {/* Step 1: Financial Details */}
            {currentStep === 1 && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Financial Details
                  </h3>
                  <p className="text-foreground/80 dark:text-muted-foreground">
                    Update the invoice amount, dates, and financial terms
                  </p>
                </div>

                {/* Contract Balance Info */}
                {totalContractValue > 0 && (
                  <Card className="bg-muted/50 border-border">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Total Contract Value
                          </p>
                          <p className="font-semibold text-lg">
                            {formatCurrency(totalContractValue, formData.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Other Invoices
                          </p>
                          <p className="font-semibold text-lg">
                            {formatCurrency(otherInvoicesTotal, formData.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Remaining Balance
                          </p>
                          <p className="font-semibold text-lg text-primary">
                            {formatCurrency(remainingBalance, formData.currency)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="contractAmount" className="text-sm font-medium">
                        Contract Amount <span className="text-destructive">*</span>
                      </Label>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="relative">
                      <Input
                        id="contractAmount"
                        type="text"
                        inputMode="decimal"
                        value={formData.contractAmount}
                        onChange={(e) =>
                          handleNumberChange("contractAmount", e.target.value)
                        }
                        placeholder="Enter contract amount"
                        disabled={loading || !canEdit || remainingBalance <= 0}
                        className="text-lg font-semibold pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {formData.currency}
                      </span>
                    </div>
                    {validationErrors.contractAmount && (
                      <p className="text-sm text-destructive mt-1">
                        {validationErrors.contractAmount}
                      </p>
                    )}
                    {remainingBalance <= 0 ? (
                      <Alert className="mt-2">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          All contract value has been invoiced. Cannot increase invoice amount.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      remainingBalance > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum allowed:{" "}
                          {formatCurrency(remainingBalance, formData.currency)}
                        </p>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="issueDate" className="text-sm font-medium">
                        Issue Date
                      </Label>
                      <Input
                        id="issueDate"
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, issueDate: e.target.value })
                        }
                        className="mt-1"
                        disabled={loading || !canEdit}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueDate" className="text-sm font-medium">
                        Due Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: e.target.value })
                        }
                        className="mt-1"
                        required
                        disabled={loading || !canEdit}
                      />
                      {validationErrors.dueDate && (
                        <p className="text-sm text-destructive mt-1">
                          {validationErrors.dueDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="currency" className="text-sm font-medium">
                      Currency
                    </Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, currency: value })
                      }
                      disabled={loading || !canEdit}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="NGN">NGN</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="taxRate" className="text-sm font-medium">
                      Tax Rate (%)
                    </Label>
                    <Input
                      id="taxRate"
                      type="text"
                      inputMode="decimal"
                      value={formData.taxRate}
                      onChange={(e) =>
                        handleNumberChange("taxRate", e.target.value)
                      }
                      placeholder="0"
                      className="mt-1"
                      disabled={loading || !canEdit}
                    />
                    {validationErrors.taxRate && (
                      <p className="text-sm text-destructive mt-1">
                        {validationErrors.taxRate}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="discount" className="text-sm font-medium">
                      Discount
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="discount"
                        type="text"
                        inputMode="decimal"
                        value={formData.discount}
                        onChange={(e) =>
                          handleNumberChange("discount", e.target.value)
                        }
                        placeholder="0"
                        className="pr-12"
                        disabled={loading || !canEdit}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {formData.currency}
                      </span>
                    </div>
                    {validationErrors.discount && (
                      <p className="text-sm text-destructive mt-1">
                        {validationErrors.discount}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Add any internal notes or comments"
                      rows={4}
                      className="mt-1"
                      disabled={loading || !canEdit}
                    />
                  </div>

                  <Card className="bg-muted/50 border-border">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">
                          {formatCurrency(subtotal, formData.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax Amount:</span>
                        <span className="font-medium">
                          {formatCurrency(taxAmount, formData.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
                        <span>Total Amount:</span>
                        <span>
                          {formatCurrency(totalAmount, formData.currency)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {currentStep === 2 && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Review & Confirm
                  </h3>
                  <p className="text-foreground/80 dark:text-muted-foreground">
                    Review all details before updating the invoice
                  </p>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Contract Amount
                        </p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(
                            parseFloat(formData.contractAmount) || 0,
                            formData.currency
                          )}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Issue Date
                          </p>
                          <p className="font-medium">
                            {new Date(formData.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Due Date
                          </p>
                          <p className="font-medium">
                            {new Date(formData.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Tax Rate
                          </p>
                          <p className="font-medium">
                            {formData.taxRate || "0"}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Discount
                          </p>
                          <p className="font-medium">
                            {formatCurrency(
                              parseFloat(formData.discount) || 0,
                              formData.currency
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            Total Amount
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(totalAmount, formData.currency)}
                          </p>
                        </div>
                      </div>

                      {formData.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Notes
                          </p>
                          <p className="text-sm">{formData.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
              Cancel
            </Button>
            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={loading || !canEdit}
                className="w-full sm:w-auto"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Invoice
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={loading || !canEdit} className="w-full sm:w-auto">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInvoiceWizard;
