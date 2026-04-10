import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, MessageSquare } from "lucide-react";
import { useI18n } from "@web/i18n/I18nProvider";
import { CONTACT } from "@web/config/contact";
import { supabase } from "@shared/lib/supabase";

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const openDays = new Set(["monday", "tuesday", "wednesday", "thursday", "friday"]);

const StudioInfo = () => {
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const isEmail = contact.includes("@");
      await supabase.from("web_bookings").insert({
        client_name: name,
        client_email: isEmail ? contact : null,
        client_phone: isEmail ? null : contact,
        description: message,
        artist_config_id: null,
        preferred_date: null,
        preferred_time: null,
        body_zone: null,
        is_first_time: null,
        status: "pending",
      });
      setSent(true);
      setName(""); setContact(""); setMessage("");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="studio" className="pt-8 pb-14 md:pt-10 md:pb-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase mb-3">
            {t("studio.label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-medium text-foreground">
            {t("studio.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-card rounded-lg p-8 card-glow"
          >
            <div className="flex items-center gap-3 mb-6">
              <Clock size={16} className="text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground tracking-[0.1em] uppercase">
                {t("studio.hours")}
              </span>
            </div>
            <div className="space-y-3">
              {dayKeys.map((day) => {
                const isOpen = openDays.has(day);
                return (
                  <div key={day} className="flex justify-between items-center">
                    <span className="text-sm text-foreground">{t(`studio.${day}`)}</span>
                    <span className={`font-mono text-sm tabular-nums ${isOpen ? "text-foreground" : "text-muted-foreground"}`}>
                      {isOpen ? "11:00 — 19:00" : t("studio.closed")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-border space-y-4">
              <a
                href="https://maps.google.com/maps?q=Calle+Doctor+Allart+50,+38003+Santa+Cruz+de+Tenerife"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-foreground hover:text-muted-foreground transition-colors duration-200"
              >
                <MapPin size={16} className="text-muted-foreground shrink-0" />
                <span>Calle Dr. Allart, 50 · 38003 Santa Cruz de Tenerife</span>
              </a>
              <a
                href={`tel:${CONTACT.phone}`}
                className="flex items-center gap-3 font-mono text-sm text-foreground tabular-nums hover:text-muted-foreground transition-colors duration-200"
              >
                <Phone size={16} className="text-muted-foreground shrink-0" />
                <span>{CONTACT.phonePretty}</span>
              </a>
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 font-mono text-sm text-foreground hover:text-muted-foreground transition-colors duration-200"
              >
                <WhatsAppIcon size={16} />
                <span>{t("studio.whatsapp")}</span>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-lg overflow-hidden h-[400px] lg:h-auto"
          >
            <iframe
              title="Lowkey Tattoo Location"
              src="https://maps.google.com/maps?q=Calle+Doctor+Allart+50,+38003+Santa+Cruz+de+Tenerife,+Spain&z=17&output=embed"
              className="w-full h-full border-0 grayscale invert rounded-lg"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ minHeight: "400px" }}
            />
          </motion.div>
        </div>

        {/* Contact form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 bg-card rounded-lg p-8 card-glow"
        >
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare size={16} className="text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground tracking-[0.1em] uppercase">
              {t("contact.form.title")}
            </span>
          </div>

          {sent ? (
            <p className="font-mono text-sm text-foreground">{t("contact.form.success")}</p>
          ) : (
            <form onSubmit={handleContactSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  {t("contact.form.name")} *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("contact.form.placeholder.name")}
                  className="bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  {t("contact.form.contact")} *
                </label>
                <input
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={t("contact.form.placeholder.contact")}
                  className="bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  {t("contact.form.message")} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("contact.form.placeholder.message")}
                  className="bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase disabled:opacity-60"
                >
                  {sending ? t("contact.form.sending") : t("contact.form.submit")}
                </button>
              </div>
            </form>
          )}
        </motion.div>

      </div>
    </section>
  );
};

export default StudioInfo;
