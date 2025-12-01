import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { post } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

interface Props {
  initialEmail?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ForgotPasswordModal({ initialEmail = "", open, onOpenChange }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [responseBody, setResponseBody] = useState<any>(null);

  const submit = async () => {
    if (!email) {
      toast({ title: "Missing email", description: "Please enter an email address." });
      return;
    }
    setLoading(true);
    setResponseBody(null);
    try {
      const res = await post<any>("/v1/auth/forgot-password", { email });
      setResponseBody(res);
      if (res.ok) {
        toast({ title: "Request sent", description: "If that email exists, you will receive instructions." });
        onOpenChange(false);
      } else {
        toast({ title: "Request failed", description: res.error || "Failed to submit request" });
      }
    } catch (err) {
      setResponseBody({ error: err instanceof Error ? err.message : String(err) });
      toast({ title: "Error", description: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send password reset instructions.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">Email</label>
          <input
            className="w-full rounded border px-2 py-1 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            aria-label="Email for password reset"
          />

          <div className="flex gap-2">
            <Button onClick={submit} disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
