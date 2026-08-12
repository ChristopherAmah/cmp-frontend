import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";
import logoblack from "../assets/logoblack.png";
import logowhite from "../assets/logowhite.png";
import { useTheme } from "../components/ThemeProvider";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    console.log("Login useEffect triggered:", { isAuthenticated, authLoading });
    if (!authLoading && isAuthenticated) {
      console.log("Navigating to dashboard...");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting login with:", email);
      const result = await login(email, password);
      console.log("Login result:", result);
      setLoading(false);

      if (result.success) {
        console.log("Login successful, navigating to dashboard...");
        navigate("/dashboard", { replace: true });
      } else {
        setError(result.message || "Invalid email or password");
      }
    } catch (err) {
      setLoading(false);
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="relative rounded-3xl border border-border/50 bg-card/60 dark:bg-card/40 backdrop-blur-2xl shadow-2xl p-8 sm:p-10 transition-all duration-300">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-white/5 to-transparent dark:from-white/10 dark:via-transparent dark:to-transparent pointer-events-none" />
          <div className="absolute inset-0 rounded-3xl border border-white/30 dark:border-white/10 pointer-events-none" />
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-60 blur-2xl pointer-events-none" />

          <div className="relative space-y-8">
            <div className="space-y-6 text-center">
              {/* <div className="flex justify-center">
                <img
                  src={theme === "dark" ? logowhite : logoblack}
                  alt="Logo"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </div> */}
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
                Welcome back
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 backdrop-blur-sm">
                  <p className="text-sm text-destructive font-medium">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-2.5">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-foreground"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 bg-background/50 dark:bg-background/30 border-border/60 backdrop-blur-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-base"
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 pr-12 bg-background/50 dark:bg-background/30 border-border/60 backdrop-blur-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-secondary/50"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 mt-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="pt-6 border-t border-border/50">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <p>Enterprise-grade security and authentication</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>© 2026 Contract Management Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
