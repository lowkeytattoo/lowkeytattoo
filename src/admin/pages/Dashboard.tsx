import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { useFinancesOverview, useRevenueByMonth } from "@admin/hooks/useFinances";
import { useSessions } from "@admin/hooks/useSessions";
import { useLowStockCount } from "@admin/hooks/useStock";
import { supabase } from "@shared/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  format, startOfDay, endOfDay, parseISO,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
} from "date-fns";
import { formatLocalDate } from "@shared/lib/formatDate";
import { es } from "date-fns/locale";
import { TrendingUp, Users, Calendar, AlertCircle, ExternalLink, Clock, BookOpen } from "lucide-react";
import { ArtistAvatar } from "@admin/components/ArtistAvatar";
import { useCalendarEvents } from "@admin/hooks/useGoogleCalendar";

type Period = "week" | "month" | "quarter";
const PERIOD_LABELS: Record<Period, string> = { week: "Semana", month: "Mes", quarter: "Trimestre" };
const PERIOD_KPI: Record<Period, string> = { week: "esta semana", month: "este mes", quarter: "este trimestre" };

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

  const [period, setPeriod] = useState<Period>("month");
  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    if (period === "week") return {
      dateFrom: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      dateTo:   format(endOfWeek(now,   { weekStartsOn: 1 }), "yyyy-MM-dd"),
    };
    if (period === "quarter") return {
      dateFrom: format(startOfQuarter(now), "yyyy-MM-dd"),
      dateTo:   format(endOfQuarter(now),   "yyyy-MM-dd"),
    };
    return {
      dateFrom: format(startOfMonth(now), "yyyy-MM-dd"),
      dateTo:   format(endOfMonth(now),   "yyyy-MM-dd"),
    };
  }, [period]);

  const { data: overview } = useFinancesOverview(artistId, dateFrom, dateTo);
  const { data: revenueResult } = useRevenueByMonth(6, artistId);

  const { data: pendingBookingsCount = 0 } = useQuery({
    queryKey: ["bookings-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("web_bookings")
        .select("*", { count: "exact", head: true })
        .not("preferred_date", "is", null)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
  const { data: recentSessions } = useSessions({ artistId });
  const { data: lowStockCount } = useLowStockCount();

  const calendarId = profile?.calendar_id ?? null;

  const calTimeMin = startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).toISOString();
  const calTimeMax = endOfDay(new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0)).toISOString();
  const { data: upcomingEvents = [] } = useCalendarEvents(
    calendarId ? calTimeMin : "",
    calendarId ? calTimeMax : "",
    calendarId,
  );

  const calDays = calendarId
    ? (() => {
        const dayMap = new Map<string, typeof upcomingEvents>();
        for (const ev of upcomingEvents) {
          const d = ev.start.dateTime ? parseISO(ev.start.dateTime) : ev.start.date ? parseISO(ev.start.date) : null;
          if (!d) continue;
          const key = format(d, "yyyy-MM-dd");
          if (!dayMap.has(key)) dayMap.set(key, []);
          dayMap.get(key)!.push(ev);
        }
        return Array.from(dayMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, events]) => ({ day: parseISO(key), events }));
      })()
    : [];

  const last10Sessions = recentSessions?.slice(0, 10) ?? [];
  const revenueRows = revenueResult?.rows ?? [];
  const artistNames = revenueResult?.artistNames ?? [];
  const hasChartData = revenueRows.some((r) =>
    artistNames.some((name) => (r[name] as number) > 0)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isOwner ? "Visión global del estudio" : `Tus estadísticas, ${profile?.display_name}`}
        </p>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-1 p-1 rounded-md bg-muted/40 border border-border w-fit">
        {(["week", "month", "quarter"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded text-xs font-['IBM_Plex_Mono'] uppercase tracking-wider transition-colors ${
              period === p
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* KPI Cards — 2 cols mobile, 4 cols tablet+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground leading-tight">
                Ingresos {PERIOD_KPI[period]}
              </span>
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              €{(overview?.revenueMonth ?? 0).toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground leading-tight">
                Sesiones {PERIOD_KPI[period]}
              </span>
              <Calendar className="w-4 h-4 text-primary shrink-0" />
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
                <span className="text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground leading-tight">
                  Clientes totales
                </span>
                <Users className="w-4 h-4 text-primary shrink-0" />
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
              <span className="text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground leading-tight">
                Pendiente cobro
              </span>
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            </div>
            <div className="text-2xl font-bold text-destructive">
              €{(overview?.pendingAmount ?? 0).toFixed(0)}
            </div>
          </CardContent>
        </Card>

        {isOwner && (
          <Link to="/admin/bookings" className="col-span-2 md:col-span-1 block group">
            <Card className="bg-card border-border h-full group-hover:border-muted-foreground transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground leading-tight">
                    Citas web
                  </span>
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                </div>
                <div className={`text-2xl font-bold ${pendingBookingsCount > 0 ? "text-primary" : "text-foreground"}`}>
                  {pendingBookingsCount}
                </div>
                <p className="text-[10px] font-['IBM_Plex_Mono'] text-muted-foreground mt-1">pendientes</p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Stock alert banner */}
      {isOwner && !!lowStockCount && lowStockCount > 0 && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-3 flex items-center gap-3">
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
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-base font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
              Ingresos últimos 6 meses
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              {isOwner ? (
                <LineChart data={revenueRows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `€${v}`}
                    width={42}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                    formatter={(v: number) => [`€${v.toFixed(0)}`, undefined]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
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
                <BarChart data={revenueRows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `€${v}`}
                    width={42}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
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

      {/* Calendar widget */}
      {calendarId && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground truncate">
                Calendario — {format(new Date(), "MMM yyyy", { locale: es })}
              </CardTitle>
              <Link
                to="/admin/calendar"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono shrink-0"
              >
                <span className="hidden sm:inline">Ver completo</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {calDays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sin citas este mes
              </p>
            ) : (
              <div className="space-y-5">
                {calDays.map(({ day, events }) => (
                  <div key={day.toISOString()}>
                    {/* Day label */}
                    <div className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                      <span className="capitalize">
                        {/* Short date on mobile, full on sm+ */}
                        <span className="sm:hidden">{format(day, "EEE d MMM", { locale: es })}</span>
                        <span className="hidden sm:inline">{format(day, "EEEE d 'de' MMMM", { locale: es })}</span>
                      </span>
                      <span className="flex-1 h-px bg-border" />
                      <span>{events.length} {events.length === 1 ? "cita" : "citas"}</span>
                    </div>
                    {/* Event cards */}
                    <div className="flex flex-col gap-2">
                      {events.map((ev) => {
                        const timeStart = ev.start.dateTime ? format(parseISO(ev.start.dateTime), "HH:mm") : null;
                        const timeEnd   = ev.end.dateTime   ? format(parseISO(ev.end.dateTime),   "HH:mm") : null;
                        const [service, client] = ev.summary.includes(" — ")
                          ? ev.summary.split(" — ")
                          : [ev.summary, null];
                        return (
                          <div
                            key={ev.id}
                            className="rounded-lg border border-border bg-background p-3 flex flex-col gap-1.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:gap-4 gap-1.5">
                              <div className="flex flex-col gap-1 sm:min-w-[130px] sm:max-w-[160px]">
                                <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest text-muted-foreground">
                                  {service}
                                </span>
                                {client && (
                                  <span className="text-sm font-medium text-foreground leading-tight">
                                    {client}
                                  </span>
                                )}
                              </div>
                              {ev.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line sm:border-l sm:border-border sm:pl-4 flex-1">
                                  {ev.description}
                                </p>
                              )}
                            </div>
                            {timeStart && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono mt-auto pt-1 border-t border-border">
                                <Clock className="w-3 h-3 shrink-0" />
                                {timeStart}{timeEnd && timeEnd !== timeStart ? ` — ${timeEnd}` : ""}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          {/* ── Mobile: card list ─────────────────────────── */}
          <div className="md:hidden divide-y divide-border">
            {last10Sessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No hay sesiones registradas
              </p>
            ) : (
              last10Sessions.map((s) => (
                <div key={s.id} className="px-4 py-3 space-y-1.5">
                  {/* Row 1: date + price */}
                  <div className="flex items-center justify-between">
                    <span className="font-['IBM_Plex_Mono'] text-xs text-muted-foreground">
                      {formatLocalDate(s.date, "d MMM yyyy", { locale: es })}
                    </span>
                    <span className="font-['IBM_Plex_Mono'] text-sm font-semibold text-foreground">
                      {s.price != null ? `€${parseFloat(String(s.price)).toFixed(0)}` : "—"}
                    </span>
                  </div>
                  {/* Row 2: client name */}
                  <div className="text-sm font-medium text-foreground">
                    {s.client?.name ?? "—"}
                  </div>
                  {/* Row 3: type + artist avatar + paid badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-['IBM_Plex_Mono']">
                      {SESSION_TYPE_LABELS[s.type] ?? s.type}
                    </Badge>
                    {isOwner && <ArtistAvatar name={s.artist?.display_name} size="xs" />}
                    <Badge variant={s.paid ? "default" : "destructive"} className="text-[10px]">
                      {s.paid ? "Pagado" : "Pendiente"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Desktop: table ────────────────────────────── */}
          <div className="hidden md:block">
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
                        {formatLocalDate(s.date, "d MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm">{s.client?.name ?? "—"}</TableCell>
                      {isOwner && (
                        <TableCell className="text-sm">{s.artist?.display_name ?? "—"}</TableCell>
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
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
