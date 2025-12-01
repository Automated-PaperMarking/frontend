import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/utils/storage";
import { toast } from "@/components/ui/use-toast";
import { get, put } from "@/lib/api";

export default function Profile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [role, setRole] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await get<any>("/v1/user/profile");
        if (!mounted) return;
        if (res.ok && res.data) {
          // API returns { code, message, data: { ...user } }
          const user = res.data.data || res.data;
          setId(user.id || "");
          setFirstName(user.firstName || "");
          setLastName(user.lastName || "");
          setEmail(user.email || "");
          setRole(user.role || "");
          setEmailVerified(Boolean(user.emailVerified));
          setAccountLocked(Boolean(user.accountLocked));
          setCreatedAt(user.createdAt || null);
          setUpdatedAt(user.updatedAt || null);

          // update local storage copy if present
          try {
            const raw = localStorage.getItem("ai-grade-user");
            if (raw) {
              const localUser = JSON.parse(raw);
              const merged = { ...localUser, ...user };
              localStorage.setItem("ai-grade-user", JSON.stringify(merged));
            }
          } catch (err) {
            // ignore
          }
        } else {
          toast({ title: "Load failed", description: res.error || "Failed to load profile" });
        }
      } catch (err) {
        toast({ title: "Error", description: String(err) });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async () => {
    if (!email) {
      toast({ title: "Invalid", description: "Email is required." });
      return;
    }
    setSaving(true);
    try {
      // Call server to update profile
      const res = await put<any>("/v1/user/profile", { firstName, lastName });
      if (res.ok && res.data) {
        // Server may return full user object in res.data.data or res.data
        const serverUser = res.data.data || res.data;
        try {
          const raw = localStorage.getItem("ai-grade-user");
          if (raw) {
            const localUser = JSON.parse(raw);
            const merged = { ...localUser, ...serverUser };
            localStorage.setItem("ai-grade-user", JSON.stringify(merged));
          } else {
            // if no local user, store server user
            localStorage.setItem("ai-grade-user", JSON.stringify(serverUser));
          }
        } catch (err) {
          // ignore localStorage errors
        }
        // update UI state from server response
        setFirstName(serverUser.firstName || firstName);
        setLastName(serverUser.lastName || lastName);
        setEmail(serverUser.email || email);
        setRole(serverUser.role || role);
        setEmailVerified(Boolean(serverUser.emailVerified));
        setAccountLocked(Boolean(serverUser.accountLocked));

        toast({ title: "Saved", description: "Profile updated." });
      } else {
        toast({ title: "Save failed", description: res.error || "Failed to update profile" });
      }
    } catch (err) {
      toast({ title: "Error", description: String(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Helmet>
        <title>Profile • AI Grading System</title>
      </Helmet>
      <div className="container max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading && <div className="text-sm ">Loading profile…</div>}
              <div>
                <Label>First name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label>Last name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} disabled={true} />
              </div>

              <div className="flex gap-2">
                <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                <Button variant="ghost" onClick={() => {
                  const user = auth.getUser();
                  if (user) {
                    setFirstName(user.firstName || "");
                    setLastName(user.lastName || "");
                    setEmail(user.email || "");
                  }
                }}>Password Reset</Button>
              </div>
              <div className="text-sm">ID: {id}</div>
              <div className="text-sm">Role: {role}</div>
              <div className="text-sm">Email verified: {emailVerified ? "Yes" : "No"}</div>
              <div className="text-sm">Account locked: {accountLocked ? "Yes" : "No"}</div>
              {createdAt && <div className="text-sm">Created: {new Date(createdAt).toLocaleString()}</div>}
              {updatedAt && <div className="text-sm">Updated: {new Date(updatedAt).toLocaleString()}</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
