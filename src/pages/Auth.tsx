import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { getFriendlyErrorMessage } from "@/lib/utils";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (resetMode) {
        // Reset link must open your app. Add https://yourdomain.com/reset-password to Supabase → Auth → URL Configuration → Redirect URLs.
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        toast({
          title: "Reset email sent",
          description: "Check your inbox for a password reset link.",
        });
        setResetMode(false);
      } else if (isLogin) {
        await signIn(email, password);
        toast({ title: "Welcome back!", description: "Signed in successfully." });
        navigate(redirectTo.startsWith("/") ? redirectTo : "/");
      } else {
        await signUp(email, password, fullName);
        toast({
          title: "Registration complete",
          description: "Your account has been created. You can now sign in.",
        });
        // opzionale: passa automaticamente alla schermata di login
        setIsLogin(true);
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getFriendlyErrorMessage(error, "auth"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>
          {resetMode ? "Reset Password" : isLogin ? "Sign In" : "Register"} – Eternal Memory
        </title>
      </Helmet>
      <Layout>
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-card"
          >
            <div className="mb-6 text-center">
              <span className="mb-2 inline-block text-3xl">🕊️</span>
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                {resetMode ? "Reset your password" : isLogin ? "Sign In" : "Create your account"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {resetMode
                  ? "Enter your email and we'll send you a reset link."
                  : isLogin
                  ? "Sign in to manage your memorials"
                  : "Register to create memorials and tributes"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !resetMode && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    required={!isLogin}
                    className="w-full rounded-md border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full rounded-md border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {!resetMode && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    minLength={6}
                    className="w-full rounded-md border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting
                  ? "Loading..."
                  : resetMode
                  ? "Send reset link"
                  : isLogin
                  ? "Sign In"
                  : "Register"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 text-center">
              {!resetMode && (
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary block w-full"
                >
                  {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
                </button>
              )}
              {isLogin && !resetMode && (
                <button
                  type="button"
                  onClick={() => setResetMode(true)}
                  className="mt-2 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  Forgot password?
                </button>
              )}
              {resetMode && (
                <button
                  type="button"
                  onClick={() => setResetMode(false)}
                  className="mt-2 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </Layout>
    </>
  );
};

export default Auth;
