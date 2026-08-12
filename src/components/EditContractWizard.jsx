import { useState, useEffect } from "react";
import { contractServiceV3 } from "../services/contractServiceV3";
import { organizationService } from "../services/organizationService";
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
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatePicker } from "../components/ui/calendar";
import {
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  Coins,
  Calendar,
  Users,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Tag,
  Lock,
} from "lucide-react";
import { formatCurrency } from "../services/currencyService";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STEPS = [
  {
    id: 1,
    title: "Basic Info",
    icon: FileText,
    description: "Contract details",
  },
  {
    id: 2,
    title: "Parties",
    icon: Users,
    description: "Organizations & contacts",
  },
  { id: 3, title: "Pricing", icon: Coins, description: "Financial terms" },
  { id: 4, title: "Timeline", icon: Calendar, description: "Dates & duration" },
  {
    id: 5,
    title: "Review",
    icon: CheckCircle2,
    description: "Confirm & update",
  },
];

/**
 * Get editable fields for a contract status
 */
const getEditableFieldsForStatus = (status) => {
  if (status === "draft") {
    return null; // All fields editable
  }
  if (status === "pending_signature") {
    return [
      "title",
      "description",
      "tags",
      "customFields",
      "priority",
      "compliance",
    ];
  }
  return [];
};

/**
 * Check if a field is editable
 */
const isFieldEditable = (status, fieldName) => {
  const editableFields = getEditableFieldsForStatus(status);
  if (editableFields === null) return true;
  const topLevelField = fieldName.split(".")[0];
  return editableFields.includes(topLevelField);
};

