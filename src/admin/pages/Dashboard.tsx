import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { useFinancesOverview, useRevenueByMonth } from "@admin/hooks/useFinances";
import { useSessions } from "@admin/hooks/useSessions";
import { useLowStockCount } from "@admin/hooks/useStock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, Users, Calendar, AlertCircle } from "lucide-react";

const SESSION_TYPE_LABELS: Record<string, string> = {
  tattoo: "Tatuaje",
  piercing: "Piercing",
  laser: "Láser",
  retoque: "Retoque",
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(215, 20%, 55%)",
  "hsl(215, 20%, 40%)",
];

export default function Dashboard() {
  const { profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";
  const artistId = isOwner ? undefined : profile?.id;

  const { data: overview } = useFinancesOverview(artistId);
  const { data: revenueResult } = useRevenueByMonth(6, artistId);
  const { data: recentSessions } = useSessions({ artistId });
  const { data: lowStockCount } = useLowStockCount();

  const last10Sessions = recentSessions?.slice(0, 10) ?? [];
  const revenueRows = revenueResult?.rows ?? [];
  const artistNames = revenueResult?.artistNames ?? [];
  const hasChartData = revenueRows.some((r) =>
    artistNames.some((name) => (r[name] as number) > 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isOwner ? "Visión global del estudio" : `Tus estadísticas, ${profile?.display_name}`}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
                Ingresos mes
              </span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              €{(overview?.revenueMonth ?? 0).toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
                Sesiones mes
              </span>
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {overview?.sessionsMonth ?? 0}
            </div>
          </CardContent>
        </Card>

        {isOwner && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
                  Clientes totales
                </span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {overview?.totalClients ?? 0}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
                Pendiente cobro
              </span>
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
            <div className="text-2xl font-bold text-destructive">
              €{(overview?.pendingAmount ?? 0).toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock alert banner */}
      {isOwner && !!lowStockCount && lowStockCount > 0 && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <span className="text-sm text-foreground">
              <strong>{lowStockCount}</strong>{" "}
              {lowStockCount === 1 ? "producto" : "productos"} con stock bajo o agotado
            </span>
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart */}
      {hasChartData && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
              Ingresos últimos 6 meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              {isOwner ? (
                <LineChart data={revenueRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `€${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    formatter={(v: number) => [`€${v.toFixed(0)}`, undefined]}
                  />
                  <Legend />
                  {artistNames.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={revenueRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `€${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    formatter={(v: number) => [`€${v.toFixed(0)}`, undefined]}
                  />
                  {artistNames.map((name, i) => (
                    <Bar
                      key={name}
                      dataKey={name}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent sessions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
            Últimas sesiones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Fecha</TableHead>
                <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Cliente</TableHead>
                {isOwner && (
                  <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Artista</TableHead>
                )}
                <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Tipo</TableHead>
                <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider text-right">Precio</TableHead>
                <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {last10Sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isOwner ? 6 : 5} className="text-center text-muted-foreground py-8">
                    No hay sesiones registradas
                  </TableCell>
                </TableRow>
              ) : (
                last10Sessions.map((s) => (
                  <TableRow key={s.id} className="border-border">
                    <TableCell className="text-sm">
                      {format(new Date(s.date + "T00:00:00"), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm">{(s.client as any)?.name ?? "—"}</TableCell>
                    {isOwner && (
                      <TableCell className="text-sm">{(s.artist as any)?.display_name ?? "—"}</TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-['IBM_Plex_Mono']">
                        {SESSION_TYPE_LABELS[s.type] ?? s.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-['IBM_Plex_Mono'] text-sm">
                      {s.price != null ? `€${parseFloat(String(s.price)).toFixed(0)}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.paid ? "default" : "destructive"} className="text-xs">
                        {s.paid ? "Pagado" : "Pendiente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
