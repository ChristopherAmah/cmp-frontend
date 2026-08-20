import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { authService } from "@/services/authService";

const PasswordSetup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This password setup link is missing its token.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await authService.completePasswordSetup(token, password);
      setSuccess(response.message || "Password set successfully.");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (setupError) {
      setError(setupError.response?.data?.message || "Unable to set your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Set your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create a password for your Contract Management Portal account.</p>
        </div>
        {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="mb-4 border-emerald-200 bg-emerald-50"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><AlertDescription className="text-emerald-700">{success}</AlertDescription></Alert>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-password">New password</Label>
            <Input id="setup-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required disabled={submitting || Boolean(success)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-confirmation">Confirm password</Label>
            <Input id="setup-confirmation" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required disabled={submitting || Boolean(success)} />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || Boolean(success)}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting password...</> : "Set password"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground"><Link to="/login" className="text-primary hover:underline">Return to sign in</Link></p>
      </div>
    </div>
  );
};

export default PasswordSetup;
