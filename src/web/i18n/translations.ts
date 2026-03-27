export type Locale = "en" | "es";

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Nav
    "nav.gallery": "Gallery",
    "nav.studio": "Studio",
    "nav.location": "Location",
    "nav.book": "Request Appointment",

    // Hero
    "hero.coords": "28.4636° N, 16.2518° W",
    "hero.h1.1": "Tattoos in Tenerife",
    "hero.h1.2": "",
    "hero.sub.1": "Lowkey Tattoo Studio — Santa Cruz de Tenerife.",
    "hero.sub.2": "Custom designs, lowkey environment, high-end results.",

    // Cookies
    "cookies.title": "Cookie Notice",
    "cookies.desc": "We use analytics and marketing cookies to improve your experience and show you relevant content. You can accept all or decline non-essential cookies.",
    "cookies.accept": "Accept All",
    "cookies.decline": "Essential Only",

    // Gallery
    "gallery.label": "The Work",
    "gallery.title": "Tattoos & Piercing in Tenerife",
    "gallery.all": "All",
    "gallery.fineline": "[01] Fine Line",
    "gallery.blackwork": "[02] Blackwork",
    "gallery.piercing": "[03] Piercing",
    "gallery.cat.tattoo": "Tattoo",
    "gallery.cat.piercing": "Piercing",
    "gallery.cat.laser": "Laser",
    "gallery.back": "Back",
    "gallery.artists.title": "Our Artists",
    "gallery.artist.ig": "View Instagram",
    "gallery.piercing.title": "Piercing",
    "gallery.laser.title": "Laser Removal",
    "gallery.laser.soon": "Coming Soon",
    "gallery.laser.desc": "Laser tattoo removal service — contact us for more info.",

    // Studio
    "studio.label": "The Studio",
    "studio.title": "Find Us",
    "studio.hours": "Hours",
    "studio.monday": "Monday",
    "studio.tuesday": "Tuesday",
    "studio.wednesday": "Wednesday",
    "studio.thursday": "Thursday",
    "studio.friday": "Friday",
    "studio.saturday": "Saturday",
    "studio.sunday": "Sunday",
    "studio.closed": "Closed",

    // Instagram
    "instagram.label": "Instagram",
    "instagram.title": "Follow Our Work",
    "instagram.cta": "See more on Instagram",
    "instagram.error": "Could not load posts. Visit us on Instagram.",

    // Footer
    "footer.copy": "Lowkey Tattoo. Santa Cruz de Tenerife.",

    // Booking modal
    "booking.step1.label": "Step 1 / 3",
    "booking.step1.title": "Choose your artist",
    "booking.step2.label": "Step 2 / 3",
    "booking.step2.title": "Date & Time",
    "booking.step2.slots": "Available slots",
    "booking.step2.selectDay": "Select a day to see available slots",
    "booking.step2.unavailable": "Indicative schedule — the artist will confirm availability",
    "booking.step3.label": "Step 3 / 3",
    "booking.step3.title": "Your Details",
    "booking.step4.title": "Request Sent!",
    "booking.step4.message": "Your request has been sent. {{artist}} will contact you to confirm.",
    "booking.back": "Back",
    "booking.continue": "Continue",
    "booking.submit": "Send Request",
    "booking.sending": "Sending...",
    "booking.close": "Close",
    "booking.fields.name": "Full Name",
    "booking.fields.phone": "Phone",
    "booking.fields.email": "Email",
    "booking.fields.description": "Tattoo Description",
    "booking.fields.bodyZone": "Body Zone",
    "booking.fields.isFirstTime": "First time at the studio?",
    "booking.zones.arm": "Arm",
    "booking.zones.leg": "Leg",
    "booking.zones.back": "Back",
    "booking.zones.chest": "Chest",
    "booking.zones.neck": "Neck",
    "booking.zones.other": "Other",
    "booking.summary.artist": "Artist",
    "booking.summary.date": "Date",
    "booking.summary.time": "Time",
    "booking.whatsapp": "Contact via WhatsApp",

    // Studio
    "studio.whatsapp": "Book via WhatsApp",
  },
  es: {
    // Nav
    "nav.gallery": "Galería",
    "nav.studio": "Estudio",
    "nav.location": "Ubicación",
    "nav.book": "Solicitar Cita",

    // Hero
    "hero.coords": "28.4636° N, 16.2518° O",
    "hero.h1.1": "Tatuajes en Tenerife",
    "hero.h1.2": "",
    "hero.sub.1": "Lowkey Tattoo — Santa Cruz de Tenerife.",
    "hero.sub.2": "Diseños personalizados, ambiente discreto, resultados de alta gama.",

    // Cookies
    "cookies.title": "Aviso de cookies",
    "cookies.desc": "Usamos cookies analíticas y de marketing para mejorar tu experiencia y mostrarte contenido relevante. Puedes aceptar todas o rechazar las no esenciales.",
    "cookies.accept": "Aceptar todo",
    "cookies.decline": "Solo esenciales",

    // Gallery
    "gallery.label": "Nuestro Trabajo",
    "gallery.title": "Tatuajes y Piercing en Tenerife",
    "gallery.all": "Todo",
    "gallery.fineline": "[01] Línea Fina",
    "gallery.blackwork": "[02] Blackwork",
    "gallery.piercing": "[03] Piercing",
    "gallery.cat.tattoo": "Tattoo",
    "gallery.cat.piercing": "Piercing",
    "gallery.cat.laser": "Láser",
    "gallery.back": "Volver",
    "gallery.artists.title": "Nuestros Artistas",
    "gallery.artist.ig": "Ver Instagram",
    "gallery.piercing.title": "Piercing",
    "gallery.laser.title": "Eliminación Láser",
    "gallery.laser.soon": "Próximamente",
    "gallery.laser.desc": "Servicio de eliminación de tatuajes con láser — contáctanos para más información.",

    // Studio
    "studio.label": "El Estudio",
    "studio.title": "Encuéntranos",
    "studio.hours": "Horario",
    "studio.monday": "Lunes",
    "studio.tuesday": "Martes",
    "studio.wednesday": "Miércoles",
    "studio.thursday": "Jueves",
    "studio.friday": "Viernes",
    "studio.saturday": "Sábado",
    "studio.sunday": "Domingo",
    "studio.closed": "Cerrado",

    // Instagram
    "instagram.label": "Instagram",
    "instagram.title": "Síguenos",
    "instagram.cta": "Ver más en Instagram",
    "instagram.error": "No se pudieron cargar las fotos. Visítanos en Instagram.",

    // Footer
    "footer.copy": "Lowkey Tattoo. Santa Cruz de Tenerife.",

    // Booking modal
    "booking.step1.label": "Paso 1 / 3",
    "booking.step1.title": "Elige tu tatuador",
    "booking.step2.label": "Paso 2 / 3",
    "booking.step2.title": "Fecha y Hora",
    "booking.step2.slots": "Slots disponibles",
    "booking.step2.selectDay": "Selecciona un día para ver los horarios disponibles",
    "booking.step2.unavailable": "Horario orientativo — el tatuador confirmará disponibilidad",
    "booking.step3.label": "Paso 3 / 3",
    "booking.step3.title": "Tus Datos",
    "booking.step4.title": "¡Solicitud enviada!",
    "booking.step4.message": "Tu solicitud ha sido enviada. {{artist}} te contactará para confirmar.",
    "booking.back": "Atrás",
    "booking.continue": "Continuar",
    "booking.submit": "Enviar Solicitud",
    "booking.sending": "Enviando...",
    "booking.close": "Cerrar",
    "booking.fields.name": "Nombre completo",
    "booking.fields.phone": "Teléfono",
    "booking.fields.email": "Email",
    "booking.fields.description": "Descripción del tatuaje",
    "booking.fields.bodyZone": "Zona del cuerpo",
    "booking.fields.isFirstTime": "¿Primera vez en el estudio?",
    "booking.zones.arm": "Brazo",
    "booking.zones.leg": "Pierna",
    "booking.zones.back": "Espalda",
    "booking.zones.chest": "Pecho",
    "booking.zones.neck": "Cuello",
    "booking.zones.other": "Otro",
    "booking.summary.artist": "Artista",
    "booking.summary.date": "Fecha",
    "booking.summary.time": "Hora",
    "booking.whatsapp": "Contactar por WhatsApp",

    // Studio
    "studio.whatsapp": "Reservar por WhatsApp",
  },
};
