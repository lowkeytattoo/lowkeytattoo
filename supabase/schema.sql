-- ============================================================
-- Lowkey Tattoo — Supabase Schema
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'artist')) DEFAULT 'artist',
  artist_config_id TEXT,        -- "pablo" | "sergio" | "fifo"
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 'artist');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Clients
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  allergies TEXT,
  birthday DATE,
  primary_artist_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('tattoo', 'piercing', 'laser', 'retoque')) DEFAULT 'tattoo',
  price DECIMAL(10,2),
  deposit DECIMAL(10,2) DEFAULT 0,
  paid BOOLEAN DEFAULT false,
  duration_minutes INTEGER,
  body_zone TEXT,
  style TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client photos (Supabase Storage)
CREATE TABLE client_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  storage_path TEXT NOT NULL,
  description TEXT,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (stock)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT CHECK (category IN ('tinta', 'aguja', 'piercing_joyeria', 'cuidado', 'higiene', 'equipo', 'otro')),
  quantity DECIMAL(10,3) DEFAULT 0,
  min_quantity DECIMAL(10,3) DEFAULT 0,
  unit TEXT DEFAULT 'ud',
  price_per_unit DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock movements
CREATE TABLE stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity_change DECIMAL(10,3) NOT NULL,
  type TEXT CHECK (type IN ('entrada', 'salida', 'ajuste')) DEFAULT 'salida',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Web bookings (from public booking form)
CREATE TABLE web_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_config_id TEXT,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  description TEXT,
  body_zone TEXT,
  is_first_time BOOLEAN,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_bookings ENABLE ROW LEVEL SECURITY;

-- profiles: all authenticated users can read, own row update
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- clients: owners full access, artists only their clients
CREATE POLICY "clients_owner_all" ON clients FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'owner');
CREATE POLICY "clients_artist_own" ON clients FOR ALL TO authenticated
  USING (primary_artist_id = auth.uid());

-- sessions: owners full, artists their own
CREATE POLICY "sessions_owner_all" ON sessions FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'owner');
CREATE POLICY "sessions_artist_own" ON sessions FOR ALL TO authenticated
  USING (artist_id = auth.uid());

-- client_photos: owners full, artists via their sessions
CREATE POLICY "photos_owner_all" ON client_photos FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'owner');
CREATE POLICY "photos_artist_own" ON client_photos FOR ALL TO authenticated
  USING (
    session_id IN (SELECT id FROM sessions WHERE artist_id = auth.uid())
    OR client_id IN (SELECT id FROM clients WHERE primary_artist_id = auth.uid())
  );

-- products: owners full, artists select only
CREATE POLICY "products_owner_all" ON products FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'owner');
CREATE POLICY "products_artist_select" ON products FOR SELECT TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'artist');

-- stock_movements: owners full, artists insert only
CREATE POLICY "stock_owner_all" ON stock_movements FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'owner');
CREATE POLICY "stock_artist_insert" ON stock_movements FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'artist');

-- web_bookings: owners full, artists see their own
CREATE POLICY "bookings_owner_all" ON web_bookings FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'owner');
CREATE POLICY "bookings_artist_own" ON web_bookings FOR SELECT TO authenticated
  USING (
    artist_config_id = (SELECT artist_config_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "bookings_artist_update" ON web_bookings FOR UPDATE TO authenticated
  USING (
    artist_config_id = (SELECT artist_config_id FROM profiles WHERE id = auth.uid())
  );
-- Allow anonymous inserts from web form
CREATE POLICY "bookings_anon_insert" ON web_bookings FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- Storage: client-photos bucket
-- ============================================================
-- Run in Supabase dashboard Storage section or via CLI:
-- supabase storage create client-photos --private
-- Policy: authenticated users can access clients/{client_id}/*
