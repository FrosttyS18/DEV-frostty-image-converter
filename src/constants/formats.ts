export const SUPPORTED_EXTENSIONS = [
  '.png',
  '.tga',
  '.ozt',
  '.ozj',
  // '.ozb', // Removido - formato muito encriptado que causa travamento
  // '.ozd', // Removido temporariamente - formato proprietário não implementado
] as const;

export const CONVERSION_TYPES = {
  PNG_TO_TGA: 'PNG_TO_TGA',
  TGA_TO_PNG: 'TGA_TO_PNG',
  PNG_TO_OZT: 'PNG_TO_OZT',
  OZJ_TO_JPG: 'OZJ_TO_JPG',
  OZT_TO_TGA: 'OZT_TO_TGA',
  // OZD_TO_DDS: 'OZD_TO_DDS', // Removido - não implementado
} as const;

export const CONVERSIONS = [
  { type: CONVERSION_TYPES.PNG_TO_TGA, label: 'PNG → TGA' },
  { type: CONVERSION_TYPES.TGA_TO_PNG, label: 'TGA → PNG' },
  { type: CONVERSION_TYPES.PNG_TO_OZT, label: 'PNG → OZT' },
  { type: CONVERSION_TYPES.OZJ_TO_JPG, label: 'OZJ → JPG' },
  { type: CONVERSION_TYPES.OZT_TO_TGA, label: 'OZT → TGA' },
  // OZD→DDS removido temporariamente - formato proprietário não implementado
] as const;

export const EXTENSION_COLORS: Record<string, string> = {
  '.png': 'text-green-400',
  '.tga': 'text-blue-400',
  '.ozt': 'text-purple-400',
  '.ozj': 'text-yellow-400',
  // '.ozb': 'text-pink-400', // Removido - formato muito encriptado
  // '.ozd': 'text-orange-400', // Removido - não suportado
};
