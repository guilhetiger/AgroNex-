import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveOfflineRecord, initDatabase } from './localData';
import { sessionStorage } from './sessionStorage';
import { Agrochemical, Client, Database, Expense, Flight } from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const hasSupabaseConfig =
  !!SUPABASE_URL &&
  !!SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('placeholder') &&
  !SUPABASE_ANON_KEY.includes('placeholder');

const fallbackSupabaseUrl = 'https://placeholder.supabase.co';
const fallbackSupabaseKey = 'placeholder-anon-key';

export const supabase = createSupabaseClient<Database>(
  hasSupabaseConfig ? SUPABASE_URL : fallbackSupabaseUrl,
  hasSupabaseConfig ? SUPABASE_ANON_KEY : fallbackSupabaseKey,
  {
    auth: {
      storage: sessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

const now = new Date().toISOString();
const localKeys = {
  clients: 'AGRONEX_LOCAL_CLIENTS',
  flights: 'AGRONEX_LOCAL_FLIGHTS',
  agrochemicals: 'AGRONEX_LOCAL_AGROCHEMICALS',
  expenses: 'AGRONEX_LOCAL_EXPENSES',
  deletedClients: 'AGRONEX_DELETED_CLIENTS',
};

async function getLocalRecords<T>(key: string) {
  const saved = await AsyncStorage.getItem(key);
  return saved ? (JSON.parse(saved) as T[]) : [];
}

async function saveLocalRecord<T extends { id: string }>(key: string, payload: T) {
  const records = await getLocalRecords<T>(key);
  const nextRecords = [payload, ...records.filter((record) => record.id !== payload.id)];
  await AsyncStorage.setItem(key, JSON.stringify(nextRecords));
  return payload;
}

async function deleteLocalRecord<T extends { id: string }>(key: string, id: string) {
  const records = await getLocalRecords<T>(key);
  await AsyncStorage.setItem(key, JSON.stringify(records.filter((record) => record.id !== id)));
}

async function savePendingOfflineRecord(tableName: string, payload: Record<string, any>) {
  try {
    await initDatabase();
    await saveOfflineRecord(tableName, payload);
  } catch (error) {
    console.warn('Unable to save offline sync record', error);
  }
}

async function mergeRemoteAndLocalRecords<T extends { id: string; created_at: string }>(
  remote: T[] | null,
  local: T[],
  deletedIds: Set<string>
) {
  const merged = new Map<string, T>();
  for (const item of [...local, ...(remote ?? [])]) {
    if (!deletedIds.has(item.id)) {
      merged.set(item.id, item);
    }
  }
  return Array.from(merged.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

const demoFieldPolygon1 = JSON.stringify([
  { latitude: -16.4885, longitude: -68.121 },
  { latitude: -16.491, longitude: -68.118 },
  { latitude: -16.49, longitude: -68.1155 },
  { latitude: -16.4878, longitude: -68.1175 },
  { latitude: -16.4885, longitude: -68.121 },
]);

function getDemoClients(userId: string) {
  return [
    {
      id: 'demo-client-1',
      name: 'Finca San Miguel',
      manager: 'Carlos Rojas',
      phone: '+591 70000001',
      whatsapp: '+591 70000001',
      crop: 'Soya',
      area: 86,
      location: 'Santa Cruz, Bolivia',
      latitude: -16.4897,
      longitude: -68.1193,
      internal_notes: 'Prioridad alta en ventana seca. Coordinar con agrónomo local.',
      field_polygon: demoFieldPolygon1,
      status: 'active' as const,
      score: 91,
      owner_id: userId,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-client-2',
      name: 'Agro Norte',
      manager: 'Mariana Vaca',
      phone: '+591 70000002',
      whatsapp: '+591 70000002',
      crop: 'Maiz',
      area: 124,
      location: 'Montero, Bolivia',
      latitude: -17.3383,
      longitude: -63.2505,
      internal_notes: null,
      field_polygon: null,
      status: 'paused' as const,
      score: 74,
      owner_id: userId,
      created_at: now,
      updated_at: now,
    },
  ];
}

const demoRoute1 = JSON.stringify([
  { latitude: -16.4897, longitude: -68.1193 },
  { latitude: -16.4885, longitude: -68.118 },
  { latitude: -16.4875, longitude: -68.12 },
]);

function getDemoFlights(userId: string) {
  return [
    {
      id: 'demo-flight-1',
      client_id: 'demo-client-1',
      user_id: userId,
      area_covered: 38,
      duration: 52,
      date: now,
      farm_name: 'Lote Norte · Sector A',
      drone: 'DJI Agras T40',
      pilot: 'Equipo AgroNex',
      weather: 'Despejado',
      wind: '8 km/h',
      battery_usage: '68%',
      consumption: '42 L',
      notes: 'Aplicacion uniforme sin incidencias.',
      route: 'Ruta GPS registrada',
      route_coordinates: demoRoute1,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-flight-2',
      client_id: 'demo-client-2',
      user_id: userId,
      area_covered: 44,
      duration: 64,
      date: now,
      farm_name: 'Central · Talhão 3',
      drone: 'DJI Agras T30',
      pilot: 'Equipo AgroNex',
      weather: 'Nublado',
      wind: '11 km/h',
      battery_usage: '74%',
      consumption: '49 L',
      notes: 'Revisar humedad antes de la siguiente pasada.',
      route: 'Ruta GPS registrada',
      route_coordinates: demoRoute1,
      created_at: now,
      updated_at: now,
    },
  ];
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }
    }
  });
  if (error) throw error;
  return data.user;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchClientData(userId: string) {
  const localClients = await getLocalRecords<Client>(localKeys.clients);
  const deletedClientIds = await getLocalRecords<{ id: string }>(localKeys.deletedClients);
  const deletedSet = new Set(deletedClientIds.map((item) => item.id));

  if (!hasSupabaseConfig) {
    return [...localClients.filter((client) => client.owner_id === userId), ...getDemoClients(userId)]
      .filter((client) => !deletedSet.has(client.id));
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mergeRemoteAndLocalRecords<Client>(data, localClients.filter((client) => client.owner_id === userId), deletedSet);
}


export async function fetchFlightData(userId: string) {
  const localFlights = await getLocalRecords<Flight>(localKeys.flights);
  const deletedClientIds = await getLocalRecords<{ id: string }>(localKeys.deletedClients);
  const deletedSet = new Set(deletedClientIds.map((item) => item.id));

  if (!hasSupabaseConfig) {
    return [...localFlights.filter((flight) => flight.user_id === userId), ...getDemoFlights(userId)]
      .filter((flight) => !deletedSet.has(flight.client_id));
  }

  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mergeRemoteAndLocalRecords<Flight>(data, localFlights.filter((flight) => flight.user_id === userId), deletedSet);
}


export async function fetchFarmData(userId: string) {
  if (!hasSupabaseConfig) {
    return getDemoClients(userId).map((client) => ({
      id: client.id.replace('client', 'farm'),
      name: client.name,
      location: client.location,
      area: client.area,
      crop: client.crop,
      owner_id: userId,
      created_at: client.created_at,
      updated_at: client.updated_at,
    }));
  }

  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchAgrochemicalData(userId: string) {
  const localChemicals = await getLocalRecords<Agrochemical>(localKeys.agrochemicals);

  if (!hasSupabaseConfig) {
    return [
      ...localChemicals.filter((item) => item.owner_id === userId),
      {
        id: 'demo-agrochemical-1',
        product: 'Fungicida Protect',
        application_rate: 1.2,
        total_used: 18,
        batch: 'AGX-2401',
        expiry_date: '2026-12-31',
        mixture: 'Agua + coadyuvante',
        stock: 64,
        unit_cost_usd: 4.25,
        owner_id: userId,
        created_at: now,
      },
    ];
  }

  const { data, error } = await supabase
    .from('agrochemicals')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mergeRemoteAndLocalRecords<Agrochemical>(data, localChemicals.filter((item) => item.owner_id === userId), new Set());
}


export async function fetchExpenseData(userId: string) {
  const localExpenses = await getLocalRecords<Expense>(localKeys.expenses);

  if (!hasSupabaseConfig) {
    return [
      ...localExpenses.filter((item) => item.owner_id === userId),
      {
        id: 'demo-expense-1',
        category: 'Combustible',
        amount: 420,
        date: now,
        description: 'Operacion de vuelos demostrativos',
        vendor: 'Proveedor local',
        owner_id: userId,
        created_at: now,
      },
    ];
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('owner_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return mergeRemoteAndLocalRecords<Expense>(data, localExpenses.filter((item) => item.owner_id === userId), new Set());
}


export async function createClient(clientData: {
  name: string;
  crop: string;
  area: number;
  location: string;
  owner_id: string;
  manager?: string;
  phone?: string;
  whatsapp?: string;
  status?: 'active' | 'paused' | 'at-risk';
  latitude?: number | null;
  longitude?: number | null;
  internal_notes?: string | null;
  field_polygon?: string | null;
}) {
  const localId = `local-client-${Date.now()}`;
  const localPayload: Client = {
    id: localId,
    status: clientData.status ?? 'active',
    score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...clientData,
  };

  if (!hasSupabaseConfig) {
    return saveLocalRecord<Client>(localKeys.clients, localPayload);
  }

  try {
    const { data, error } = await (supabase.from('clients' as const) as any)
      .insert(clientData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    await saveLocalRecord<Client>(localKeys.clients, localPayload);
    await savePendingOfflineRecord('clients', clientData);
    return localPayload;
  }
}

export async function createFlight(flightData: {
  client_id: string;
  user_id: string;
  area_covered: number;
  duration: number;
  date: string;
  notes?: string;
  drone?: string;
  pilot?: string;
  weather?: string;
  wind?: string;
  battery_usage?: string;
  consumption?: string;
  route?: string;
  farm_name?: string | null;
  route_coordinates?: string | null;
}) {
  const localId = `local-flight-${Date.now()}`;
  const localPayload: Flight = {
    id: localId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...flightData,
  };

  if (!hasSupabaseConfig) {
    return saveLocalRecord<Flight>(localKeys.flights, localPayload);
  }

  try {
    const { data, error } = await (supabase.from('flights' as const) as any)
      .insert(flightData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    await saveLocalRecord<Flight>(localKeys.flights, localPayload);
    await savePendingOfflineRecord('flights', flightData);
    return localPayload;
  }
}

export async function createAgrochemical(chemicalData: {
  product: string;
  application_rate: number;
  total_used: number;
  batch: string;
  expiry_date: string;
  mixture: string;
  stock: number;
  owner_id: string;
  unit_cost_usd?: number | null;
}) {
  const localId = `local-agrochemical-${Date.now()}`;
  const localPayload: Agrochemical = {
    id: localId,
    created_at: new Date().toISOString(),
    ...chemicalData,
  };

  if (!hasSupabaseConfig) {
    return saveLocalRecord<Agrochemical>(localKeys.agrochemicals, localPayload);
  }

  try {
    const { data, error } = await (supabase.from('agrochemicals' as const) as any)
      .insert(chemicalData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    await saveLocalRecord<Agrochemical>(localKeys.agrochemicals, localPayload);
    await savePendingOfflineRecord('agrochemicals', chemicalData);
    return localPayload;
  }
}

export async function createExpense(expenseData: {
  category: string;
  amount: number;
  date: string;
  description: string;
  vendor: string;
  owner_id: string;
}) {
  const localId = `local-expense-${Date.now()}`;
  const localPayload: Expense = {
    id: localId,
    created_at: new Date().toISOString(),
    ...expenseData,
  };

  if (!hasSupabaseConfig) {
    return saveLocalRecord<Expense>(localKeys.expenses, localPayload);
  }

  try {
    const { data, error } = await (supabase.from('expenses' as const) as any)
      .insert(expenseData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    await saveLocalRecord<Expense>(localKeys.expenses, localPayload);
    await savePendingOfflineRecord('expenses', expenseData);
    return localPayload;
  }
}

export async function deleteClient(clientId: string) {
  if (!hasSupabaseConfig) {
    await saveLocalRecord(localKeys.deletedClients, { id: clientId });
    await deleteLocalRecord<Client>(localKeys.clients, clientId);
    const localFlights = await getLocalRecords<Flight>(localKeys.flights);
    await AsyncStorage.setItem(localKeys.flights, JSON.stringify(localFlights.filter((flight) => flight.client_id !== clientId)));
    return { id: clientId };
  }

  const { error: flightsError } = await supabase.from('flights').delete().eq('client_id', clientId);
  if (flightsError) throw flightsError;

  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) throw error;
  return { id: clientId };
}
