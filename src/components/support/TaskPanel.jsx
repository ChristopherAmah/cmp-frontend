import { useState } from "react";
import { Check, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_TASKS = [
  {
    title: "Reproduce issue in staging",
    assignee: "Ayoade Oluwaseun",
    done: true,
  },
  {
    title: "Identify root cause in token middleware",
    assignee: "Ifedayo Chukwu",
    done: true,
  },
  { title: "Write and review patch", assignee: "Obinna Nwankwo", done: true },
  {
    title: "Deploy staging + regression tests",
    assignee: "Kehinde Balogun",
    done: true,
    note: "Deploy hotfix to staging + regression tests",
  },
  {
    title: "Get change control approval for prod",
    assignee: "Chijioke Okafor",
    done: false,
  },
  {
    title: "Deploy to production and verify",
    assignee: "Temitope Adebayo",
    done: false,
  },
  {
    title: "Send resolution summary to client",
    assignee: "Chinonso Eze",
    done: false,
  },
];

const TaskPanel = () => {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const completed = tasks.filter((task) => task.done).length;
  const progress = Math.round((completed / tasks.length) * 100);

  const toggleTask = (index) =>
    setTasks((current) =>
      current.map((task, taskIndex) =>
        taskIndex === index ? { ...task, done: !task.done } : task,
      ),
    );

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
        <div className="mt-5 space-y-4">
          {tasks.map((task, index) => (
            <div key={task.title} className="flex gap-3">
              <button
                type="button"
                onClick={() => toggleTask(index)}
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
                  {task.note && (
                    <span className="ml-1 text-muted-foreground no-underline">
                      {task.note}
                    </span>
                  )}
                </p>
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
