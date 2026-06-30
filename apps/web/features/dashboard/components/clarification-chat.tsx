"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SendIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendClarificationMessageAction } from "@/lib/actions/features";

type ClarificationChatProps = {
  featureId: string;
  status: string;
};

export function ClarificationChat({ featureId, status }: ClarificationChatProps) {
  const [chatMessage, setChatMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const isClarifying = status === "clarifying";

  async function handleSendMessage() {
    if (!chatMessage.trim()) return;
    setSendingMsg(true);
    try {
      await sendClarificationMessageAction(featureId, chatMessage.trim());
      setChatMessage("");
      toast.success("Message sent to AI agent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  }

  if (!isClarifying) {
    return (
      <div className="text-center py-2 text-xs text-muted-foreground">
        {status === "new"
          ? "Click 'Ask AI for Clarification' in the Workflow Actions panel to start."
          : "Conversation is closed for this phase."}
      </div>
    );
  }

  return (
    <div className="flex gap-2 pt-2">
      <input
        type="text"
        placeholder="Reply to the AI agent..."
        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        value={chatMessage}
        onChange={(e) => setChatMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSendMessage();
        }}
        disabled={sendingMsg}
      />
      <Button
        size="sm"
        onClick={handleSendMessage}
        disabled={sendingMsg || !chatMessage.trim()}
        className="gap-1.5"
      >
        {sendingMsg ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <SendIcon className="size-3.5" />
        )}
        Send
      </Button>
    </div>
  );
}
