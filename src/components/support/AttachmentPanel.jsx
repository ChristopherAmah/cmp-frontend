import { useEffect, useRef, useState } from "react";
import { Download, File, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ticketService } from "@/services/ticketService";

const formatSize = (bytes) => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

const fileTypeLabel = (file) => {
  const extension = file.name?.split(".").pop();
  return extension ? extension.toUpperCase().slice(0, 5) : "FILE";
};

const AttachmentPanel = ({ ticketId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    ticketService
      .getAttachments(ticketId)
      .then(setFiles)
      .catch((loadError) =>
        setError(loadError.response?.data?.message || "Unable to load attachments."),
      )
      .finally(() => setLoading(false));
  }, [ticketId]);

  const uploadFiles = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selectedFiles.length) return;

    setUploading(true);
    setError("");
    try {
      const uploadedFiles = [];
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        uploadedFiles.push(await ticketService.uploadAttachment(ticketId, formData));
      }
      setFiles((current) => [...uploadedFiles.reverse(), ...current]);
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || "Unable to upload attachment.");
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (file) => {
    setDownloadingId(file.id);
    setError("");
    try {
      const blob = await ticketService.downloadAttachment(ticketId, file.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.response?.data?.message || "Unable to download attachment.");
    } finally {
      setDownloadingId("");
    }
  };

  return (
    <section className="absolute inset-x-0 bottom-0 top-[145px] z-10 overflow-y-auto bg-white px-4 py-5 dark:bg-slate-950 sm:px-6">
      <input ref={fileInput} type="file" multiple className="hidden" onChange={uploadFiles} />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{files.length} files</h3>
        <Button size="sm" onClick={() => fileInput.current?.click()} disabled={uploading} className="h-8 text-xs">
          <Plus className="mr-1 h-3.5 w-3.5" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">PDF, Office files, images, text, JSON, and ZIP up to 25MB.</p>
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="py-8 text-center text-xs text-muted-foreground">Loading attachments...</p>
        ) : files.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">No attachments yet.</p>
        ) : files.map((file) => (
          <article key={file.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-2.5 py-2.5">
            <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-[9px] font-semibold text-white")}>
              {fileTypeLabel(file)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {formatSize(file.size)} · {file.uploadedBy} · {formatDate(file.uploadedAt)}
              </p>
            </div>
            <Button type="button" size="icon" variant="ghost" aria-label={`Download ${file.name}`} onClick={() => downloadFile(file)} disabled={downloadingId === file.id}>
              {downloadingId === file.id ? <File className="h-4 w-4 animate-pulse" /> : <Download className="h-4 w-4" />}
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AttachmentPanel;
