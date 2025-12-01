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
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VerifyEmailModal({ email, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [responseBody, setResponseBody] = useState<any>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResponse, setVerifyResponse] = useState<any>(null);

  const sendOtp = async () => {
    if (!email) {
      toast({ title: "No email", description: "No user email available." });
      return;
    }
    setLoading(true);
    setResponseBody(null);
    try {
      const res = await post<any>("/v1/auth/send-otp", { email });
      if (res.ok) {
        setResponseBody(res.data);
        setOtpSent(true);
        toast({ title: "OTP sent", description: "OTP request was successful." });
      } else {
        setResponseBody({ error: res.error || "Unknown error" });
        setOtpSent(false);
        toast({ title: "Request failed", description: res.error || "Failed to send OTP" });
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
          <DialogTitle>Verify Email</DialogTitle>
          <DialogDescription>
            We'll send a one-time password (OTP) to your email to verify your
            account. Email: <strong>{email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <Button variant="secondary" onClick={sendOtp} disabled={loading}>
            {loading ? "Sending…" : "Send OTP"}
          </Button>

          {responseBody && (
            <div className="rounded border p-3 bg-muted text-sm">
              {otpSent && (
                <div className="mt-3 space-y-2">
                  <label className="block text-sm">Enter OTP</label>
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Enter OTP code"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        if (!otpCode) {
                          toast({ title: "Missing OTP", description: "Please enter the OTP code." });
                          return;
                        }
                        setVerifying(true);
                        setVerifyResponse(null);
                        try {
                          const vres = await post<any>("/v1/auth/verify-email", { email, otpCode });
                          setVerifyResponse(vres);
                          if (vres.ok) {
                            toast({ title: "Verified", description: "Email verified successfully." });
                            // persist emailVerified in stored user object
                            try {
                              const raw = localStorage.getItem("ai-grade-user");
                              if (raw) {
                                const user = JSON.parse(raw);
                                user.emailVerified = true;
                                localStorage.setItem("ai-grade-user", JSON.stringify(user));
                              }
                            } catch (err) {
                              console.warn("Failed to persist emailVerified", err);
                            }
                            onOpenChange(false);
                          } else {
                            toast({ title: "Verification failed", description: vres.error || "Invalid OTP" });
                          }
                        } catch (err) {
                          toast({ title: "Error", description: String(err) });
                        } finally {
                          setVerifying(false);
                        }
                      }}
                      disabled={verifying}
                    >
                      {verifying ? "Verifying…" : "Verify OTP"}
                    </Button>
                  </div>

                  {verifyResponse && (
                    <pre className="whitespace-pre-wrap mt-2 text-xs">{JSON.stringify(verifyResponse, null, 2)}</pre>
                  )}
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
