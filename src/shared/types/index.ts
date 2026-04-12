export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ServiceType = "tattoo" | "piercing" | "laser";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Client, "id" | "created_at">>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, "id" | "created_at">;
        Update: Partial<Omit<Session, "id" | "created_at">>;
      };
      client_photos: {
        Row: ClientPhoto;
        Insert: Omit<ClientPhoto, "id" | "created_at">;
        Update: Partial<Omit<ClientPhoto, "id" | "created_at">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at">;
        Update: Partial<Omit<Product, "id" | "created_at">>;
      };
      stock_movements: {
        Row: StockMovement;
        Insert: Omit<StockMovement, "id" | "created_at">;
        Update: Partial<Omit<StockMovement, "id" | "created_at">>;
      };
      web_bookings: {
        Row: WebBooking;
        Insert: Omit<WebBooking, "id" | "created_at">;
        Update: Partial<Omit<WebBooking, "id" | "created_at">>;
      };
      blog_posts: {
        Row: BlogPost;
        Insert: Omit<BlogPost, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<BlogPost, "id" | "created_at">>;
      };
    };
  };
}

export interface Profile {
  id: string;
  display_name: string;
  role: "owner" | "artist";
  artist_config_id: string | null;
  avatar_url: string | null;
  available_services: ServiceType[] | null;
  calendar_id: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  allergies: string | null;
  birthday: string | null;
  primary_artist_id: string | null;
  created_at: string;
  updated_at: string;
}

export type SessionType = "tattoo" | "piercing" | "laser" | "retoque";

export interface Session {
  id: string;
  client_id: string;
  artist_id: string | null;
  date: string;
  type: SessionType;
  price: number | null;
  deposit: number;
  paid: boolean;
  duration_minutes: number | null;
  body_zone: string | null;
  style: string | null;
  notes: string | null;
  created_at: string;
}

export interface ClientPhoto {
  id: string;
  client_id: string;
  session_id: string | null;
  storage_path: string;
  description: string | null;
  is_cover: boolean;
  created_at: string;
}

export type ProductCategory =
  | "tinta"
  | "aguja"
  | "piercing_joyeria"
  | "cuidado"
  | "higiene"
  | "equipo"
  | "otro";

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: ProductCategory | null;
  quantity: number;
  min_quantity: number;
  unit: string;
  price_per_unit: number | null;
  notes: string | null;
  created_at: string;
}

export type StockMovementType = "entrada" | "salida" | "ajuste";

export interface StockMovement {
  id: string;
  product_id: string;
  quantity_change: number;
  type: StockMovementType;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export type WebBookingStatus = "pending" | "confirmed" | "cancelled";

export interface WebBooking {
  id: string;
  artist_config_id: string | null;
  service_type: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  description: string | null;
  body_zone: string | null;
  is_first_time: boolean | null;
  status: WebBookingStatus;
  created_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  excerpt: string | null;
  content: string;
  tags: string[];
  published: boolean;
  date: string;
  created_at: string;
  updated_at: string;
}

// ─── Join types (Supabase queries con relaciones) ─────────────────────────────

export type SessionWithRelations = Session & {
  client: { id: string; name: string } | null;
  artist: { id: string; display_name: string } | null;
};

export type ClientWithArtist = Client & {
  primary_artist: { id: string; display_name: string } | null;
};
