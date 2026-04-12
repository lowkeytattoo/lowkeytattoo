import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n } from "@web/i18n/I18nProvider";
import { cn } from "@shared/lib/utils";
import type { ServiceType } from "@shared/types/index";

const detailsSchema = z.object({
  clientName: z.string().min(2, "Mínimo 2 caracteres"),
  clientPhone: z.string().min(6, "Teléfono inválido"),
  clientEmail: z.string().email("Email inválido"),
  description: z.string().min(10, "Mínimo 10 caracteres"),
  bodyZone: z.string().min(1, "Selecciona una zona"),
  isFirstTime: z.boolean(),
});

export type DetailsFormValues = z.infer<typeof detailsSchema>;

interface DetailsStepProps {
  serviceType: ServiceType;
  defaultValues?: Partial<DetailsFormValues>;
  onSubmit: (data: DetailsFormValues) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const BODY_ZONES = ["arm", "leg", "back", "chest", "neck", "other"] as const;

export const DetailsStep = ({ serviceType, defaultValues, onSubmit, onBack, isSubmitting }: DetailsStepProps) => {
  const { t } = useI18n();
  const descriptionLabel = t(`booking.fields.description.${serviceType}`);
  const descriptionPlaceholder = t(`booking.fields.description.placeholder.${serviceType}`);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      isFirstTime: false,
      ...defaultValues,
    },
  });

  const isFirstTime = watch("isFirstTime");

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full rounded-sm border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors",
      hasError ? "border-destructive focus:ring-destructive" : "border-border"
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-xs text-muted-foreground tracking-[0.12em] uppercase mb-1">
          {t("booking.step3.label")}
        </p>
        <h2 className="text-lg font-semibold text-foreground">{t("booking.step3.title")}</h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
            {t("booking.fields.name")} *
          </label>
          <input
            {...register("clientName")}
            className={inputClass(!!errors.clientName)}
            placeholder="Tu nombre completo"
          />
          {errors.clientName && (
            <p className="mt-1 text-xs text-destructive">{errors.clientName.message}</p>
          )}
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
              {t("booking.fields.phone")} *
            </label>
            <input
              {...register("clientPhone")}
              type="tel"
              className={inputClass(!!errors.clientPhone)}
              placeholder="+34 600 000 000"
            />
            {errors.clientPhone && (
              <p className="mt-1 text-xs text-destructive">{errors.clientPhone.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
              {t("booking.fields.email")} *
            </label>
            <input
              {...register("clientEmail")}
              type="email"
              className={inputClass(!!errors.clientEmail)}
              placeholder="tu@email.com"
            />
            {errors.clientEmail && (
              <p className="mt-1 text-xs text-destructive">{errors.clientEmail.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
            {descriptionLabel} *
          </label>
          <textarea
            {...register("description")}
            rows={3}
            className={cn(inputClass(!!errors.description), "resize-none")}
            placeholder={descriptionPlaceholder}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        {/* Body zone */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
            {t("booking.fields.bodyZone")}
          </label>
          <select
            {...register("bodyZone")}
            className={cn(inputClass(!!errors.bodyZone), "bg-card")}
          >
            <option value="">— Selecciona —</option>
            {BODY_ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {t(`booking.zones.${zone}`)}
              </option>
            ))}
          </select>
          {errors.bodyZone && (
            <p className="mt-1 text-xs text-destructive">{errors.bodyZone.message}</p>
          )}
        </div>

        {/* First time toggle */}
        <div className="flex items-center justify-between rounded-sm border border-border bg-card px-3 py-3">
          <label className="text-sm text-foreground cursor-pointer" htmlFor="isFirstTime">
            {t("booking.fields.isFirstTime")}
          </label>
          <button
            id="isFirstTime"
            type="button"
            role="switch"
            aria-checked={isFirstTime}
            onClick={() => setValue("isFirstTime", !isFirstTime)}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              isFirstTime ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200",
                isFirstTime ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-sm border border-border bg-transparent text-xs font-mono text-muted-foreground uppercase tracking-[0.1em] px-4 py-2.5 hover:border-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          {t("booking.back")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 cta-button rounded-sm text-xs tracking-[0.1em] uppercase disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isSubmitting ? t("booking.sending") : t("booking.submit")}
        </button>
      </div>
    </form>
  );
};
