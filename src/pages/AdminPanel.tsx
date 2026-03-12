import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Settings, Package, BarChart3, Shield, BookOpen } from "lucide-react";
import UsersTab from "@/components/admin/UsersTab";
import StoreItemsTab from "@/components/admin/StoreItemsTab";
import ModerationTab from "@/components/admin/ModerationTab";
import PlansSettingsTab from "@/components/admin/PlansSettingsTab";
import RevenueTab from "@/components/admin/RevenueTab";
import MemorialsTab from "@/components/admin/MemorialsTab";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("users");

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: memorialCount = 0 } = useQuery({
    queryKey: ["admin-memorial-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("memorials").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: tributeCount = 0 } = useQuery({
    queryKey: ["admin-tribute-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("tributes").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: flaggedCount = 0 } = useQuery({
    queryKey: ["admin-flagged-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("tributes").select("*", { count: "exact", head: true }).eq("status", "flagged");
      if (error) throw error;
      return count || 0;
    },
  });

  const kpiCards = [
    { label: "Users", value: profiles.length, icon: Users, tab: "users", color: "" },
    { label: "Memorials", value: memorialCount, icon: BookOpen, tab: "memorials", color: "" },
    { label: "Tributes", value: tributeCount, icon: MessageSquare, tab: "moderation", color: "" },
    { label: "Flagged", value: flaggedCount, icon: Shield, tab: "moderation", color: "text-destructive" },
    { label: "Admin", value: profiles.filter((p) => p.role === "admin").length, icon: Shield, tab: "users", color: "" },
  ];

  return (
    <Layout>
      <Helmet><title>Admin Panel — Eternal Memory</title></Helmet>
      <div className="container mx-auto py-10 px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super Admin Panel</h1>
          <p className="text-muted-foreground font-sans">Global platform management</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {kpiCards.map((kpi) => (
            <Card
              key={kpi.label}
              className="cursor-pointer transition-colors hover:border-primary/50 hover:shadow-md"
              onClick={() => setActiveTab(kpi.tab)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-sans font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.color || "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${kpi.color || "text-foreground"}`}>{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="users"><Users className="mr-1 h-4 w-4" />Users</TabsTrigger>
            <TabsTrigger value="memorials"><BookOpen className="mr-1 h-4 w-4" />Memorials</TabsTrigger>
            <TabsTrigger value="store"><Package className="mr-1 h-4 w-4" />Store</TabsTrigger>
            <TabsTrigger value="moderation"><MessageSquare className="mr-1 h-4 w-4" />Moderation</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="mr-1 h-4 w-4" />Plans & Ads</TabsTrigger>
            <TabsTrigger value="revenue"><BarChart3 className="mr-1 h-4 w-4" />Revenue</TabsTrigger>
          </TabsList>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="memorials"><MemorialsTab /></TabsContent>
          <TabsContent value="store"><StoreItemsTab /></TabsContent>
          <TabsContent value="moderation"><ModerationTab /></TabsContent>
          <TabsContent value="settings"><PlansSettingsTab /></TabsContent>
          <TabsContent value="revenue"><RevenueTab /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPanel;
