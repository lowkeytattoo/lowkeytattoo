import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@shared/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MailOpen, Phone, Mail, Reply, Trash2 } from "lucide-react";

export default function Messages() {
  const qc = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("web_bookings")
        .select("*")
        .is("preferred_date", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const deleteMsg = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("web_bookings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-messages"] });
      qc.invalidateQueries({ queryKey: ["messages-unread-count"] });
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("web_bookings")
        .update({ status: "confirmed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-messages"] });
      qc.invalidateQueries({ queryKey: ["messages-unread-count"] });
    },
  });

  const unread = (messages ?? []).filter((m) => m.status === "pending").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mensajes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {unread > 0 ? `${unread} sin leer` : "Todo leído"}
        </p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Cargando...</div>
      ) : (messages ?? []).length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground text-sm">
          Sin mensajes todavía
        </div>
      ) : (
        <div className="space-y-3">
          {(messages ?? []).map((m) => {
            const isUnread = m.status === "pending";
            const isEmail = (m.client_email ?? "").length > 0;
            return (
              <div
                key={m.id}
                className={`rounded-lg border bg-card p-5 transition-colors ${
                  isUnread ? "border-primary/40" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">
                        {m.client_name ?? "—"}
                      </span>
                      {isUnread && (
                        <Badge className="text-[10px] font-mono px-1.5 py-0">
                          Nuevo
                        </Badge>
                      )}
                      <span className="font-['IBM_Plex_Mono'] text-xs text-muted-foreground ml-auto">
                        {format(new Date(m.created_at), "d MMM yyyy · HH:mm", { locale: es })}
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-['IBM_Plex_Mono']">
                      {isEmail
                        ? <><Mail className="w-3 h-3" />{m.client_email}</>
                        : <><Phone className="w-3 h-3" />{m.client_phone}</>
                      }
                    </div>

                    {/* Message */}
                    {m.description && (
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                        {m.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {isEmail ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1.5 text-muted-foreground"
                        asChild
                      >
                        <a
                          href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(m.client_email)}&su=${encodeURIComponent(`Re: tu consulta — Lowkey Tattoo`)}&body=${encodeURIComponent(`Hola ${m.client_name},\n\nGracias por ponerte en contacto con nosotros.\n\n[Escribe tu respuesta aquí]\n\nUn saludo,\nLowkey Tattoo\nCalle Dr. Allart, 50 · Santa Cruz de Tenerife\ntattoolowkey.com\n\n\n────────────────────────\nMensaje original:\n${m.description ?? ""}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          Responder
                        </a>
                      </Button>
                    ) : m.client_phone ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1.5 text-muted-foreground"
                        asChild
                      >
                        <a
                          href={`https://wa.me/${m.client_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${m.client_name}, te contactamos desde Lowkey Tattoo en respuesta a tu mensaje:\n\n"${m.description ?? ""}"\n\n`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      </Button>
                    ) : null}
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1.5 text-muted-foreground"
                        onClick={() => markRead.mutate(m.id)}
                        disabled={markRead.isPending}
                      >
                        <MailOpen className="w-3.5 h-3.5" />
                        Leído
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => deleteMsg.mutate(m.id)}
                      disabled={deleteMsg.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
