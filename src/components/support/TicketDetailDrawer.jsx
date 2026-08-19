import { createElement, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TaskPanel from "./TaskPanel";
import TimePanel from "./TimePanel";
import AttachmentPanel from "./AttachmentPanel";
import { ticketService } from "@/services/ticketService";
import { userService } from "@/services/userService";
import {
  X,
  Grid2X2,
  MessageSquare,
  ClipboardCheck,
  Clock,
  Paperclip,
  ExternalLink,
  Pencil,
  CheckCircle2,
  TriangleAlert,
  UserRound,
  Send,
} from "lucide-react";

const priorityStyles = {
  Critical: "border-red-200 text-red-600 bg-red-50",
  High: "border-orange-200 text-orange-600 bg-orange-50",
  Medium: "border-amber-200 text-amber-600 bg-amber-50",
  Low: "border-border text-muted-foreground bg-secondary",
};
const statusStyles = {
  Open: "border-sky-200 text-sky-600 bg-sky-50",
  "In Progress": "border-indigo-200 text-indigo-600 bg-indigo-50",
  Resolved: "border-emerald-200 text-emerald-600 bg-emerald-50",
  Closed: "border-border text-muted-foreground bg-secondary",
};
const targets = { Critical: 4, High: 8, Medium: 24, Low: 72 };
const Pill = ({ className, children }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
      className,
    )}
  >
    {children}
  </span>
);
const Card = ({ title, children }) => (
  <section className="rounded-xl border border-border bg-card p-3">
    <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {title}
    </h3>
    {children}
  </section>
);

