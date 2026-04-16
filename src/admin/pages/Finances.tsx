import { useState, useMemo } from "react";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { useRevenueByMonth, useUnpaidSessions } from "@admin/hooks/useFinances";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import { useSessions } from "@admin/hooks/useSessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { formatLocalDate } from "@shared/lib/formatDate";
import { es } from "date-fns/locale";
import { Download, Printer } from "lucide-react";
import { ArtistAvatar } from "@admin/components/ArtistAvatar";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(215, 20%, 55%)",
  "hsl(215, 20%, 40%)",
];

type Period = "month" | "prev" | "3m" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  month: "Este mes",
  prev: "Mes anterior",
  "3m": "3 meses",
  year: "Este año",
  all: "Todo",
};

function computePeriodDates(p: Period): {
  from: string | undefined;
  to: string | undefined;
  prevFrom: string | undefined;
  prevTo: string | undefined;
} {
  const now = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  if (p === "month") {
    return {
      from: fmt(startOfMonth(now)),
      to: fmt(endOfMonth(now)),
      prevFrom: fmt(startOfMonth(subMonths(now, 1))),
      prevTo: fmt(endOfMonth(subMonths(now, 1))),
    };
  }
  if (p === "prev") {
    const prev = subMonths(now, 1);
    return {
      from: fmt(startOfMonth(prev)),
      to: fmt(endOfMonth(prev)),
      prevFrom: fmt(startOfMonth(subMonths(now, 2))),
      prevTo: fmt(endOfMonth(subMonths(now, 2))),
    };
  }
  if (p === "3m") {
    return {
      from: fmt(startOfMonth(subMonths(now, 2))),
      to: fmt(endOfMonth(now)),
      prevFrom: fmt(startOfMonth(subMonths(now, 5))),
      prevTo: fmt(endOfMonth(subMonths(now, 3))),
    };
  }
  if (p === "year") {
    const year = now.getFullYear();
    return {
      from: `${year}-01-01`,
      to: `${year}-12-31`,
      prevFrom: `${year - 1}-01-01`,
      prevTo: `${year - 1}-12-31`,
    };
  }
  return { from: undefined, to: undefined, prevFrom: undefined, prevTo: undefined };
}

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

