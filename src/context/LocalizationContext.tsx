import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { USD_TO_CURRENCY } from '../constants/exchangeRates';
import { CountryOption, CurrencyOption, LanguageOption, LocalizationState } from '../types/index';

const STORAGE_KEY = 'AGRONEX_LOCALIZATION_PREFERENCES';

type TranslationStrings = {
  dashboard: string;
  clients: string;
  flights: string;
  reports: string;
  maps: string;
  settings: string;
  totalHectares: string;
  monthlyRevenue: string;
  totalExpenses: string;
  netProfit: string;
};

const translations: Record<LanguageOption, TranslationStrings> = {
  es: {
    dashboard: 'Panel',
    clients: 'Clientes',
    flights: 'Vuelos',
    reports: 'Reportes',
    maps: 'Mapas',
    settings: 'Configuración',
    totalHectares: 'Hectáreas aplicadas',
    monthlyRevenue: 'Facturación mensual',
    totalExpenses: 'Gastos totales',
    netProfit: 'Ganancias netas',
  },
  en: {
    dashboard: 'Dashboard',
    clients: 'Clients',
    flights: 'Flights',
    reports: 'Reports',
    maps: 'Maps',
    settings: 'Settings',
    totalHectares: 'Applied hectares',
    monthlyRevenue: 'Monthly revenue',
    totalExpenses: 'Total expenses',
    netProfit: 'Net profit',
  },
  pt: {
    dashboard: 'Painel',
    clients: 'Clientes',
    flights: 'Voos',
    reports: 'Relatórios',
    maps: 'Mapas',
    settings: 'Configurações',
    totalHectares: 'Hectares aplicados',
    monthlyRevenue: 'Faturamento mensal',
    totalExpenses: 'Despesas totais',
    netProfit: 'Lucro líquido',
  },
};

const countryDefaults: Record<CountryOption, { currency: CurrencyOption; language: LanguageOption; locale: string }> = {
  BO: { currency: 'BOB', language: 'es', locale: 'es-BO' },
  US: { currency: 'USD', language: 'en', locale: 'en-US' },
  BR: { currency: 'BRL', language: 'pt', locale: 'pt-BR' },
  AR: { currency: 'ARS', language: 'es', locale: 'es-AR' },
  EU: { currency: 'EUR', language: 'en', locale: 'en-IE' },
};

const defaultCountry: CountryOption = 'BO';
const defaultLanguage: LanguageOption = countryDefaults[defaultCountry].language;
const defaultCurrency: CurrencyOption = countryDefaults[defaultCountry].currency;

const LocalizationContext = createContext<LocalizationState>({
  language: defaultLanguage,
  currency: defaultCurrency,
  country: defaultCountry,
  setLanguage: () => {},
  setCurrency: () => {},
  setCountry: () => {},
  t: (key: string) => key,
  formatCurrency: (value: number) => String(value),
  convertFromUsd: (value: number) => value,
  convertToUsd: (value: number) => value,
  formatDate: (date: string | Date) => String(date),
});

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageOption>(defaultLanguage);
  const [currency, setCurrencyState] = useState<CurrencyOption>(defaultCurrency);
  const [country, setCountryState] = useState<CountryOption>(defaultCountry);

  useEffect(() => {
    async function loadPreferences() {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as {
          language: LanguageOption;
          currency: CurrencyOption;
          country: CountryOption;
        };
        setLanguageState(data.language);
        setCurrencyState(data.currency);
        setCountryState(data.country);
        return;
      }

      const locale = (Localization as any).locale || 'es';
      if (locale.startsWith('pt')) {
        setLanguageState('pt');
        setCountryState('BR');
        setCurrencyState('BRL');
      } else if (locale.startsWith('en')) {
        setLanguageState('en');
        setCountryState('US');
        setCurrencyState('USD');
      }
    }

    loadPreferences();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ language, currency, country }));
  }, [language, currency, country]);

  const setLanguage = (value: LanguageOption) => setLanguageState(value);
  const setCurrency = (value: CurrencyOption) => setCurrencyState(value);
  const setCountry = (value: CountryOption) => {
    setCountryState(value);
    setCurrencyState(countryDefaults[value].currency);
    setLanguageState(countryDefaults[value].language);
  };

  const value = useMemo(() => {
    const locale = countryDefaults[country].locale;
    const rate = USD_TO_CURRENCY[currency] ?? 1;

    const convertFromUsd = (amountUsd: number) => amountUsd * rate;

    const convertToUsd = (amountInSelectedCurrency: number) =>
      rate === 0 ? amountInSelectedCurrency : amountInSelectedCurrency / rate;

    const formatCurrency = (amountUsd: number) => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(convertFromUsd(amountUsd));
    };

    const formatDate = (value: string | Date) => {
      const date = typeof value === 'string' ? new Date(value) : value;
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    };

    const t = (key: string) => {
      const typedKey = key as keyof TranslationStrings;
      return translations[language][typedKey] || translations.es[typedKey] || key;
    };

    return {
      language,
      currency,
      country,
      setLanguage,
      setCurrency,
      setCountry,
      t,
      formatCurrency,
      convertFromUsd,
      convertToUsd,
      formatDate,
    };
  }, [language, currency, country]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  return useContext(LocalizationContext);
}
