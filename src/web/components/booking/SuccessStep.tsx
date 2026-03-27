import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useI18n } from "@web/i18n/I18nProvider";
import { Artist } from "@shared/config/artists";
import { TimeSlot } from "@web/hooks/useCalendarAvailability";
import { CONTACT } from "@web/config/contact";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SuccessStepProps {
  artist: Artist;
  date: Date;
  slot: TimeSlot;
  onClose: () => void;
}

export const SuccessStep = ({ artist, date, slot, onClose }: SuccessStepProps) => {
  const { t, locale } = useI18n();

  const formattedDate = format(date, "d 'de' MMMM yyyy", {
    locale: locale === "es" ? es : undefined,
  });

  const waMessage = encodeURIComponent(
    `Hola, acabo de enviar una solicitud de cita.\nArtista: ${artist.name}\nFecha: ${formattedDate}\nHora: ${slot.label}`
  );
  const waUrl = `${CONTACT.whatsapp}?text=${waMessage}`;

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex h-16 w-16 items-center justify-center rounded-full border border-foreground"
      >
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Check size={28} strokeWidth={1.5} className="text-foreground" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col gap-2"
      >
        <h2 className="text-xl font-semibold text-foreground">{t("booking.step4.title")}</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t("booking.step4.message").replace("{{artist}}", artist.name)}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="w-full rounded-md border border-border bg-card px-4 py-3 text-left"
      >
        <div className="flex flex-col gap-1.5">
          <Row label={t("booking.summary.artist")} value={artist.name} />
          <Row label={t("booking.summary.date")} value={formattedDate} />
          <Row label={t("booking.summary.time")} value={slot.label} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="flex flex-col gap-2 w-full"
      >
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full rounded-sm border border-border px-4 py-2.5 font-mono text-xs text-foreground tracking-[0.1em] uppercase hover:border-foreground transition-colors duration-200"
        >
          <WhatsAppIcon size={15} />
          {t("booking.whatsapp")}
        </a>
        <button
          onClick={onClose}
          className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase w-full"
        >
          {t("booking.close")}
        </button>
      </motion.div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
    <span className="text-sm text-foreground">{value}</span>
  </div>
);

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
