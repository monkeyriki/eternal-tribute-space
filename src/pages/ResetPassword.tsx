import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(() => setSessionReady(true))
        .catch(() => setSessionReady(true));
    } else {
      // If no tokens are present, still allow the user to try; Supabase will error if not authorized
      setSessionReady(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Please choose a password with at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Make sure both password fields are identical.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });
      navigate("/auth");
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err.message || "Unable to reset password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Reset Password – Eternal Memory</title>
      </Helmet>
      <Layout>
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-card">
            <h1 className="mb-2 font-serif text-2xl font-semibold text-foreground">Choose a new password</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Enter and confirm your new password to complete the reset.
            </p>
            {!sessionReady ? (
              <p className="text-sm text-muted-foreground">Preparing your session...</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">New password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Confirm password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Updating..." : "Update password"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default ResetPassword;

