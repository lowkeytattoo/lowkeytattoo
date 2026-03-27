import { useState } from "react";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { useRevenueByMonth, useUnpaidSessions } from "@admin/hooks/useFinances";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import { useSessions } from "@admin/hooks/useSessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download } from "lucide-react";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(215, 20%, 55%)",
  "hsl(215, 20%, 40%)",
];

function exportCsv(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Finances() {
  const { profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";
  const artistId = isOwner ? undefined : profile?.id;

  const { data: artists } = useArtistProfiles();
  const [activeTab, setActiveTab] = useState("global");

  // Derive the filter from the active tab
  const activeArtistId = isOwner
    ? (activeTab === "global" ? undefined : activeTab)
    : artistId;

  const { data: revenueResult } = useRevenueByMonth(6, activeArtistId);
  const { data: unpaid } = useUnpaidSessions(activeArtistId);
  const { data: sessions } = useSessions({ artistId: activeArtistId });

  const revenueRows = revenueResult?.rows ?? [];
  const artistNames = revenueResult?.artistNames ?? [];
  const hasChartData = revenueRows.some((r) =>
    artistNames.some((name) => (r[name] as number) > 0)
  );

  const totalRevenue = (sessions ?? []).reduce((s, sess) => s + parseFloat(String(sess.price ?? 0)), 0);
  const paidRevenue = (sessions ?? []).filter((s) => s.paid).reduce((s, sess) => s + parseFloat(String(sess.price ?? 0)), 0);

  const handleExport = () => {
    const rows = (sessions ?? []).map((s) => ({
      fecha: s.date,
      cliente: (s.client as any)?.name ?? "",
      artista: (s.artist as any)?.display_name ?? "",
      tipo: s.type,
      precio: s.price ?? 0,
      señal: s.deposit,
      pagado: s.paid ? "Sí" : "No",
    }));
    exportCsv(rows, `finanzas_${format(new Date(), "yyyy-MM")}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finanzas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isOwner ? "Visión global y por artista" : "Tus ingresos"}
          </p>
        </div>
        <Button variant="ghost" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {isOwner ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="global">Global</TabsTrigger>
            {(artists ?? []).map((a) => (
              <TabsTrigger key={a.id} value={a.id}>
                {a.display_name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* All tabs share the same content — data driven by activeArtistId */}
          <TabsContent value={activeTab} className="mt-4 space-y-4" forceMount>
            <FinancesContent
              totalRevenue={totalRevenue}
              paidRevenue={paidRevenue}
              revenueRows={revenueRows}
              artistNames={artistNames}
              hasChartData={hasChartData}
              unpaid={unpaid}
              isOwner={isOwner}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <FinancesContent
          totalRevenue={totalRevenue}
          paidRevenue={paidRevenue}
          revenueRows={revenueRows}
          artistNames={artistNames}
          hasChartData={hasChartData}
          unpaid={unpaid}
          isOwner={false}
        />
      )}
    </div>
  );
}

function FinancesContent({
  totalRevenue,
  paidRevenue,
  revenueRows,
  artistNames,
  hasChartData,
  unpaid,
  isOwner,
}: {
  totalRevenue: number;
  paidRevenue: number;
  revenueRows: any[];
  artistNames: string[];
  hasChartData: boolean;
  unpaid: any[] | undefined;
  isOwner: boolean;
}) {
  const pending = totalRevenue - paidRevenue;

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ingresos totales", value: `€${totalRevenue.toFixed(0)}` },
          { label: "Cobrado", value: `€${paidRevenue.toFixed(0)}` },
          { label: "Pendiente", value: `€${pending.toFixed(0)}`, danger: pending > 0 },
        ].map(({ label, value, danger }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-xs font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground mb-1">
                {label}
              </div>
              <div className={`text-2xl font-bold ${danger ? "text-destructive" : "text-foreground"}`}>
                {value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
            Ingresos últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasChartData ? (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
              Sin datos de ingresos en los últimos 6 meses
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `€${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  formatter={(v: number) => [`€${v.toFixed(0)}`, undefined]}
                />
                <Legend />
                {artistNames.map((name, i) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    stackId="a"
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    radius={i === artistNames.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Unpaid sessions */}
      {(unpaid ?? []).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Sesiones sin cobrar
              <Badge variant="destructive" className="text-xs">{(unpaid ?? []).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Fecha</TableHead>
                  <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Cliente</TableHead>
                  {isOwner && <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Artista</TableHead>}
                  <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(unpaid ?? []).map((s) => (
                  <TableRow key={s.id} className="border-border">
                    <TableCell className="text-sm font-['IBM_Plex_Mono']">
                      {format(new Date(s.date + "T00:00:00"), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm">{(s.client as any)?.name ?? "—"}</TableCell>
                    {isOwner && <TableCell className="text-sm">{(s.artist as any)?.display_name ?? "—"}</TableCell>}
                    <TableCell className="text-right font-['IBM_Plex_Mono'] text-sm text-destructive">
                      €{parseFloat(String(s.price ?? 0)).toFixed(0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
