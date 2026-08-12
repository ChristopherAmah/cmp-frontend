import { useState } from "react";
import {
  ChevronDown,
  Clock3,
  Pause,
  Play,
  Square,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIMER_TASKS = [
  {
    title: "Verify bug in test server",
    assignee: "Chijioke Okafor",
    logged: "45m 30s recorded",
  },
  {
    title: "Simulate error in development setup",
    assignee: "Adaobi Nwosu",
    logged: "50m 15s tracked",
  },
  {
    title: "Test malfunction in staging platform",
    assignee: "Tunde Adebayo",
    logged: "49m 05s documented",
    assigned: "Assigned to Priya",
  },
  {
    title: "Recreate fault in testing environment",
    assignee: "Ngozi Eze",
    logged: "1h 20s registered",
    assigned: "Assigned to Priya",
  },
  {
    title: "Examine issue in staging zone",
    assignee: "Chinonso Obi",
    logged: "51m 35s accounted for",
    active: true,
  },
  {
    title: "Check for glitches in pre-production environment",
    assignee: "Emeka Ibe",
    logged: "48m 45s noted",
  },
  {
    title: "Investigate problem in staging area",
    assignee: "Ify Uche",
    logged: "46m 10s captured",
  },
];

const ENTRIES = [
  {
    initials: "MC",
    color: "bg-pink-500",
    title: "Reproduce issue in staging environment",
    person: "Emeka Ibe",
    time: "Nov 12, 2024 · 10:05–10:52",
    duration: "47m 00s",
  },
  {
    initials: "PO",
    color: "bg-orange-400",
    title: "Identify root cause in token middleware",
    person: "Chinonso Obi",
    time: "Nov 12, 2024 · 10:05–10:52",
    duration: "47m 00s",
  },
];

const SummaryCard = ({ icon, value, label }) => (
  <div className="rounded-xl border border-border bg-secondary/40 px-3 py-3 text-center">
    <div className="mx-auto mb-1 flex h-4 justify-center text-primary">
      {icon}
    </div>
    <p className="text-lg font-semibold leading-none text-foreground">
      {value}
    </p>
    <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
  </div>
);

const TimePanel = () => {
  const [active, setActive] = useState(4);

  return (
    <section className="absolute inset-x-0 bottom-0 top-[145px] z-10 overflow-y-auto bg-white px-4 py-5 dark:bg-slate-950 sm:px-6">
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          icon={<Clock3 className="h-3.5 w-3.5" />}
          value="7h 12m"
          label="Total Logged"
        />
        <SummaryCard
          icon={<span className="text-xs">〽</span>}
          value="2"
          label="Sessions"
        />
        <SummaryCard
          icon={<UserRound className="h-3.5 w-3.5" />}
          value="2"
          label="Contributors"
        />
      </div>
      <h3 className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Task timers
      </h3>
      <div className="mt-2 space-y-2">
        {TIMER_TASKS.map((task, index) => (
          <article
            key={task.title}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
              active === index
                ? "border-primary bg-primary/5"
                : "border-border bg-card",
            )}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground">
                {task.title}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <UserRound className="h-2.5 w-2.5" />
                {task.assignee}
                <span className="ml-1">
                  <Clock3 className="mr-1 inline h-2.5 w-2.5" />
                  {task.logged}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {active === index ? (
                <>
                  <span className="rounded-md bg-cyan-50 px-2.5 py-2 font-mono text-xs font-semibold text-primary dark:bg-cyan-950/30">
                    13:48
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 bg-amber-100 px-2 text-[10px] text-amber-700 hover:bg-amber-100"
                  >
                    <Pause className="mr-1 h-3 w-3" />
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setActive(null)}
                    className="h-7 bg-red-100 px-2 text-[10px] text-red-600 hover:bg-red-100"
                  >
                    <Square className="mr-1 h-3 w-3" />
                    Stop
                  </Button>
                </>
              ) : task.assigned ? (
                <span className="rounded-md bg-secondary px-2 py-1.5 text-[10px] text-muted-foreground">
                  {task.assigned}
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setActive(index)}
                  className="h-7 bg-primary px-2.5 text-[10px]"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Start
                </Button>
              )}
              <button type="button" className="text-muted-foreground">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
      <h3 className="mt-5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        All time entries
      </h3>
      <div className="mt-2 overflow-hidden rounded-xl border border-border">
        {ENTRIES.map((entry) => (
          <article
            key={entry.title}
            className="flex gap-3 border-b border-border px-3 py-3 last:border-0"
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white",
                entry.color,
              )}
            >
              {entry.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-foreground">
                {entry.title}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {entry.person} · {entry.time}
              </p>
              <p className="mt-1 text-[10px] text-primary/70">
                “Reproduced auth failure, captured full request trace”
              </p>
            </div>
            <span className="shrink-0 self-center text-[10px] font-semibold text-primary">
              {entry.duration}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TimePanel;
