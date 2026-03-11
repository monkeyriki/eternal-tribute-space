import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";

const COLORS = ["hsl(38, 45%, 55%)", "hsl(35, 30%, 35%)", "hsl(80, 10%, 45%)", "hsl(0, 60%, 50%)"];

const chartConfig = {
  tributes: { label: "Tributes", color: "hsl(38, 45%, 55%)" },
  plans: { label: "Plans", color: "hsl(35, 30%, 35%)" },
};

const RevenueTab = () => {
  const { data: transactions = [] } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data } = await supabase.from("transactions" as any).select("*").order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
  });

  const { data: paidTributes = [] } = useQuery({
    queryKey: ["admin-paid-tributes"],
    queryFn: async () => {
      const { data } = await supabase.from("tributes" as any).select("*").eq("is_paid", true).order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
  });

  const monthlyData = (() => {
    const months: Record<string, { tributes: number; plans: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { tributes: 0, plans: 0 };
    }
    transactions.forEach((t: any) => {
      const key = t.created_at?.slice(0, 7);
      if (months[key]) {
        if (t.type === "tribute") months[key].tributes += Number(t.amount);
        else months[key].plans += Number(t.amount);
      }
    });
    paidTributes.forEach((t: any) => {
      const key = t.created_at?.slice(0, 7);
      if (months[key]) {
        const price = t.tier === "premium" ? 5 : t.tier === "standard" ? 2 : 0;
        months[key].tributes += price;
      }
    });
    return Object.entries(months).map(([month, data]) => ({
      month: month.slice(5) + "/" + month.slice(2, 4),
      ...data,
      total: data.tributes + data.plans,
    }));
  })();

  const totalRevenue = monthlyData.reduce((s, m) => s + m.total, 0);
  const totalTributes = monthlyData.reduce((s, m) => s + m.tributes, 0);
  const totalPlans = monthlyData.reduce((s, m) => s + m.plans, 0);

  const pieData = [
    { name: "Virtual Tributes", value: totalTributes || 1 },
    { name: "Premium Plans", value: totalPlans || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-sans font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">${totalRevenue.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-sans font-medium text-muted-foreground">From Tributes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">${totalTributes.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-sans font-medium text-muted-foreground">From Plans</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">${totalPlans.toFixed(2)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg font-sans">Monthly Revenue (Last 6 Months)</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="tributes" name="Tributes" fill="hsl(38, 45%, 55%)" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="plans" name="Plans" fill="hsl(35, 30%, 35%)" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg font-sans">Revenue Distribution</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="h-[250px] w-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueTab;
