import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INITIAL_FILES = [
  {
    name: "error_logs_nov12.json",
    type: "JSON",
    color: "bg-amber-500",
    date: "Nov 12",
  },
  {
    name: "error_logs_nov12.zip",
    type: "ZIP",
    color: "bg-slate-500",
    date: "Nov 12",
  },
  {
    name: "error_logs_nov12.pdf",
    type: "PDF",
    color: "bg-red-500",
    date: "Nov 10",
  },
  {
    name: "error_logs_nov12.json",
    type: "JSON",
    color: "bg-slate-500",
    date: "Nov 12",
  },
];

const AttachmentPanel = () => {
  const [files, setFiles] = useState(INITIAL_FILES);
  const fileInput = useRef(null);
  const uploadFiles = (event) => {
    const added = Array.from(event.target.files || []).map((file) => ({
      name: file.name,
      type: file.name.split(".").pop()?.toUpperCase() || "FILE",
      color: "bg-primary",
      date: "Today",
    }));
    setFiles((current) => [...current, ...added]);
    event.target.value = "";
  };

  return (
    <section className="absolute inset-x-0 bottom-0 top-[145px] z-10 overflow-y-auto bg-white px-4 py-5 dark:bg-slate-950 sm:px-6">
      <input
        ref={fileInput}
        type="file"
        multiple
        className="hidden"
        onChange={uploadFiles}
      />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {files.length} files
        </h3>
        <Button
          size="sm"
          onClick={() => fileInput.current?.click()}
          className="h-8 text-xs"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Upload
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {files.map((file, index) => (
          <article
            key={`${file.name}-${index}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-2.5 py-2.5"
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[9px] font-semibold text-white",
                file.color,
              )}
            >
              {file.type}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">
                {file.name}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                4.2 MB · Jerome Bellingham · {file.date}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AttachmentPanel;
