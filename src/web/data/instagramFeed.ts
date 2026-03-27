/**
 * Static Instagram feed data — real posts from @tattoo.lowkey.
 *
 * Shape mirrors the Instagram Graph API response so switching to live data
 * only requires updating useInstagramFeed.ts.
 */

import img1 from "@/assets/IG/SaveClip.App_615062682_18548918890057477_6192388232569777066_n.jpg";
import img2 from "@/assets/IG/SaveClip.App_628262139_18313589008268610_5858521223976194281_n.jpg";
import vid1 from "@/assets/IG/SaveClip.App_AQN7bL5S7MGowDxV50f0eJb_W-YDikMgVo4PfwTBhWVeRltQHYb4HFDv26sVQluVWPXgnrDW_02zYvdkXhqaelxpWa38MDYugbIVHbA.mp4";
import vid2 from "@/assets/IG/SaveClip.App_AQNG2hlzk_e6qpmS-GbF6lS7R1PEK9Kmb7UjnT0WQ44TDj3x_m4xlpGN2xwQMZAThujV-hLdA3t3U2X8MjUx4_z6BIuYu-W61IRwif0.mp4";
import vid3 from "@/assets/IG/SaveClip.App_AQNHfpt23AIuF595L9vxbtDR6feFVysMIdXLmv9Z844rQdtXCe1y5eV-K2NFZ22nFxYhw-Ja5SLyL6RMDeII4SXqrCB9qdgiinwteL0.mp4";
import vid4 from "@/assets/IG/SaveClip.App_AQNXL2wmRcYszVT9_xb2Wh1usByKZbp__qboe8drbBw1fboyZrjiCZFoRcvBq2F6nlVEWPnx3zfXOxJH2XgA6G6J.mp4";
import vid5 from "@/assets/IG/SaveClip.App_AQNdPlYB1tiJ2EDBpoyWRi6K5L0wHPTXK3S_wuaQWZsrOuHzMaRHGZJrANphWd9dN8YFkgbhFy6TBXPItatPR3vxYeKQiJBR-8o-TdI.mp4";
import vid6 from "@/assets/IG/SaveClip.App_AQOSkPnLxwqXUD6X3Dm9ifWXlnPb8J_2GtqlsOF3FZZo2oihmDQCWQf4uiQ9L6sREkXBQbfcUPCraJ3KN3RiALnE.mp4";
import vid7 from "@/assets/IG/SaveClip.App_AQOtl_yXV9q0fgG_1Q0zlnd_D-uznnO9m0tJybyV0iN0-5JfIyjewRCUCx_NwRyLEFYbSQivKcMKrvhCX0VtXKtTBVLb1fWidMR8Za0.mp4";

export type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export interface InstagramPost {
  id: string;
  caption: string;
  media_type: MediaType;
  media_url: string;
  permalink: string;
  timestamp: string;
}

export const staticPosts: InstagramPost[] = [
  {
    id: "ig_01",
    caption: "Vegeta & Bulma. Real Love. Blackwork anime en muslo. 🖤 #blackwork #anime #dragonball #lowkeytattoo",
    media_type: "IMAGE",
    media_url: img1,
    permalink: "https://www.instagram.com/tattoo.lowkey/",
    timestamp: "2025-03-10T11:00:00+0000",
  },
  {
    id: "ig_02",
    caption: "Mujer tigre traditional. Color y carácter. 🐯 #traditional #colortattoo #tattootenerife",
    media_type: "IMAGE",
    media_url: img2,
    permalink: "https://www.instagram.com/tattoo.lowkey/",
    timestamp: "2025-03-05T10:30:00+0000",
  },
  {
    id: "ig_v1",
    caption: "El proceso es parte del arte. 🖊️ #tattooprocess #lowkeytattoo #tenerife",
    media_type: "VIDEO",
    media_url: vid1,
    permalink: "https://www.instagram.com/tattoo.lowkey/",
    timestamp: "2025-02-28T12:00:00+0000",
  },
  {
    id: "ig_v2",
    caption: "Trazo a trazo. Cada sesión cuenta. 🖤 #blackwork #tattooartist #santacruz",
    media_type: "VIDEO",
    media_url: vid2,
    permalink: "https://www.instagram.com/tattoo.lowkey/",
    timestamp: "2025-02-20T09:00:00+0000",
  },
  {
    id: "ig_v3",
    caption: "En progreso. El antes y después. ✨ #tattootenerife #lowkey #ink",
    media_type: "VIDEO",
    media_url: vid3,
    permalink: "https://www.instagram.com/tattoo.lowkey/",
    timestamp: "2025-02-14T11:00:00+0000",
  },
  {
    id: "ig_v4",
    caption: "Precisión en cada línea. #fineline #tattooprocess #lowkeytattoo",
    media_type: "VIDEO",
    media_url: vid4,
    permalink: "https://www.instagram.com/tattoo.lowkey/",
    timestamp: "2025-02-07T10:00:00+0000",
  },
  {
    id: "ig_v5",
    caption: "Blackwork en proceso. El negro nunca falla. 🖤 #blackwork #tattooartist",
    media_type: "VIDEO",
    media_url: vid5,
    permalink: "https://www.instagram.com/tattoo.lowkey/",
    timestamp: "2025-01-31T10:00:00+0000",
  },
  {
    id: "ig_v6",
    caption: "De boceto a piel. Diseño personalizado. ✏️ #custommtattoo #tenerife",
    media_type: "VIDEO",
    media_url: vid6,
    permalink: "https://www.instagram.com/tattoo.lowkey/",
    timestamp: "2025-01-24T10:00:00+0000",
  },
  {
    id: "ig_v7",
    caption: "Ambiente lowkey, resultados de alta gama. 🤫 #lowkeytattoo #tattoolife",
    media_type: "VIDEO",
    media_url: vid7,
    permalink: "https://www.instagram.com/tattoo.lowkey/",
    timestamp: "2025-01-17T10:00:00+0000",
  },
];
