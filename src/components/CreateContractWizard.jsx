import { useEffect, useRef, useState } from "react";
import { contractServiceV3 } from "../services/contractServiceV3";
import { documentService } from "../services/documentService";
import { organizationService } from "../services/organizationService";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Check, FileUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EMPTY_FORM = {
  category: "",
  organizationName: "",
  title: "",
  effectiveDate: "",
  expirationDate: "",
  value: "",
  billingInformation: "",
  primaryContact: "",
  supportRequestLimit: "",
  coverageType: "",
  slaPackage: "",
};

const CreateContractWizard = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [step, setStep] = useState("category");
  const [createdContractId, setCreatedContractId] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setFormData(EMPTY_FORM);
    setStep("category");
    setCreatedContractId(null);
    setFiles([]);
    setError("");

    organizationService
      .getAll()
      .then((response) => {
        if (response?.status === "success") setOrganizations(response.data || []);
      })
      .catch(() => setError("Unable to load organizations. Please try again."));
  }, [isOpen]);

  if (!isOpen) return null;

  const isAtsContract = formData.category === "support";
  const updateField = (field, value) => {
    setError("");
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const getOrganization = () =>
    organizations.find(
      (organization) =>
        organization.name?.trim().toLowerCase() ===
        formData.organizationName.trim().toLowerCase(),
    );

  const proceedFromCategory = () => {
    if (!formData.category) {
      setError("Select a contract category to continue.");
      return;
    }
    setError("");
    setStep("details");
  };

  const createContract = async () => {
    const organization = getOrganization();
    if (!formData.title.trim() || !formData.effectiveDate || !organization) {
      setError(
        !organization && formData.organizationName
          ? "Choose an organization from the available organization names."
          : "Complete the organization, contract name, and effective date to continue.",
      );
      return;
    }
    if (isAtsContract && (!formData.coverageType || !formData.slaPackage)) {
      setError("Select a coverage type and SLA package for the ATS contract.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await contractServiceV3.create({
        title: formData.title.trim(),
        category: formData.category,
        description: formData.billingInformation || undefined,
        tags: [isAtsContract ? "ATS" : "License"],
        parties: [{
          organizationId: organization._id,
          role: "client",
          primaryContact: formData.primaryContact.trim()
            ? { name: formData.primaryContact.trim() }
            : undefined,
        }],
        pricing: {
          model: "fixed",
          currency: "NGN",
          baseAmount: Number(formData.value) || 0,
          billingCycle: "custom",
          renewalTerms: { autoRenew: false, noticePeriodDays: 30, renewalType: "manual" },
          paymentTerms: { netDays: 30, earlyPaymentDiscount: 0, latePaymentFee: 0 },
        },
        timeline: {
          effectiveDate: formData.effectiveDate,
          expirationDate: formData.expirationDate || undefined,
        },
        customFields: {
          billingInformation: formData.billingInformation || undefined,
          supportRequestLimit: isAtsContract ? formData.supportRequestLimit || undefined : undefined,
          coverageType: isAtsContract ? formData.coverageType : undefined,
          slaPackage: isAtsContract ? formData.slaPackage : undefined,
        },
      });
      if (response?.status !== "success" || !response.data?._id) {
        throw new Error(response?.message || "Failed to create the contract.");
      }
      setCreatedContractId(response.data._id);
      setStep("upload");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Failed to create the contract.");
    } finally {
      setLoading(false);
    }
  };

  const selectFiles = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles || []).filter(
      (file) => file.type === "application/pdf" && file.size <= 50 * 1024 * 1024,
    );
    if (validFiles.length !== (selectedFiles?.length || 0)) {
      setError("Only PDF documents up to 50MB can be uploaded.");
    } else {
      setError("");
    }
    setFiles(validFiles);
  };

  const saveDocuments = async () => {
    const organization = getOrganization();
    if (!files.length) {
      setError("Select at least one contract document to upload.");
      return;
    }
    if (!organization || !createdContractId) {
      setError("The contract details are unavailable. Please start again.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await Promise.all(files.map((file) => {
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("documentName", file.name);
        uploadData.append("documentType", "Contract");
        uploadData.append("contractId", createdContractId);
        uploadData.append("startDate", formData.effectiveDate);
        if (formData.expirationDate) uploadData.append("expiryDate", formData.expirationDate);
        return documentService.upload(organization._id, uploadData);
      }));
      setStep("success");
      toast({ title: "Documents uploaded", description: "Your contract documents are now available.", variant: "success" });
      onSuccess?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "The contract was created, but its document upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-6">
      <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl sm:max-h-[calc(100vh-3rem)]" role="dialog" aria-modal="true" aria-labelledby="contract-dialog-title">
        {step === "success" ? <SuccessStep onClose={onClose} /> : step === "upload" ? (
          <UploadStep error={error} files={files} fileInputRef={fileInputRef} loading={loading} onClose={onClose} onFilesSelected={selectFiles} onSubmit={saveDocuments} />
        ) : step === "category" ? (
          <CategoryStep error={error} formData={formData} loading={loading} onClose={onClose} onProceed={proceedFromCategory} onUpdate={updateField} />
        ) : (
          <DetailsStep error={error} formData={formData} isAtsContract={isAtsContract} loading={loading} organizations={organizations} onClose={onClose} onSubmit={createContract} onUpdate={updateField} />
        )}
      </section>
    </div>
  );
};

