import { useEffect, useState } from "react";
import { Check, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ticketService } from "@/services/ticketService";
import { userService } from "@/services/userService";
import { Button } from "@/components/ui/button";

const TaskPanel = ({ ticketId }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [error, setError] = useState("");
  const canCreate = ["admin", "super_admin", "support_lead"].includes(user?.role);
  const completed = tasks.filter((task) => task.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  useEffect(() => {
    setLoading(true);
    setError("");
    ticketService.getTasks(ticketId)
      .then(setTasks)
      .catch((loadError) => setError(loadError.response?.data?.message || "Unable to load tasks."))
      .finally(() => setLoading(false));
    if (canCreate) {
      userService.getDevelopers().then(setDevelopers).catch(() => setDevelopers([]));
    }
  }, [ticketId, canCreate]);

  const createTask = async () => {
    if (!title.trim() || !assignee) return;
    setSubmitting(true);
    setError("");
    try {
      const created = await ticketService.createTask(ticketId, { title: title.trim(), note: note.trim(), assignee });
      setTasks((current) => [...current, created]);
      setTitle("");
      setNote("");
      setAssignee("");
    } catch (createError) {
      setError(createError.response?.data?.message || "Unable to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTask = async (task) => {
    setUpdatingTaskId(task.id);
    setError("");
    try {
      const updated = await ticketService.updateTask(ticketId, task.id, { done: !task.done });
      setTasks((current) => current.map((currentTask) => currentTask.id === updated.id ? updated : currentTask));
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Unable to update task.");
    } finally {
      setUpdatingTaskId("");
    }
  };

  return (
    <section className="absolute inset-x-0 bottom-0 top-[145px] z-10 overflow-y-auto bg-white px-4 py-4 dark:bg-slate-950 sm:px-6">
      <div className="max-w-md">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-foreground">
            {completed} / {tasks.length} tasks done
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-foreground">
            {progress}%
          </span>
        </div>
        {canCreate && (
          <div className="mt-5 space-y-2 rounded-xl border border-border bg-card p-3">
            <p className="text-xs font-semibold text-foreground">Create task</p>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" className="w-full rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950" />
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note" className="min-h-16 w-full resize-none rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950" />
            <select value={assignee} onChange={(event) => setAssignee(event.target.value)} className="w-full rounded-md border border-input bg-white px-2.5 py-2 text-xs dark:bg-slate-950">
              <option value="">Assign to developer</option>
              {developers.map((developer) => <option key={developer._id} value={developer.name}>{developer.name}</option>)}
            </select>
            <div className="flex justify-end"><Button size="sm" onClick={createTask} disabled={submitting || !title.trim() || !assignee}>{submitting ? "Creating..." : "Create task"}</Button></div>
          </div>
        )}
        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
        <div className="mt-5 space-y-4">
          {loading ? <p className="text-xs text-muted-foreground">Loading tasks...</p> : tasks.length === 0 ? <p className="text-xs text-muted-foreground">No tasks have been created for this ticket.</p> : tasks.map((task) => (
            <div key={task.id} className="flex gap-3">
              <button
                type="button"
                onClick={() => toggleTask(task)}
                disabled={updatingTaskId === task.id}
                aria-label={`${task.done ? "Mark incomplete" : "Mark complete"}: ${task.title}`}
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  task.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-slate-400 bg-transparent",
                )}
              >
                <Check className={cn("h-3 w-3", !task.done && "invisible")} />
              </button>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs",
                    task.done
                      ? "text-muted-foreground line-through"
                      : "font-medium text-foreground",
                  )}
                >
                  {task.title}
                </p>
                {task.note && <p className="mt-1 text-[10px] text-muted-foreground">{task.note}</p>}
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <UserRound className="h-2.5 w-2.5" />
                  {task.assignee}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TaskPanel;
