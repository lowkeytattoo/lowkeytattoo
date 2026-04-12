import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useBooking } from "@web/contexts/BookingContext";
import { Artist } from "@shared/config/artists";
import { useArtistsWithServices } from "@web/hooks/useArtistServices";
import { sendBookingRequest } from "@web/lib/email";
import { trackBookingStep, trackBookingSubmit } from "@web/lib/analytics";
import { ArtistStep } from "@web/components/booking/ArtistStep";
import { DateTimeStep } from "@web/components/booking/DateTimeStep";
import { DetailsStep, DetailsFormValues } from "@web/components/booking/DetailsStep";
import { SuccessStep } from "@web/components/booking/SuccessStep";
import { cn } from "@shared/lib/utils";
import type { ServiceType } from "@shared/types/index";

type Step = 1 | 2 | 3 | 4;

interface PartialBooking {
  artist: Artist | null;
  serviceType: ServiceType;
  date: Date | null;
  details: DetailsFormValues | null;
}

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
};

export const BookingModal = () => {
  const { isOpen, closeModal } = useBooking();
  const artistsWithServices = useArtistsWithServices();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [booking, setBooking] = useState<PartialBooking>({
    artist: null,
    serviceType: "tattoo",
    date: null,
    details: null,
  });

  const goTo = (next: Step) => {
    if (next > step && next <= 3) trackBookingStep(step as 1 | 2 | 3);
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleClose = () => {
    closeModal();
    setTimeout(() => {
      setStep(1);
      setBooking({ artist: null, serviceType: "tattoo", date: null, details: null });
    }, 300);
  };

  const handleArtistSelect = (artist: Artist) => {
    const serviceType: ServiceType =
      artist.services.length === 1 ? artist.services[0] : booking.serviceType;
    setBooking((prev) => ({ ...prev, artist, serviceType, date: null }));
  };

  const handleServiceSelect = (serviceType: ServiceType) => {
    setBooking((prev) => ({ ...prev, serviceType }));
  };

  const handleSubmit = async (details: DetailsFormValues) => {
    if (!booking.artist || !booking.date) return;
    setIsSubmitting(true);
    try {
      await sendBookingRequest({
        artistName: booking.artist.name,
        artistEmail: booking.artist.email,
        serviceType: booking.serviceType,
        clientName: details.clientName,
        clientPhone: details.clientPhone,
        clientEmail: details.clientEmail,
        date: format(booking.date, "dd/MM/yyyy"),
        time: "",
        description: details.description,
        bodyZone: details.bodyZone,
        isFirstTime: details.isFirstTime,
      });
      trackBookingSubmit(booking.artist?.name ?? "Unknown");
      setBooking((prev) => ({ ...prev, details }));
      goTo(4);
    } catch {
      setBooking((prev) => ({ ...prev, details }));
      goTo(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-card border-border max-w-lg w-full p-0 overflow-hidden gap-0">
        {/* Progress bar */}
        {step < 4 && (
          <div className="flex gap-1.5 px-6 pt-5 pb-0">
            {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors duration-300",
                  i < step ? "bg-foreground" : "bg-border"
                )}
              />
            ))}
          </div>
        )}

        <div className="p-6 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {step === 1 && (
                <ArtistStep
                  artists={artistsWithServices}
                  selected={booking.artist}
                  selectedService={
                    booking.artist && booking.artist.services.length > 1
                      ? booking.serviceType
                      : null
                  }
                  onSelect={handleArtistSelect}
                  onServiceSelect={handleServiceSelect}
                  onContinue={() => goTo(2)}
                />
              )}

              {step === 2 && booking.artist && (
                <DateTimeStep
                  artist={booking.artist}
                  selectedDate={booking.date}
                  onDateChange={(date) => setBooking((prev) => ({ ...prev, date }))}
                  onContinue={() => goTo(3)}
                  onBack={() => goTo(1)}
                />
              )}

              {step === 3 && (
                <DetailsStep
                  serviceType={booking.serviceType}
                  defaultValues={booking.details ?? undefined}
                  onSubmit={handleSubmit}
                  onBack={() => goTo(2)}
                  isSubmitting={isSubmitting}
                />
              )}

              {step === 4 && booking.artist && booking.date && (
                <SuccessStep
                  artist={booking.artist}
                  serviceType={booking.serviceType}
                  date={booking.date}
                  onClose={handleClose}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