const ModalHeader = ({ children, onClose, title, subtitle, divider = false }) => <header className={`relative px-5 pt-5 ${divider ? "border-b border-cyan-300 pb-4" : "pb-3"}`}><button type="button" onClick={onClose} aria-label="Close dialog" className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:bg-secondary"><X className="h-3.5 w-3.5" /></button><h2 id="contract-dialog-title" className="text-base font-semibold text-foreground">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>{children}</header>;
const Field = ({ label, children }) => <div><Label className="mb-2 block text-[10px] font-medium text-foreground">{label}</Label>{children}</div>;
const ErrorMessage = ({ error }) => error ? <Alert variant="destructive" className="py-2"><AlertDescription className="text-xs">{error}</AlertDescription></Alert> : null;
const Footer = ({ children }) => <footer className="flex justify-end gap-2 border-t border-border bg-secondary/70 px-5 py-3">{children}</footer>;

const CategorySelect = ({ value, onValueChange }) => <Select value={value} onValueChange={onValueChange}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select contract category" /></SelectTrigger><SelectContent><SelectItem value="license">License Contract</SelectItem><SelectItem value="support">ATS Contract</SelectItem></SelectContent></Select>;

const CategoryStep = ({ error, formData, loading, onClose, onProceed, onUpdate }) => <><ModalHeader onClose={onClose} title="New Contract" subtitle="Fill in the required information to add a new contract." /><div className="px-5 pb-6"><Field label="Contract Category"><CategorySelect value={formData.category} onValueChange={(value) => onUpdate("category", value)} /></Field><div className="mt-4"><ErrorMessage error={error} /></div></div><Footer><Button size="sm" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={onProceed} disabled={loading} className="bg-cyan-500 hover:bg-cyan-600">Proceed</Button></Footer></>;

