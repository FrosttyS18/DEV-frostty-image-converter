import ptBR from './locales/pt-BR';
import enUS from './locales/en-US';
import esES from './locales/es-ES';

export type Language = 'pt-BR' | 'en-US' | 'es-ES';

export const languages: Record<Language, typeof ptBR> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': esES,
};

// Função helper para substituir placeholders
export function translate(key: string, params?: Record<string, string | number>): string {
  const currentLang = getCurrentLanguage();
  const translation = getNestedValue(languages[currentLang], key) || key;
  
  if (!params) return translation;
  
  let result = translation;
  Object.entries(params).forEach(([param, value]) => {
    result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
  });
  
  // Tratamento especial para plural
  if (params.count !== undefined) {
    const count = Number(params.count);
    const plural = count !== 1 ? 's' : '';
    result = result.replace(/\{plural\}/g, plural);
  }
  
  return result;
}

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Função para obter idioma atual do localStorage
export function getCurrentLanguage(): Language {
  const saved = localStorage.getItem('mutools-language') as Language;
  return saved && languages[saved] ? saved : 'pt-BR';
}

// Função para salvar idioma
export function setLanguage(lang: Language) {
  localStorage.setItem('mutools-language', lang);
  window.dispatchEvent(new Event('languagechange'));
}
