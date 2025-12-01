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
  const [showResetForm, setShowResetForm] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetResponse, setResetResponse] = useState<any>(null);

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
        // keep modal open and show reset form where user can enter OTP and new password
        setShowResetForm(true);
        toast({ title: "Request sent", description: "If that email exists, you will receive instructions (OTP). Enter it below to reset your password." });
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
              {loading ? "Sending…" : "Send OTP Code"}
            </Button>
            {!showResetForm && <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>}
          </div>

          {showResetForm && (
            <div className="mt-4 border-t pt-4 space-y-3">
              <div className="font-medium">Reset Password</div>
              <label className="block text-sm">OTP Code</label>
              <input
                className="w-full rounded border px-2 py-1 text-sm"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter OTP code"
              />

              <label className="block text-sm">New Password</label>
              <input
                className="w-full rounded border px-2 py-1 text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a strong password"
                type="password"
              />

              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    if (!otpCode || !newPassword) {
                      toast({ title: "Missing fields", description: "Please provide OTP and new password." });
                      return;
                    }
                    setResetting(true);
                    setResetResponse(null);
                    try {
                      const r = await post<any>("v1/auth/reset-password", { email, otpCode, newPassword });
                      setResetResponse(r);
                      if (r.ok) {
                        toast({ title: "Password reset", description: "Your password has been updated." });
                        onOpenChange(false);
                      } else {
                        toast({ title: "Reset failed", description: r.error || "Failed to reset password" });
                      }
                    } catch (err) {
                      setResetResponse({ error: err instanceof Error ? err.message : String(err) });
                      toast({ title: "Error", description: String(err) });
                    } finally {
                      setResetting(false);
                    }
                  }}
                  disabled={resetting}
                >
                  {resetting ? "Resetting…" : "Reset Password"}
                </Button>
                <Button variant="ghost" onClick={() => { setOtpCode(""); setNewPassword(""); setResetResponse(null); }}>
                  Reset
                </Button>
              </div>

              {resetResponse && (
                <div className="rounded border p-3 bg-muted text-sm">
                  <div className="font-medium">Reset Response</div>
                  <pre className="whitespace-pre-wrap mt-2 text-xs">{JSON.stringify(resetResponse, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
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