const DetailsStep = ({ error, formData, isAtsContract, loading, organizations, onClose, onSubmit, onUpdate }) => <><ModalHeader onClose={onClose} title="New Contract" subtitle="Fill in the required information to add a new contract." /><div className="flex-1 overflow-y-auto px-5 pb-5"><div className="space-y-3"><Field label="Contract Category"><CategorySelect value={formData.category} onValueChange={(value) => onUpdate("category", value)} /></Field><div className="border-t border-cyan-300" /><Field label="Organization Name"><Input className="h-8 text-xs" value={formData.organizationName} onChange={(event) => onUpdate("organizationName", event.target.value)} placeholder="Enter Organization Name" list="contract-organizations" /><datalist id="contract-organizations">{organizations.map((organization) => <option key={organization._id} value={organization.name} />)}</datalist></Field><Field label="Contract Name"><Input className="h-8 text-xs" value={formData.title} onChange={(event) => onUpdate("title", event.target.value)} placeholder="Enter contract name" /></Field><div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2"><Field label="Effective Date"><Input className="h-8 text-xs" type="date" value={formData.effectiveDate} onChange={(event) => onUpdate("effectiveDate", event.target.value)} /></Field><Field label="Expiration Date"><Input className="h-8 text-xs" type="date" value={formData.expirationDate} onChange={(event) => onUpdate("expirationDate", event.target.value)} /></Field></div><Field label="Contract Value"><Input className="h-8 text-xs" type="number" min="0" value={formData.value} onChange={(event) => onUpdate("value", event.target.value)} placeholder="Enter Value" /></Field>{isAtsContract ? <><Field label="Support Request Limit"><Input className="h-8 text-xs" type="number" min="0" value={formData.supportRequestLimit} onChange={(event) => onUpdate("supportRequestLimit", event.target.value)} placeholder="Input" /></Field><div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2"><Field label="Coverage Type"><Select value={formData.coverageType} onValueChange={(value) => onUpdate("coverageType", value)}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select coverage type" /></SelectTrigger><SelectContent><SelectItem value="business-hours">Business Hours</SelectItem><SelectItem value="24-7">24/7</SelectItem></SelectContent></Select></Field><Field label="SLA Package"><Select value={formData.slaPackage} onValueChange={(value) => onUpdate("slaPackage", value)}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select SLA Package" /></SelectTrigger><SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select></Field></div></> : <Field label="Billing Information"><Input className="h-8 text-xs" value={formData.billingInformation} onChange={(event) => onUpdate("billingInformation", event.target.value)} placeholder="Input" /></Field>}<Field label="Primary Contact"><Input className="h-8 text-xs" value={formData.primaryContact} onChange={(event) => onUpdate("primaryContact", event.target.value)} placeholder="Enter primary contact" /></Field><ErrorMessage error={error} /></div></div><Footer><Button size="sm" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={onSubmit} disabled={loading} className="bg-cyan-500 hover:bg-cyan-600">{loading ? "Saving..." : isAtsContract ? "Next" : "Submit"}</Button></Footer></>;

const UploadStep = ({ error, files, fileInputRef, loading, onClose, onFilesSelected, onSubmit }) => <><ModalHeader onClose={onClose} title="Upload Contract Document" subtitle="Upload your contract document to add it to the system." divider /><div className="p-5"><input ref={fileInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(event) => onFilesSelected(event.target.files)} /><button type="button" onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onFilesSelected(event.dataTransfer.files); }} className="flex min-h-36 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border px-5 text-center hover:border-cyan-400 hover:bg-cyan-50/30"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600"><FileUp className="h-6 w-6" /></span><span className="mt-3 text-xs font-medium text-foreground">Drop your files here or <span className="text-cyan-600">browse</span></span><span className="mt-1 text-[10px] text-muted-foreground">Maximum size: 50MB</span></button>{files.length > 0 && <p className="mt-3 truncate text-xs text-muted-foreground">{files.map((file) => file.name).join(", ")}</p>}<div className="mt-3"><ErrorMessage error={error} /></div></div><Footer><Button size="sm" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={onSubmit} disabled={loading} className="bg-cyan-500 hover:bg-cyan-600">{loading ? "Uploading..." : "Submit"}</Button></Footer></>;

const SuccessStep = ({ onClose }) => <div className="relative px-7 py-8 text-center"><button type="button" onClick={onClose} aria-label="Close dialog" className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:bg-secondary"><X className="h-3.5 w-3.5" /></button><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-200 bg-emerald-500 text-white"><Check className="h-11 w-11" strokeWidth={3} /></span><h2 id="contract-dialog-title" className="mt-6 text-lg font-semibold leading-tight text-foreground">Documents Uploaded<br />Successfully</h2><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Your documents have been uploaded and are now available in the contract record. You can review them, upload additional files.</p></div>;

export default CreateContractWizard;
