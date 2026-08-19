import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FormField = ({ label, children }) => (
  <label className="block text-[11px] font-medium text-foreground">
    <span className="mb-1.5 block">{label}</span>
    {children}
  </label>
);
const TicketSelect = ({ label, value, placeholder, options, onChange }) => (
  <FormField label={label}>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option} className="text-xs">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </FormField>
);

const NewTicketDrawer = ({ onClose, onCreate, organizations = [], canSetSlaTarget = false }) => {
  const [form, setForm] = useState({
    title: "",
    organization: "",
    contract: "",
    product: "",
    module: "",
    channel: "",
    type: "",
    priority: "",
    slaTargetHours: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  const fields = [
    [
      "contract",
      "Related Contract (If Applicable)",
      "Select Related contract",
      ["LC-32423", "LC-32424"],
    ],
    [
      "product",
      "Product",
      "Select product",
      ["Contract Portal", "Mobile App", "API Platform"],
    ],
    [
      "type",
      "Ticket Type",
      "Select Ticket Type",
      ["Bug", "Incident", "Request"],
    ],
    [
      "priority",
      "Severity",
      "Select Severity",
      ["Critical", "High", "Medium", "Low"],
    ],
  ];

  const handleCreate = async () => {
    if (
      !form.title.trim() ||
      !form.organization.trim() ||
      !form.type ||
      !form.priority ||
      (canSetSlaTarget && (!form.slaTargetHours || Number(form.slaTargetHours) < 1))
    ) {
      setError(
        canSetSlaTarget
          ? "Enter the required ticket details and an SLA target of at least 1 hour."
          : "Enter a title and organization, then select the ticket type and severity.",
      );
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onCreate({
        ...form,
        title: form.title.trim(),
        organization: form.organization.trim(),
      });
      onClose();
    } catch (createError) {
      setError(
        createError.response?.data?.message ||
          "Unable to create the ticket. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[390px] flex-col border-l border-border bg-white shadow-2xl dark:bg-slate-950"
      aria-label="New support ticket"
    >
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              New Support Ticket
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Fill in the information to create a new support ticket.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 text-foreground hover:bg-secondary"
            aria-label="Close new ticket form"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          <FormField label="Title">
            <Input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Enter ticket title"
              className="h-9 text-xs"
            />
          </FormField>
          <TicketSelect
            label="Organization"
            value={form.organization}
            placeholder="Select organization"
            options={organizations.map((organization) => organization.name)}
            onChange={(value) => updateField("organization", value)}
          />
          {fields.slice(0, 2).map(([key, label, placeholder, options]) => (
            <TicketSelect
              key={key}
              label={label}
              value={form[key]}
              placeholder={placeholder}
              options={options}
              onChange={(value) => updateField(key, value)}
            />
          ))}
          <div className="grid grid-cols-2 gap-3">
            <TicketSelect
              label="Module"
              value={form.module}
              placeholder="Select Module"
              options={["Authentication", "Contracts", "Invoices"]}
              onChange={(value) => updateField("module", value)}
            />
            <TicketSelect
              label="Channel"
              value={form.channel}
              placeholder="Select Channel"
              options={["Web portal", "Email", "Phone"]}
              onChange={(value) => updateField("channel", value)}
            />
          </div>
          {fields.slice(2).map(([key, label, placeholder, options]) => (
            <TicketSelect
              key={key}
              label={label}
              value={form[key]}
              placeholder={placeholder}
              options={options}
              onChange={(value) => updateField(key, value)}
            />
          ))}
          {canSetSlaTarget && (
            <FormField label="SLA Target (hours)">
              <Input
                type="number"
                min="1"
                max="8760"
                value={form.slaTargetHours}
                onChange={(event) => updateField("slaTargetHours", event.target.value)}
                placeholder="Enter resolution target in hours"
                className="h-9 text-xs"
              />
            </FormField>
          )}
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Enter Ticket Description"
              className="min-h-[68px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </FormField>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border bg-slate-50 px-4 py-3 dark:bg-slate-900">
        <Button
          size="sm"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="h-8 text-xs"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={isSubmitting}
          className="h-8 text-xs"
        >
          {isSubmitting ? "Creating..." : "Done"}
        </Button>
      </div>
    </aside>
  );
};

export default NewTicketDrawer;