const EditContractWizard = ({ isOpen, onClose, contract, onSuccess }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const contractStatus = contract?.status || "draft";
  const editableFields = getEditableFieldsForStatus(contractStatus);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "service",
    priority: "normal",
    tags: [],
    parties: [],
    pricing: {
      model: "fixed",
      currency: "USD",
      baseAmount: "",
      billingCycle: "one-time",
      renewalTerms: {
        autoRenew: false,
        noticePeriodDays: 30,
        renewalType: "manual",
      },
      paymentTerms: {
        netDays: 30,
        earlyPaymentDiscount: 0,
        latePaymentFee: 0,
      },
    },
    timeline: {
      effectiveDate: "",
      expirationDate: "",
    },
  });

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (isOpen && contract) {
      fetchOrganizations();
      initializeFormData();
    }
  }, [isOpen, contract]);

  const initializeFormData = () => {
    if (!contract) return;

    // Format dates for DatePicker (expects yyyy-MM-dd format)
    const formatDateForPicker = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        // Return in yyyy-MM-dd format
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      } catch {
        return "";
      }
    };

    setFormData({
      title: contract.title || "",
      description: contract.description || "",
      category: contract.category || "service",
      priority: contract.priority || "normal",
      tags: contract.tags || [],
      parties: contract.parties?.map((party) => ({
        organizationId: party.organizationId?._id || party.organizationId || "",
        role: party.role || "client",
        primaryContact: party.primaryContact || {
          name: "",
          email: "",
          phone: "",
          title: "",
        },
      })) || [],
      pricing: {
        model: contract.pricing?.model || "fixed",
        currency: contract.pricing?.currency || "USD",
        baseAmount: contract.pricing?.baseAmount?.toString() || "",
        billingCycle: contract.pricing?.billingCycle || "one-time",
        renewalTerms: {
          autoRenew: contract.pricing?.renewalTerms?.autoRenew || false,
          noticePeriodDays:
            contract.pricing?.renewalTerms?.noticePeriodDays || 30,
          renewalType: contract.pricing?.renewalTerms?.renewalType || "manual",
        },
        paymentTerms: {
          netDays: contract.pricing?.paymentTerms?.netDays || 30,
          earlyPaymentDiscount:
            contract.pricing?.paymentTerms?.earlyPaymentDiscount || 0,
          latePaymentFee: contract.pricing?.paymentTerms?.latePaymentFee || 0,
        },
      },
      timeline: {
        effectiveDate: formatDateForPicker(contract.timeline?.effectiveDate),
        expirationDate: formatDateForPicker(contract.timeline?.expirationDate),
      },
    });
  };

  const fetchOrganizations = async () => {
    try {
      const response = await organizationService.getAll();
      if (response?.status === "success") {
        setOrganizations(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching organizations:", err);
    }
  };

  const validateStep = (step) => {
    const errors = {};
    switch (step) {
      case 1:
        if (!formData.title.trim()) errors.title = "Title is required";
        if (!formData.category) errors.category = "Category is required";
        break;
      case 2:
        if (!formData.parties || formData.parties.length === 0) {
          errors.parties = "At least one party is required";
        } else {
          formData.parties.forEach((party, idx) => {
            if (!party.organizationId) {
              errors[`party_${idx}_organization`] = "Organization is required";
            }
            if (!party.role) {
              errors[`party_${idx}_role`] = "Role is required";
            }
          });
        }
        break;
      case 3:
        if (
          formData.pricing.model === "fixed" &&
          !formData.pricing.baseAmount
        ) {
          errors.baseAmount = "Base amount is required";
        }
        if (
          formData.pricing.baseAmount &&
          parseFloat(formData.pricing.baseAmount) < 0
        ) {
          errors.baseAmount = "Amount must be positive";
        }
        break;
      case 4:
        if (!formData.timeline.effectiveDate) {
          errors.effectiveDate = "Effective date is required";
        }
        break;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      setError("");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError("");

    try {
      // Transform form data for API
      const contractData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        tags: formData.tags,
        parties: formData.parties
          .filter((p) => p.organizationId)
          .map((p) => ({
            organizationId: p.organizationId,
            role: p.role,
            primaryContact: p.primaryContact.name
              ? p.primaryContact
              : undefined,
          })),
        pricing: {
          ...formData.pricing,
          baseAmount: parseFloat(formData.pricing.baseAmount) || 0,
        },
        timeline: {
          effectiveDate: formData.timeline.effectiveDate,
          expirationDate: formData.timeline.expirationDate || undefined,
        },
      };

      const response = await contractServiceV3.update(contract._id, contractData);
      if (response?.status === "success") {
        toast({
          title: "Success",
          description: "Contract updated successfully.",
          variant: "success",
        });
        onClose();
        onSuccess?.();
      } else {
        setError(response.message || "Failed to update contract");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update contract. Please try again.";
      setError(errorMessage);
      
      // Show toast for restricted fields error
      if (err.response?.data?.restrictedFields) {
        toast({
          title: "Cannot Edit",
          description: `Some fields cannot be edited in ${contractStatus} status.`,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const addParty = () => {
    setFormData({
      ...formData,
      parties: [
        ...formData.parties,
        {
          organizationId: "",
          role: "vendor",
          primaryContact: {
            name: "",
            email: "",
            phone: "",
            title: "",
          },
        },
      ],
    });
  };

  const removeParty = (index) => {
    setFormData({
      ...formData,
      parties: formData.parties.filter((_, i) => i !== index),
    });
  };

  const updateParty = (index, field, value) => {
    const updatedParties = [...formData.parties];
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      updatedParties[index] = {
        ...updatedParties[index],
        [parent]: {
          ...updatedParties[index][parent],
          [child]: value,
        },
      };
    } else {
      updatedParties[index] = {
        ...updatedParties[index],
        [field]: value,
      };
    }
    setFormData({ ...formData, parties: updatedParties });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  if (!isOpen || !contract) return null;

  const CurrentStepIcon = STEPS[currentStep - 1]?.icon;
  const isLastStep = currentStep === STEPS.length;
  const isPendingSignature = contractStatus === "pending_signature";

  // Helper to render field with restriction indicator
  const renderFieldWrapper = (fieldName, children, label) => {
    const editable = isFieldEditable(contractStatus, fieldName);
    
    if (!editable) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <div className="opacity-50 pointer-events-none">{children}</div>
                <div className="absolute top-0 right-0 p-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                This field cannot be edited while the contract is pending
                signature. Change status to draft to edit core terms.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return children;
  };

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#00B4D8] to-[#0091B3] flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Edit Contract
              </h2>
              <p className="text-xs sm:text-sm text-foreground/80 dark:text-muted-foreground">
                Step {currentStep} of {STEPS.length}:{" "}
                {STEPS[currentStep - 1]?.title}
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

        {/* Status Warning */}
        {isPendingSignature && (
          <Alert className="m-4 sm:m-6 mb-0 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              <strong>Limited Editing:</strong> Only metadata fields (title,
              description, tags, priority) can be edited while the contract is
              pending signature. To edit core terms (parties, pricing, timeline),
              change the status back to draft first.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
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
                      className={`mt-0.5 ${
                        isCurrent
                          ? "text-[#00B4D8]"
                          : isCompleted
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground/70 dark:text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
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
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="max-w-2xl space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Contract Details
                  </h3>
                  <p className="text-foreground/80 dark:text-muted-foreground">
                    Update basic information about the contract
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">
                      Contract Title <span className="text-destructive">*</span>
                    </Label>
                    {renderFieldWrapper(
                      "title",
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="e.g., Service Agreement with Acme Corp"
                        className="mt-1"
                        disabled={!isFieldEditable(contractStatus, "title")}
                      />,
                      "title"
                    )}
                    {validationErrors.title && (
                      <p className="text-sm text-destructive mt-1">
                        {validationErrors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description
                    </Label>
                    {renderFieldWrapper(
                      "description",
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe the contract purpose and scope..."
                        rows={4}
                        className="mt-1"
                        disabled={!isFieldEditable(contractStatus, "description")}
                      />,
                      "description"
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-sm font-medium">
                        Category <span className="text-destructive">*</span>
                      </Label>
                      {renderFieldWrapper(
                        "category",
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                          disabled={!isFieldEditable(contractStatus, "category")}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="license">License</SelectItem>
                            <SelectItem value="consulting">Consulting</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="procurement">Procurement</SelectItem>
                            <SelectItem value="nda">NDA</SelectItem>
                            <SelectItem value="msa">MSA</SelectItem>
                            <SelectItem value="sow">SOW</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>,
                        "category"
                      )}
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      {renderFieldWrapper(
                        "priority",
                        <Select
                          value={formData.priority}
                          onValueChange={(value) =>
                            setFormData({ ...formData, priority: value })
                          }
                          disabled={!isFieldEditable(contractStatus, "priority")}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>,
                        "priority"
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    {renderFieldWrapper(
                      "tags",
                      <div>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addTag();
                              }
                            }}
                            placeholder="Add tag and press Enter"
                            className="flex-1"
                            disabled={!isFieldEditable(contractStatus, "tags")}
                          />
                          <Button
                            type="button"
                            onClick={addTag}
                            variant="outline"
                            disabled={!isFieldEditable(contractStatus, "tags")}
                          >
                            <Tag className="h-4 w-4" />
                          </Button>
                        </div>
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="hover:text-destructive"
                                  disabled={!isFieldEditable(contractStatus, "tags")}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>,
                      "tags"
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Parties */}
            {currentStep === 2 && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Contract Parties
                  </h3>
                  <p className="text-foreground/80 dark:text-muted-foreground">
                    Update organizations and contacts involved in this contract
                  </p>
                </div>

                {!isFieldEditable(contractStatus, "parties") && (
                  <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-amber-800 dark:text-amber-300">
                      Parties cannot be edited while the contract is pending
                      signature. Change status to draft to edit parties.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  {formData.parties.map((party, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">Party {idx + 1}</h4>
                          {formData.parties.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeParty(idx)}
                              disabled={!isFieldEditable(contractStatus, "parties")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label>
                                Organization{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Select
                                value={party.organizationId}
                                onValueChange={(value) =>
                                  updateParty(idx, "organizationId", value)
                                }
                                disabled={!isFieldEditable(contractStatus, "parties")}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                                <SelectContent>
                                  {organizations.map((org) => (
                                    <SelectItem key={org._id} value={org._id}>
                                      {org.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>
                                Role <span className="text-destructive">*</span>
                              </Label>
                              <Select
                                value={party.role}
                                onValueChange={(value) =>
                                  updateParty(idx, "role", value)
                                }
                                disabled={!isFieldEditable(contractStatus, "parties")}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="client">Client</SelectItem>
                                  <SelectItem value="vendor">Vendor</SelectItem>
                                  <SelectItem value="partner">Partner</SelectItem>
                                  <SelectItem value="supplier">Supplier</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label>Contact Name</Label>
                              <Input
                                value={party.primaryContact.name}
                                onChange={(e) =>
                                  updateParty(
                                    idx,
                                    "primaryContact.name",
                                    e.target.value
                                  )
                                }
                                placeholder="John Doe"
                                className="mt-1"
                                disabled={!isFieldEditable(contractStatus, "parties")}
                              />
                            </div>

                            <div>
                              <Label>Contact Title</Label>
                              <Input
                                value={party.primaryContact.title}
                                onChange={(e) =>
                                  updateParty(
                                    idx,
                                    "primaryContact.title",
                                    e.target.value
                                  )
                                }
                                placeholder="Director"
                                className="mt-1"
                                disabled={!isFieldEditable(contractStatus, "parties")}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={party.primaryContact.email}
                                onChange={(e) =>
                                  updateParty(
                                    idx,
                                    "primaryContact.email",
                                    e.target.value
                                  )
                                }
                                placeholder="john@example.com"
                                className="mt-1"
                                disabled={!isFieldEditable(contractStatus, "parties")}
                              />
                            </div>

                            <div>
                              <Label>Phone</Label>
                              <Input
                                value={party.primaryContact.phone}
                                onChange={(e) =>
                                  updateParty(
                                    idx,
                                    "primaryContact.phone",
                                    e.target.value
                                  )
                                }
                                placeholder="+1 (555) 000-0000"
                                className="mt-1"
                                disabled={!isFieldEditable(contractStatus, "parties")}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    onClick={addParty}
                    variant="outline"
                    className="w-full"
                    disabled={!isFieldEditable(contractStatus, "parties")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Add Another Party
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Pricing */}
            {currentStep === 3 && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Pricing & Financial Terms
                  </h3>
                  <p className="text-foreground/80 dark:text-muted-foreground">
                    Update the financial structure of the contract
                  </p>
                </div>

                {!isFieldEditable(contractStatus, "pricing") && (
                  <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-amber-800 dark:text-amber-300">
                      Pricing cannot be edited while the contract is pending
                      signature. Change status to draft to edit pricing.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>
                        Pricing Model{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.pricing.model}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, model: value },
                          })
                        }
                        disabled={!isFieldEditable(contractStatus, "pricing")}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="recurring">Recurring</SelectItem>
                          <SelectItem value="usage">Usage-based</SelectItem>
                          <SelectItem value="tiered">Tiered</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>
                        Currency <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.pricing.currency}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, currency: value },
                          })
                        }
                        disabled={!isFieldEditable(contractStatus, "pricing")}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="NGN">NGN (₦)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>
                      Base Amount{" "}
                      {formData.pricing.model === "fixed" && (
                        <span className="text-destructive">*</span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricing.baseAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            baseAmount: e.target.value,
                          },
                        })
                      }
                      placeholder="0.00"
                      className="mt-1"
                      disabled={!isFieldEditable(contractStatus, "pricing")}
                    />
                    {validationErrors.baseAmount && (
                      <p className="text-sm text-destructive mt-1">
                        {validationErrors.baseAmount}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Billing Cycle</Label>
                    <Select
                      value={formData.pricing.billingCycle}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, billingCycle: value },
                        })
                      }
                      disabled={!isFieldEditable(contractStatus, "pricing")}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-time">One-time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Payment Terms (Net Days)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.pricing.paymentTerms.netDays}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pricing: {
                              ...formData.pricing,
                              paymentTerms: {
                                ...formData.pricing.paymentTerms,
                                netDays: parseInt(e.target.value) || 0,
                              },
                            },
                          })
                        }
                        className="mt-1"
                        disabled={!isFieldEditable(contractStatus, "pricing")}
                      />
                    </div>

                    <div>
                      <Label>Early Payment Discount (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={
                          formData.pricing.paymentTerms.earlyPaymentDiscount
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pricing: {
                              ...formData.pricing,
                              paymentTerms: {
                                ...formData.pricing.paymentTerms,
                                earlyPaymentDiscount:
                                  parseFloat(e.target.value) || 0,
                              },
                            },
                          })
                        }
                        className="mt-1"
                        disabled={!isFieldEditable(contractStatus, "pricing")}
                      />
                    </div>

                    <div>
                      <Label>Late Payment Fee</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.pricing.paymentTerms.latePaymentFee}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pricing: {
                              ...formData.pricing,
                              paymentTerms: {
                                ...formData.pricing.paymentTerms,
                                latePaymentFee: parseFloat(e.target.value) || 0,
                              },
                            },
                          })
                        }
                        className="mt-1"
                        disabled={!isFieldEditable(contractStatus, "pricing")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Timeline */}
            {currentStep === 4 && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Contract Timeline
                  </h3>
                  <p className="text-foreground/80 dark:text-muted-foreground">
                    Update effective and expiration dates
                  </p>
                </div>

                {!isFieldEditable(contractStatus, "timeline") && (
                  <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-amber-800 dark:text-amber-300">
                      Timeline cannot be edited while the contract is pending
                      signature. Change status to draft to edit dates.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label>
                      Effective Date{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <DatePicker
                      value={formData.timeline.effectiveDate}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          timeline: {
                            ...formData.timeline,
                            effectiveDate: value,
                          },
                        })
                      }
                      placeholder="Select effective date"
                      className="mt-1"
                      disabled={!isFieldEditable(contractStatus, "timeline")}
                    />
                    {validationErrors.effectiveDate && (
                      <p className="text-sm text-destructive mt-1">
                        {validationErrors.effectiveDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Expiration Date</Label>
                    <DatePicker
                      value={formData.timeline.expirationDate}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          timeline: {
                            ...formData.timeline,
                            expirationDate: value,
                          },
                        })
                      }
                      placeholder="Select expiration date (optional)"
                      className="mt-1"
                      disabled={!isFieldEditable(contractStatus, "timeline")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Review & Confirm
                  </h3>
                  <p className="text-foreground/80 dark:text-muted-foreground">
                    Review all changes before updating the contract
                  </p>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-4">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-foreground/75 dark:text-muted-foreground">
                            Title:
                          </span>
                          <span className="font-medium">{formData.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/75 dark:text-muted-foreground">
                            Category:
                          </span>
                          <span className="font-medium capitalize">
                            {formData.category}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/75 dark:text-muted-foreground">
                            Priority:
                          </span>
                          <span className="font-medium capitalize">
                            {formData.priority}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-4">Parties</h4>
                      <div className="space-y-3">
                        {formData.parties
                          .filter((p) => p.organizationId)
                          .map((party, idx) => {
                            const org = organizations.find(
                              (o) => o._id === party.organizationId
                            );
                            return (
                              <div key={idx} className="text-sm">
                                <div className="font-medium">{org?.name}</div>
                                <div className="text-foreground/75 dark:text-muted-foreground capitalize">
                                  {party.role}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-4">Pricing</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-foreground/75 dark:text-muted-foreground">
                            Model:
                          </span>
                          <span className="font-medium capitalize">
                            {formData.pricing.model}
                          </span>
                        </div>
                        {formData.pricing.baseAmount && (
                          <div className="flex justify-between">
                            <span className="text-foreground/75 dark:text-muted-foreground">
                              Amount:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                parseFloat(formData.pricing.baseAmount) || 0,
                                formData.pricing.currency
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 sm:p-5 md:p-6 bg-secondary flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onClose : handleBack}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>

            {/* Progress indicators */}
            <div className="hidden sm:flex items-center gap-2">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx + 1 === currentStep
                      ? "w-8 bg-[#00B4D8]"
                      : idx + 1 < currentStep
                      ? "w-1.5 bg-emerald-500"
                      : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>

            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#00B4D8] hover:bg-[#0091B3] w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Update Contract
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-[#00B4D8] hover:bg-[#0091B3] w-full sm:w-auto"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditContractWizard;
