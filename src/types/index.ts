export type UserRole = 'admin' | 'operator' | 'client';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  country?: string;
  locale?: string;
  currency?: string;
};

export type Client = {
  id: string;
  name: string;
  manager?: string;
  phone?: string;
  whatsapp?: string;
  crop: string;
  area: number;
  location: string;
  /** Coordenada WGS84 de la finca (opcional). */
  latitude?: number | null;
  longitude?: number | null;
  /** Notas internas del equipo comercial / operaciones. */
  internal_notes?: string | null;
  /** Polígono del lote en WGS84: JSON [{latitude,longitude},...] (cerrado). */
  field_polygon?: string | null;
  status?: 'active' | 'paused' | 'at-risk';
  score?: number;
  owner_id: string;
  created_at: string;
  updated_at?: string;
};

export type Flight = {
  id: string;
  client_id: string;
  user_id: string;
  area_covered: number;
  duration: number;
  date: string;
  /** Lote / talhão o nombre de campo. */
  farm_name?: string | null;
  drone?: string;
  pilot?: string;
  weather?: string;
  wind?: string;
  battery_usage?: string;
  consumption?: string;
  notes?: string;
  /** Descripción legible de la ruta. */
  route?: string;
  /** JSON: [{ "latitude": number, "longitude": number }, ...] */
  route_coordinates?: string | null;
  created_at: string;
  updated_at?: string;
};

export type Farm = {
  id: string;
  name: string;
  location: string;
  area: number;
  crop: string;
  owner_id: string;
  created_at: string;
  updated_at?: string;
};

export type Agrochemical = {
  id: string;
  product: string;
  application_rate: number;
  total_used: number;
  batch: string;
  expiry_date: string;
  mixture: string;
  stock: number;
  /** Costo unitario referencial en USD (insumo). */
  unit_cost_usd?: number | null;
  owner_id: string;
  created_at: string;
};

export type Expense = {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  vendor: string;
  owner_id: string;
  created_at: string;
};

export type LanguageOption = 'es' | 'en' | 'pt';
export type CurrencyOption = 'USD' | 'BOB' | 'BRL' | 'ARS' | 'EUR';
export type CountryOption = 'BO' | 'US' | 'BR' | 'AR' | 'EU';

export type LocalizationState = {
  language: LanguageOption;
  currency: CurrencyOption;
  country: CountryOption;
  setLanguage: (value: LanguageOption) => void;
  setCurrency: (value: CurrencyOption) => void;
  setCountry: (value: CountryOption) => void;
  t: (key: string) => string;
  /** `value` en moneda base USD → cadena en la moneda seleccionada. */
  formatCurrency: (value: number) => string;
  /** Monto interno USD → número en moneda mostrada (p. ej. gráficos). */
  convertFromUsd: (value: number) => number;
  /** Monto en moneda seleccionada → USD (p. ej. al guardar un gasto). */
  convertToUsd: (value: number) => number;
  /** Convierte entre cualquier par soportado, usando USD como moneda pivote. */
  convertCurrency: (value: number, from: CurrencyOption, to: CurrencyOption) => number;
  formatDate: (value: string | Date) => string;
};

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Client, 'id' | 'created_at'>>;
      };
      flights: {
        Row: Flight;
        Insert: Omit<Flight, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Flight, 'id' | 'created_at'>>;
      };
      farms: {
        Row: Farm;
        Insert: Omit<Farm, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Farm, 'id' | 'created_at'>>;
      };
      agrochemicals: {
        Row: Agrochemical;
        Insert: Omit<Agrochemical, 'id' | 'created_at'>;
        Update: Partial<Omit<Agrochemical, 'id' | 'created_at'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at'>>;
      };
    };
  };
};
