import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { organizationService } from "../services/organizationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  {
    id: 1,
    title: "Organization Details",
    icon: Building2,
    description: "Name, type & description",
  },
  {
    id: 2,
    title: "Review",
    icon: CheckCircle2,
    description: "Confirm & create",
  },
];

const CreateOrganizationWizard = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    organizationType: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setCurrentStep(1);
      setError("");
      setValidationErrors({});
      setFormData({
        name: "",
        organizationType: "",
        description: "",
      });
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setError("");
  };

  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      if (!formData.name?.trim()) {
        errors.name = "Organization name is required";
      }
      if (!formData.organizationType?.trim()) {
        errors.organizationType = "Organization type is required";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep(1)) {
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    setError("");
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await organizationService.create(formData);

      if (response?.status === "success" && response.data?._id) {
        const organizationId = response.data._id;
        toast({
          title: "Success",
          description: "Organization created successfully.",
          variant: "success",
        });
        onClose();
        // Navigate to the newly created organization's detail page
        // This follows the "Create → View → Continue" UX pattern
        navigate(`/organization/${organizationId}`);
        // Call onSuccess after navigation for any additional cleanup
        onSuccess?.();
      } else {
        throw new Error(response.message || "Failed to create organization.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create organization. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isLastStep = currentStep === STEPS.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="absolute right-0 top-0 h-full w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#00B4D8] to-[#0091B3] flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Create New Organization
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

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar - Hidden on mobile, shown on tablet+ */}
          <div className="hidden md:flex w-full md:w-64 lg:w-72 border-r border-border bg-secondary p-4 md:p-6 overflow-y-auto flex-shrink-0">
            <div className="space-y-2">
              {STEPS.map((step, idx) => {
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

          {/* Main Content - Responsive */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step 1: Organization Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Organization Information
                    </h3>
                    <p className="text-foreground/80 dark:text-muted-foreground">
                      Provide basic information about the organization
                    </p>
                  </div>

                  <Card>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground">
                          Organization Name{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          placeholder="Enter organization name"
                          disabled={loading}
                          className={
                            validationErrors.name
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {validationErrors.name && (
                          <p className="text-sm text-destructive">
                            {validationErrors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="organizationType" className="text-foreground">
                          Organization Type{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="organizationType"
                          type="text"
                          value={formData.organizationType}
                          onChange={(e) =>
                            handleChange("organizationType", e.target.value)
                          }
                          placeholder="e.g., Client, Partner, Vendor"
                          disabled={loading}
                          className={
                            validationErrors.organizationType
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {validationErrors.organizationType && (
                          <p className="text-sm text-destructive">
                            {validationErrors.organizationType}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Specify the type of organization (e.g., Client, Partner,
                          Vendor)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-foreground">
                          Description <span className="text-muted-foreground">(Optional)</span>
                        </Label>
                        <Textarea
                          id="description"
                          rows={4}
                          value={formData.description}
                          onChange={(e) =>
                            handleChange("description", e.target.value)
                          }
                          placeholder="Enter organization description"
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                          Add any additional information about this organization
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 2: Review */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Review Organization Details
                    </h3>
                    <p className="text-foreground/80 dark:text-muted-foreground">
                      Please review the information before creating the organization
                    </p>
                  </div>

                  <Card>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Organization Name
                          </Label>
                          <p className="text-base font-medium text-foreground mt-1">
                            {formData.name || "—"}
                          </p>
                        </div>

                        <div className="border-t border-border pt-4">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Organization Type
                          </Label>
                          <p className="text-base font-medium text-foreground mt-1">
                            {formData.organizationType || "—"}
                          </p>
                        </div>

                        {formData.description && (
                          <div className="border-t border-border pt-4">
                            <Label className="text-sm font-medium text-muted-foreground">
                              Description
                            </Label>
                            <p className="text-base text-foreground mt-1 whitespace-pre-wrap">
                              {formData.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Once created, you can add contracts and documents to this
                      organization.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Responsive */}
        <div className="border-t border-border bg-secondary p-4 sm:p-5 md:p-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onClose : handleBack}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {currentStep === 1 ? (
                "Cancel"
              ) : (
                <>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </>
              )}
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isLastStep ? (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-[#00B4D8] hover:bg-[#0091B3] w-full sm:w-auto"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-[#00B4D8] hover:bg-[#0091B3] w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Create Organization
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganizationWizard;
