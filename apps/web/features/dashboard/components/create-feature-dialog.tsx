"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon, PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createFeatureRequestAction } from "@/lib/actions/features";

type CreateFeatureDialogProps = {
  projects: Array<{ id: string; name: string }>;
  defaultProjectId?: string;
  trigger?: React.ReactNode;
};

export function CreateFeatureDialog({
  projects,
  defaultProjectId,
  trigger,
}: CreateFeatureDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !projectId) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        await createFeatureRequestAction({
          projectId,
          title: title.trim(),
          description: description.trim(),
          priority,
        });
        toast.success("Feature request created successfully!");
        setOpen(false);
        setTitle("");
        setDescription("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create feature request");
      }
    });
  }

  const resolvedTrigger = React.isValidElement(trigger) ? (
    trigger
  ) : (
    <Button className="gap-1.5 size-sm">
      <PlusIcon className="size-4" />
      {trigger || "New Feature"}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={resolvedTrigger} />
      <DialogContent className="sm:max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-none shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight text-zinc-100">
            Create Feature Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Project Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-none px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            >
              <option value="" disabled>Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Add payment integration using Stripe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-none px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-zinc-600"
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Describe the feature request in detail so that the AI can gather requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] bg-zinc-950 border border-zinc-800 rounded-none px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-zinc-600 resize-none"
              required
              minLength={10}
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-none px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 text-xs"
                >
                  Cancel
                </Button>
              }
            />
            <Button
              type="submit"
              disabled={isPending}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-medium text-xs"
            >
              {isPending ? (
                <Loader2Icon className="size-3.5 animate-spin mr-1" />
              ) : (
                <PlusIcon className="size-3.5 mr-1" />
              )}
              Create Feature
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
