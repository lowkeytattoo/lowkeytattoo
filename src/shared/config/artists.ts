export interface Artist {
  id: string;
  name: string;
  handle: string;
  email: string;
  calendarId: string;
  styles: string[];
  laser?: boolean;
}

export const ARTISTS: Artist[] = [
  {
    id: "pablo",
    name: "Pablo Matos",
    handle: "@pablomatostattoo",
    email: "pablo@lowkeytattoo.com",
    calendarId: "", // ← fill with real Google Calendar ID
    styles: ["Fine Line", "Geometric", "Polynesian", "Dotwork", "Piercing", "Laser"],
    laser: true,
  },
  {
    id: "sergio",
    name: "Sergio",
    handle: "@bohemianttt",
    email: "sergio@lowkeytattoo.com",
    calendarId: "",
    styles: ["Realism", "Blackwork"],
  },
  {
    id: "fifo",
    name: "Fifo",
    handle: "@fifo_punk",
    email: "fifo@lowkeytattoo.com",
    calendarId: "",
    styles: ["Tradicional", "American Traditional"],
  },
];
