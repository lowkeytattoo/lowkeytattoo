import type { ServiceType } from "@shared/types/index";

export interface Artist {
  id: string;
  slug: string;
  name: string;
  handle: string;
  email: string;
  calendarId: string;
  styles: string[];
  services: ServiceType[];
  hidden?: boolean;
  nif?: string;
  phone?: string;
  hygienicSanitaryCert?: string;
}

export const PUBLIC_ARTISTS = (artists: Artist[]) => artists.filter((a) => !a.hidden);

export const ARTISTS: Artist[] = [
  {
    id: "pablo",
    slug: "pablo-matos",
    name: "Pablo Matos",
    handle: "@pablomatostattoo",
    email: "pablo@tattoolowkey.com",
    calendarId: "",
    styles: ["Fine Line", "Geometric", "Polynesian", "Dotwork", "Piercing", "Laser"],
    services: ["tattoo", "piercing", "laser"],
  },
  {
    id: "sergio",
    slug: "sergio",
    name: "Sergio",
    handle: "@bohemianttt",
    email: "sergio@tattoolowkey.com",
    calendarId: "",
    styles: ["Realism", "Blackwork"],
    services: ["tattoo"],
  },
  {
    id: "fifo",
    slug: "fifo",
    name: "Fifo",
    handle: "@fifo_punk",
    email: "fifo@tattoolowkey.com",
    calendarId: "",
    styles: ["Tradicional", "American Traditional"],
    services: ["tattoo"],
  },
  {
    id: "info",
    slug: "info",
    name: "Lowkey Tattoo",
    handle: "@lowkeytattootenerife",
    email: "info@tattoolowkey.com",
    calendarId: "lowkeytattootenerife@gmail.com",
    styles: [],
    services: ["tattoo", "piercing", "laser"],
    hidden: true,
  },
];
