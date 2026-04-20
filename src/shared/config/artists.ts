import type { ServiceType } from "@shared/types/index";

export interface Artist {
  id: string;
  name: string;
  handle: string;
  email: string;
  calendarId: string;
  styles: string[];
  services: ServiceType[];
}

export const ARTISTS: Artist[] = [
  {
    id: "pablo",
    name: "Pablo Matos",
    handle: "@pablomatostattoo",
    email: "pablo@tattoolowkey.com",
    calendarId: "",
    styles: ["Fine Line", "Geometric", "Polynesian", "Dotwork", "Piercing", "Laser"],
    services: ["tattoo", "piercing", "laser"],
  },
  {
    id: "sergio",
    name: "Sergio",
    handle: "@bohemianttt",
    email: "sergio@tattoolowkey.com",
    calendarId: "",
    styles: ["Realism", "Blackwork"],
    services: ["tattoo"],
  },
  {
    id: "fifo",
    name: "Fifo",
    handle: "@fifo_punk",
    email: "fifo@tattoolowkey.com",
    calendarId: "",
    styles: ["Tradicional", "American Traditional"],
    services: ["tattoo"],
  },
  {
    id: "info",
    name: "Lowkey Tattoo",
    handle: "@lowkeytattootenerife",
    email: "info@tattoolowkey.com",
    calendarId: "lowkeytattootenerife@gmail.com",
    styles: [],
    services: ["tattoo", "piercing", "laser"],
  },
];
