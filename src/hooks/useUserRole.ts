import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "registered" | "b2b_partner" | "admin";

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      // Only check user_roles table (secure, RLS-protected)
      const { data: userRoles } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id);

      const allRoles = new Set<AppRole>();
      (userRoles as any[])?.forEach((r: any) => allRoles.add(r.role as AppRole));

      setRoles(Array.from(allRoles));
      setLoading(false);
    };

    fetchRoles();
  }, [user, authLoading]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isB2B = hasRole("b2b_partner");

  return { roles, loading, hasRole, isAdmin, isB2B };
};
