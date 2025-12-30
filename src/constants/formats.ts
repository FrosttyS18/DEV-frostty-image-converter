export const SUPPORTED_EXTENSIONS = [
  '.png',
  '.tga',
  '.ozt',
  '.ozj',
  '.jpg',
  '.jpeg',
] as const;

export const CONVERSION_TYPES = {
  PNG_TO_TGA: 'PNG_TO_TGA',
  TGA_TO_PNG: 'TGA_TO_PNG',
  PNG_TO_OZT: 'PNG_TO_OZT',
  OZT_TO_PNG: 'OZT_TO_PNG',
  OZJ_TO_JPG: 'OZJ_TO_JPG',
  JPG_TO_OZJ: 'JPG_TO_OZJ',
  OZT_TO_TGA: 'OZT_TO_TGA',
} as const;

export const CONVERSIONS = [
  { type: CONVERSION_TYPES.PNG_TO_TGA, label: 'PNG → TGA' },
  { type: CONVERSION_TYPES.TGA_TO_PNG, label: 'TGA → PNG' },
  { type: CONVERSION_TYPES.PNG_TO_OZT, label: 'PNG → OZT' },
  { type: CONVERSION_TYPES.OZT_TO_PNG, label: 'OZT → PNG' },
  { type: CONVERSION_TYPES.OZJ_TO_JPG, label: 'OZJ → JPG' },
  { type: CONVERSION_TYPES.JPG_TO_OZJ, label: 'JPG → OZJ' },
  { type: CONVERSION_TYPES.OZT_TO_TGA, label: 'OZT → TGA' },
] as const;

export const EXTENSION_COLORS: Record<string, string> = {
  '.png': 'text-green-400',
  '.tga': 'text-blue-400',
  '.ozt': 'text-purple-400',
  '.ozj': 'text-yellow-400',
  '.jpg': 'text-orange-400',
  '.jpeg': 'text-orange-400',
};
