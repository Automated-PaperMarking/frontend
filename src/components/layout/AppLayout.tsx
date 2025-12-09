import { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutGrid, FolderGit2, MailCheck, User } from "lucide-react";
import VerifyEmailModal from "@/components/VerifyEmailModal";
import { auth } from "@/utils/storage";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
    isActive ? "bg-secondary text-foreground" : "hover:bg-muted"
  }`;

  
export default function AppLayout() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const [emailVerified, setEmailVerified] = useState(auth.getEmailVerified() || false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const onLogout = () => {
    auth.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: open ? "240px 1fr" : "64px 1fr" }}>
      <aside className="border-r bg-card">
        <div className="h-14 flex items-center justify-between px-3 border-b">
          <span className={`font-semibold ${open ? "block" : "hidden"}`}>AI Grader</span>
          <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label="Toggle sidebar">
            {open ? "⟨" : "⟩"}
          </Button>
        </div>
        <nav className="p-3 space-y-1">
          <NavLink to="/dashboard" className={navCls} end>
            <LayoutGrid className="h-4 w-4" />
            {open && <span>Dashboard</span>}
          </NavLink>
          <NavLink to="/dashboard" className={navCls}>
            <FolderGit2 className="h-4 w-4" />
            {open && <span>Projects</span>}
          </NavLink>
          <NavLink to="/profile" className={navCls}>
            <User className="h-4 w-4" />
            {open && <span>Profile</span>}
          </NavLink>
          {!emailVerified && (
            <button onClick={() => setShowVerifyModal(true) } className={navCls({ isActive: true })}>
              <MailCheck className="h-4 w-4" />
              {open && <span>Verify Email</span>}
            </button>
          )}
          <button onClick={onLogout} className="w-full mt-4 flex items-center gap-3 px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive">
            <LogOut className="h-4 w-4" />
            {open && <span>Logout</span>}
          </button>
        </nav>
      </aside>
      <VerifyEmailModal
        email={auth.getUser()?.email ?? ""}
        open={showVerifyModal}
        onOpenChange={(v) => setShowVerifyModal(v)}
      />
      <main className="min-h-screen">
        <header className="h-14 border-b flex items-center px-4">
          <h1 className="text-lg font-semibold">AI-aided Grading System</h1>
        </header>
        <section className="p-6 container max-w-6xl">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