function printSessionReceipt(session: any) {
  const price = parseFloat(String(session.price ?? 0)).toFixed(0);
  const deposit = parseFloat(String(session.deposit ?? 0)).toFixed(0);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recibo · Lowkey Tattoo</title>
  <style>
    body{font-family:monospace;max-width:420px;margin:48px auto;padding:24px;color:#111}
    h1{font-size:20px;margin:0 0 2px}
    .sub{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#666;margin-bottom:20px}
    hr{border:none;border-top:1px solid #ccc;margin:16px 0}
    .row{display:flex;justify-content:space-between;margin:8px 0;font-size:13px}
    .lbl{color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.08em}
    .total{font-weight:bold;font-size:16px;border-top:1px solid #111;padding-top:12px;margin-top:12px}
    .footer{margin-top:28px;text-align:center;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.1em}
    @media print{body{margin:0}}
  </style>
</head>
<body>
  <h1>Lowkey Tattoo Studio</h1>
  <div class="sub">Justificante de sesión</div>
  <hr>
  <div class="row"><span class="lbl">Fecha</span><span>${session.date ?? "—"}</span></div>
  <div class="row"><span class="lbl">Cliente</span><span>${session.client?.name ?? "—"}</span></div>
  <div class="row"><span class="lbl">Artista</span><span>${session.artist?.display_name ?? "—"}</span></div>
  <div class="row"><span class="lbl">Servicio</span><span>${session.type ?? "—"}</span></div>
  <div class="row"><span class="lbl">Zona</span><span>${session.body_zone ?? "—"}</span></div>
  <hr>
  <div class="row"><span class="lbl">Señal / Depósito</span><span>€${deposit}</span></div>
  <div class="row total"><span>Total</span><span>€${price}</span></div>
  <div class="footer">Calle Dr. Allart, 50 · 38003 Santa Cruz de Tenerife</div>
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script>
</body>
</html>`;
  const w = window.open("", "_blank", "width=520,height=640");
  if (w) { w.document.write(html); w.document.close(); }
}

export default function Finances() {
  const { profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";
  const artistId = isOwner ? undefined : profile?.id;

  const { data: artists } = useArtistProfiles();
  const [activeTab, setActiveTab] = useState("global");
  const [activePeriod, setActivePeriod] = useState<Period>("month");

  const activeArtistId = isOwner
    ? (activeTab === "global" ? undefined : activeTab)
    : artistId;

  const { from, to, prevFrom, prevTo } = useMemo(
    () => computePeriodDates(activePeriod),
    [activePeriod]
  );

  const { data: revenueResult } = useRevenueByMonth(6, activeArtistId);
  const { data: unpaid } = useUnpaidSessions(activeArtistId);
  const { data: sessions } = useSessions({ artistId: activeArtistId, from, to });
  const { data: prevSessions } = useSessions({
    artistId: activeArtistId,
    from: prevFrom,
    to: prevTo,
    enabled: activePeriod !== "all",
  });

  const revenueRows = revenueResult?.rows ?? [];
  const artistNames = revenueResult?.artistNames ?? [];
  const hasChartData = revenueRows.some((r) =>
    artistNames.some((name) => (r[name] as number) > 0)
  );

  const totalRevenue = (sessions ?? []).reduce((s, sess) => s + parseFloat(String(sess.price ?? 0)), 0);
  const paidRevenue = (sessions ?? []).filter((s) => s.paid).reduce((s, sess) => s + parseFloat(String(sess.price ?? 0)), 0);

  const prevTotal = (prevSessions ?? []).reduce((s, sess) => s + parseFloat(String(sess.price ?? 0)), 0);
  const prevPaid = (prevSessions ?? []).filter((s) => s.paid).reduce((s, sess) => s + parseFloat(String(sess.price ?? 0)), 0);

  const delta = (curr: number, prev: number) => {
    if (activePeriod === "all" || prev === 0) return undefined;
    return ((curr - prev) / prev) * 100;
  };

  const handleExport = () => {
    const rows = (sessions ?? []).map((s) => ({
      fecha: s.date,
      cliente: s.client?.name ?? "",
      artista: s.artist?.display_name ?? "",
      tipo: s.type,
      precio: s.price ?? 0,
      señal: s.deposit,
      pagado: s.paid ? "Sí" : "No",
    }));
    const suffix = from ? `${from}_${to}` : format(new Date(), "yyyy-MM");
    exportCsv(rows, `finanzas_${suffix}.csv`);
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

      {/* Period selector — Select on mobile, buttons on sm+ */}
      <div className="sm:hidden">
        <Select value={activePeriod} onValueChange={(v) => setActivePeriod(v as Period)}>
          <SelectTrigger className="w-full bg-background border-border font-['IBM_Plex_Mono'] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <SelectItem key={p} value={p} className="font-['IBM_Plex_Mono'] text-xs">
                {PERIOD_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="hidden sm:flex gap-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <Button
            key={p}
            variant={activePeriod === p ? "default" : "outline"}
            size="sm"
            className="font-['IBM_Plex_Mono'] text-xs tracking-wider"
            onClick={() => setActivePeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </Button>
        ))}
      </div>

      {isOwner ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tabs — scrollable on mobile, normal on sm+ */}
          <div className="overflow-x-auto">
            <TabsList className="bg-card border border-border w-max min-w-full sm:w-auto">
              <TabsTrigger value="global">Global</TabsTrigger>
              {(artists ?? []).map((a) => (
                <TabsTrigger key={a.id} value={a.id}>
                  {a.display_name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-4 space-y-4" forceMount>
            <FinancesContent
              totalRevenue={totalRevenue}
              paidRevenue={paidRevenue}
              deltaTotal={delta(totalRevenue, prevTotal)}
              deltaPaid={delta(paidRevenue, prevPaid)}
              deltaPending={delta(totalRevenue - paidRevenue, prevTotal - prevPaid)}
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
          deltaTotal={delta(totalRevenue, prevTotal)}
          deltaPaid={delta(paidRevenue, prevPaid)}
          deltaPending={delta(totalRevenue - paidRevenue, prevTotal - prevPaid)}
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

function DeltaBadge({ delta }: { delta?: number }) {
  if (delta === undefined) return null;
  const positive = delta >= 0;
  const label = `${positive ? "+" : ""}${delta.toFixed(0)}%`;
  return (
    <span className={`text-xs font-['IBM_Plex_Mono'] ml-1 ${positive ? "text-green-500" : "text-destructive"}`}>
      {label}
    </span>
  );
}

function FinancesContent({
  totalRevenue,
  paidRevenue,
  deltaTotal,
  deltaPaid,
  deltaPending,
  revenueRows,
  artistNames,
  hasChartData,
  unpaid,
  isOwner,
}: {
  totalRevenue: number;
  paidRevenue: number;
  deltaTotal?: number;
  deltaPaid?: number;
  deltaPending?: number;
  revenueRows: any[];
  artistNames: string[];
  hasChartData: boolean;
  unpaid: any[] | undefined;
  isOwner: boolean;
}) {
  const pending = totalRevenue - paidRevenue;

  const kpis = [
    { label: "Ingresos totales", value: `€${totalRevenue.toFixed(0)}`, delta: deltaTotal },
    { label: "Cobrado", value: `€${paidRevenue.toFixed(0)}`, delta: deltaPaid },
    { label: "Pendiente", value: `€${pending.toFixed(0)}`, delta: deltaPending, danger: pending > 0 },
  ];

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map(({ label, value, delta, danger }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-xs font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground mb-1">
                {label}
              </div>
              <div className={`text-2xl font-bold ${danger ? "text-destructive" : "text-foreground"}`}>
                {value}
                <DeltaBadge delta={delta} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-base font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
            Ingresos últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {!hasChartData ? (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
              Sin datos de ingresos en los últimos 6 meses
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueRows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `€${v}`} width={42} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  formatter={(v: number) => [`€${v.toFixed(0)}`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
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
                  {isOwner && (
                    <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">
                      <span className="hidden sm:inline">Artista</span>
                    </TableHead>
                  )}
                  <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider text-right">€</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(unpaid ?? []).map((s) => (
                  <TableRow key={s.id} className="border-border group">
                    <TableCell className="text-xs font-['IBM_Plex_Mono'] whitespace-nowrap">
                      <span className="hidden sm:inline">{formatLocalDate(s.date, "d MMM yyyy", { locale: es })}</span>
                      <span className="sm:hidden">{formatLocalDate(s.date, "d MMM", { locale: es })}</span>
                    </TableCell>
                    <TableCell className="text-sm max-w-[100px] truncate">{s.client?.name ?? "—"}</TableCell>
                    {isOwner && (
                      <TableCell>
                        <span className="sm:hidden"><ArtistAvatar name={s.artist?.display_name} /></span>
                        <span className="hidden sm:inline text-sm">{s.artist?.display_name ?? "—"}</span>
                      </TableCell>
                    )}
                    <TableCell className="text-right font-['IBM_Plex_Mono'] text-sm text-destructive whitespace-nowrap">
                      €{parseFloat(String(s.price ?? 0)).toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => printSessionReceipt(s)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                        title="Imprimir recibo"
                      >
                        <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
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
