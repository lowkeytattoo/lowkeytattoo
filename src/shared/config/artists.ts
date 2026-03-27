export interface Artist {
  id: string;
  name: string;
  handle: string;
  email: string;
  calendarId: string;
  styles: string[];
}

export const ARTISTS: Artist[] = [
  {
    id: "pablo",
    name: "Pablo Matos",
    handle: "@pablomatostattoo",
    email: "pablo@lowkeytattoo.com",
    calendarId: "", // ← fill with real Google Calendar ID
    styles: ["Fine Line", "Geometric"],
  },
  {
    id: "sergio",
    name: "Sergio",
    handle: "@bohemianttt",
    email: "sergio@lowkeytattoo.com",
    calendarId: "",
    styles: ["Blackwork", "Dotwork"],
  },
  {
    id: "fifo",
    name: "Fifo",
    handle: "@fifo_punk",
    email: "fifo@lowkeytattoo.com",
    calendarId: "",
    styles: ["Blackwork", "Piercing"],
  },
];
