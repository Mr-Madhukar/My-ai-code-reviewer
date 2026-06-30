"use client";

import { useState } from "react";
import { toast } from "sonner";
import { moveTask } from "@/lib/actions/tasks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRightCircleIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

type TaskStatus = "todo" | "in_progress" | "review" | "done";

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    prd?: {
      featureRequest?: {
        title: string;
      } | null;
    } | null;
  };
};

const PRIORITY_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  high: { border: "border-l-red-500/50", bg: "bg-red-500/5", badge: "text-red-400" },
  medium: { border: "border-l-amber-500/50", bg: "bg-amber-500/5", badge: "text-amber-400" },
  low: { border: "border-l-emerald-500/50", bg: "bg-emerald-500/5", badge: "text-emerald-400" },
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(status: TaskStatus) {
    if (status === task.status) return;
    setLoading(true);
    try {
      await moveTask(task.id, status);
      toast.success(`Task moved to ${STATUS_LABELS[status]}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move task");
    } finally {
      setLoading(false);
    }
  }

  const priority = PRIORITY_COLORS[task.priority] ?? { border: "", bg: "", badge: "" };

  return (
    <Card
      className={`card-glow border-l-2 ${priority.border} ${priority.bg} transition-all relative group`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight pr-6">
            {task.title}
          </p>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {loading ? (
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center justify-center">
                  <ChevronRightCircleIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={status === task.status}
                      className="text-xs"
                    >
                      Move to {STATUS_LABELS[status]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={`text-[10px] px-1.5 capitalize ${priority.badge}`}>
            {task.priority}
          </Badge>
          {task.prd?.featureRequest && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              {task.prd.featureRequest.title}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