const TicketDetailDrawer = ({ ticket, onClose, onTicketUpdated }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState("Details");
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [developers, setDevelopers] = useState([]);
  const [assigningDeveloper, setAssigningDeveloper] = useState(false);
  const [selectedDevelopers, setSelectedDevelopers] = useState([]);
  const [assignmentError, setAssignmentError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({});
  const targetHours = targets[ticket.priority] || 72;
  const elapsed = Math.max(
    0,
    Date.now() - new Date(ticket.createdAt || ticket.created).getTime(),
  );
  const progress = Math.min(
    100,
    Math.round((elapsed / (targetHours * 3600000)) * 100),
  );
  const resolved = ["Resolved", "Closed"].includes(ticket.status);
  const slaState = resolved
    ? "Resolved"
    : progress >= 100
      ? "Breached"
      : progress >= 75
        ? "At Risk"
        : "Compliant";
  const slaColor =
    slaState === "Breached"
      ? "bg-red-500"
      : slaState === "At Risk"
        ? "bg-amber-500"
        : slaState === "Resolved"
          ? "bg-slate-300"
          : "bg-emerald-500";
  const canManage = ["admin", "super_admin", "support_lead"].includes(user?.role);
  const tabs = [
    ["Details", Grid2X2],
    ["Comments", MessageSquare],
    ["Tasks", ClipboardCheck],
    // ["Time", Clock],
    ["Attachments", Paperclip],
  ];
  const info = [
    ["Type", ticket.type],
    ["Created", ticket.created],
    ["Product", ticket.product || "—"],
    ["Module", ticket.module || "—"],
    ["Channel", ticket.channel || "—"],
  ];
  const canComment = ["admin", "super_admin", "support_lead", "developer"].includes(user?.role);
  const assignedDevelopers = Array.isArray(ticket.assignedTo)
    ? ticket.assignedTo
    : ticket.assignedTo
      ? [ticket.assignedTo]
      : [];

  const assignmentChanged =
    selectedDevelopers.length !== assignedDevelopers.length ||
    selectedDevelopers.some((developer) => !assignedDevelopers.includes(developer));

  useEffect(() => {
    const savedDevelopers = Array.isArray(ticket.assignedTo)
      ? ticket.assignedTo
      : ticket.assignedTo
        ? [ticket.assignedTo]
        : [];
    setSelectedDevelopers(savedDevelopers);
  }, [ticket.id, ticket.assignedTo]);

  useEffect(() => {
    setEditForm({
      subject: ticket.subject || "",
      description: ticket.description || "",
      priority: ticket.priority || "Low",
      status: ticket.status || "Open",
      customer: ticket.customer || "",
      type: ticket.type || ticket.category || "",
      product: ticket.product || "",
      module: ticket.module || "",
      channel: ticket.channel || "",
      contract: ticket.contract || "",
    });
  }, [ticket]);

  useEffect(() => {
    ticketService
      .getComments(ticket.id)
      .then(setComments)
      .catch(() => setCommentError("Unable to load comments."));

    userService
      .getDevelopers()
      .then((developerList) => setDevelopers(developerList))
      .catch(() => setDevelopers([]));
  }, [ticket.id]);

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    setCommentError("");
    try {
      const created = await ticketService.createComment(ticket.id, commentText.trim());
      setComments((current) => [...current, created]);
      setCommentText("");
    } catch (error) {
      setCommentError(error.response?.data?.message || "Unable to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const toggleDeveloper = (developerName) => {
    setSelectedDevelopers((current) =>
      current.includes(developerName)
        ? current.filter((name) => name !== developerName)
        : [...current, developerName],
    );
    setAssignmentError("");
  };

  const handleAssignDevelopers = async () => {
    setAssigningDeveloper(true);
    setAssignmentError("");
    try {
      const updated = await ticketService.updateTicket(ticket.id, {
        assignedTo: selectedDevelopers,
      });
      onTicketUpdated?.(updated);
    } catch (error) {
      setAssignmentError(
        error.response?.data?.message || "Unable to assign developers.",
      );
    } finally {
      setAssigningDeveloper(false);
    }
  };

  const handleEditSave = async () => {
    setSavingEdit(true);
    setEditError("");
    try {
      const updated = await ticketService.updateTicket(ticket.id, editForm);
      onTicketUpdated?.(updated);
      setIsEditing(false);
    } catch (error) {
      setEditError(error.response?.data?.message || "Unable to update ticket.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCloseTicket = async () => {
    try {
      const updated = await ticketService.updateTicket(ticket.id, {
        status: "Closed",
      });
      onTicketUpdated?.(updated);
    } catch (error) {
      console.error("Unable to close ticket", error);
    }
  };

  const handleEscalate = () => {
    const defaultEmail = "support@company.com";
    const recipient = window.prompt(
      "Enter the email address to escalate this ticket:",
      defaultEmail,
    );

    if (!recipient) return;

    const subject = encodeURIComponent(`Escalation: ${ticket.subject} (${ticket.id})`);
    const body = encodeURIComponent(
      `Hello,\n\nThis ticket needs escalation.\n\nTicket ID: ${ticket.id}\nSubject: ${ticket.subject}\nPriority: ${ticket.priority}\nStatus: ${ticket.status}\nCustomer: ${ticket.customer || "—"}\n\nPlease review and advise.`,
    );

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[590px] flex-col border-l border-border bg-white shadow-2xl dark:bg-slate-950">
      <div className="relative flex-1 overflow-y-auto">
        <header className="px-4 pt-4 sm:px-6">
          <div className="flex justify-between gap-3">
            <div>
              <div className="flex gap-2 text-xs">
                <span className="text-muted-foreground">{ticket.id}</span>
                <Pill className={statusStyles[ticket.status]}>
                  {ticket.status}
                </Pill>
                <Pill className={priorityStyles[ticket.priority]}>
                  {ticket.priority}
                </Pill>
              </div>
              <h2 className="mt-2 text-lg font-semibold">{ticket.subject}</h2>
            </div>
            <button onClick={onClose} className="rounded ">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <nav className="mt-4 flex overflow-x-auto border-b border-border px-4 sm:px-6">
          {tabs.map(([label, TabIcon]) => (
            <button
              key={label}
              onClick={() => setTab(label)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium",
                tab === label
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground",
              )}
            >
              {createElement(TabIcon, { className: "h-3.5 w-3.5" })}
              {label}
            </button>
          ))}
        </nav>
        {tab === "Details" && (
          <div className="space-y-3 px-4 py-4 sm:px-6">
            {isEditing && (
              <Card title="Edit ticket details">
                <div className="space-y-3">
                  <input value={editForm.subject || ""} onChange={(event) => setEditForm({ ...editForm, subject: event.target.value })} placeholder="Subject" className="w-full rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950" />
                  <textarea value={editForm.description || ""} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} placeholder="Description" className="min-h-20 w-full resize-none rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={editForm.type || ""} onChange={(event) => setEditForm({ ...editForm, type: event.target.value })} className="rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950">
                      <option value="">Ticket type</option>
                      {['Bug', 'Incident', 'Request'].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                    <select value={editForm.priority || ""} onChange={(event) => setEditForm({ ...editForm, priority: event.target.value })} className="rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950">
                      {['Critical', 'High', 'Medium', 'Low'].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                    <select value={editForm.status || ""} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })} className="rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950">
                      {['Open', 'In Progress', 'Resolved', 'Closed'].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                    <input value={editForm.customer || ""} onChange={(event) => setEditForm({ ...editForm, customer: event.target.value })} placeholder="Customer" className="rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950" />
                    <input value={editForm.product || ""} onChange={(event) => setEditForm({ ...editForm, product: event.target.value })} placeholder="Product" className="rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950" />
                    <input value={editForm.module || ""} onChange={(event) => setEditForm({ ...editForm, module: event.target.value })} placeholder="Module" className="rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950" />
                    <input value={editForm.channel || ""} onChange={(event) => setEditForm({ ...editForm, channel: event.target.value })} placeholder="Channel" className="rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950" />
                    <input value={editForm.contract || ""} onChange={(event) => setEditForm({ ...editForm, contract: event.target.value })} placeholder="Contract" className="rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950" />
                  </div>
                  {editError && <p className="text-xs text-destructive">{editError}</p>}
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={savingEdit}>Cancel</Button>
                    <Button size="sm" onClick={handleEditSave} disabled={savingEdit || !editForm.subject?.trim()}> {savingEdit ? "Saving..." : "Save changes"}</Button>
                  </div>
                </div>
              </Card>
            )}
            <section className="rounded-xl bg-secondary/60 p-3">
              <h3 className="text-[10px] font-semibold uppercase text-muted-foreground">
                Description
              </h3>
              <p className="mt-2 text-xs leading-relaxed">
                {ticket.description ||
                  `${ticket.subject} is affecting ${ticket.customer}.`}
              </p>
            </section>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card title="Ticket info">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {info.map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-foreground">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="Status SLA">
                <Pill className={statusStyles[ticket.status]}>
                  {ticket.status}
                </Pill>
                <p className="mt-3 text-[10px] text-muted-foreground">
                  Resolution SLA · {targetHours}h
                </p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full", slaColor)}
                    style={{ width: `${resolved ? 100 : progress}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px]">
                  <span className="text-muted-foreground">
                    {resolved ? "100" : progress}% elapsed
                  </span>
                  <span
                    className={cn(
                      slaState === "Breached"
                        ? "text-red-500"
                        : slaState === "At Risk"
                          ? "text-amber-500"
                          : slaState === "Compliant"
                            ? "text-emerald-600"
                            : "text-muted-foreground",
                    )}
                  >
                    {slaState}
                  </span>
                </div>
              </Card>
              <Card title="Organization">
                <p className="text-xs font-medium">{ticket.customer}</p>
                <button className="mt-3 inline-flex items-center gap-1 text-[10px] text-primary">
                  <ExternalLink className="h-3 w-3" />
                  View profile
                </button>
              </Card>
              <Card title="Contract">
                <p className="text-xs">
                  Reference ID: {ticket.contract || "—"}
                </p>
                <p className="mt-1 text-xs">
                  Category: {ticket.category || "—"}
                </p>
              </Card>
            </div>
            <Card title="Assigned developers">
              <div className="space-y-3">
                <div className="grid gap-2">
                  {developers.map((developer) => (
                    <button
                      key={developer._id}
                      type="button"
                      onClick={() => toggleDeveloper(developer.name)}
                      disabled={assigningDeveloper}
                      aria-pressed={selectedDevelopers.includes(developer.name)}
                      className={cn(
                        "flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors",
                        selectedDevelopers.includes(developer.name)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-white text-foreground hover:bg-secondary dark:bg-slate-950",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <UserRound className="h-3.5 w-3.5" />
                        <span>
                          <span className="block font-medium">{developer.name}</span>
                          <span className="block text-[10px] text-muted-foreground">{developer.email}</span>
                        </span>
                      </span>
                      <span className="text-[10px] font-semibold">
                        {selectedDevelopers.includes(developer.name) ? "Selected" : "Select"}
                      </span>
                    </button>
                  ))}
                </div>
                {developers.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">No developers are available.</p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] text-muted-foreground">
                    {selectedDevelopers.length ? `${selectedDevelopers.length} selected` : "No developers selected"}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleAssignDevelopers}
                    disabled={assigningDeveloper || !assignmentChanged}
                  >
                    {assigningDeveloper ? "Assigning..." : "Assign developers"}
                  </Button>
                </div>
                {assignmentError && <p className="text-xs text-destructive">{assignmentError}</p>}
                <p className="text-[10px] text-muted-foreground">
                  {assignedDevelopers.length ? assignedDevelopers.join(", ") : "Unassigned"}
                </p>
              </div>
            </Card>
          </div>
        )}
        {tab === "Comments" && <section className="flex min-h-[calc(100vh-220px)] flex-col"><div className="flex-1 divide-y divide-border">{commentError && <p className="px-6 py-3 text-sm text-destructive">{commentError}</p>}{comments.length === 0 && !commentError ? <p className="px-6 py-10 text-sm text-muted-foreground">No comments yet.</p> : comments.map((comment) => <article key={comment.id} className="flex gap-3 px-5 py-4 sm:px-6"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{comment.author.name.split(" ").map((name) => name[0]).join("").slice(0, 2)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-foreground">{comment.author.name}</p><span className="text-xs text-muted-foreground">{comment.author.role === "developer" ? "Developer" : "Admin"}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{comment.body}</p></div><time className="shrink-0 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(comment.createdAt))}</time></article>)}</div><div className="border-t border-border bg-slate-50 p-4 dark:bg-slate-900">{canComment ? <><textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Write a comment" className="min-h-28 w-full resize-none rounded-md border border-input bg-white p-3 text-sm dark:bg-slate-950"/><div className="mt-3 flex justify-end"><Button size="sm" disabled={submittingComment || !commentText.trim()} onClick={submitComment}><Send className="mr-1.5 h-3.5 w-3.5"/>{submittingComment ? "Sending..." : "Send"}</Button></div></> : <p className="text-sm text-muted-foreground">Only administrators and developers can post comments.</p>}</div></section>}
        {tab === "Tasks" && <TaskPanel ticketId={ticket.id} />}
        {/* {tab === "Time" && <TimePanel />} */}
        {tab === "Attachments" && <AttachmentPanel ticketId={ticket.id} />}
      </div>
      <footer className="flex items-center justify-between border-t border-border p-4">
        <div className="flex gap-2">
          <Button size="sm" className="h-8 text-xs" onClick={handleCloseTicket}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Mark Resolved
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleEscalate}>
            <TriangleAlert className="mr-1 h-3.5 w-3.5" />
            Escalate
          </Button>
        </div>
        {canManage && (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setEditError(""); setIsEditing((current) => !current); }}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </footer>
    </aside>
  );
};

export default TicketDetailDrawer;
