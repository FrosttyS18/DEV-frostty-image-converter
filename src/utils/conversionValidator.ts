import { ConversionType } from '../types';

export interface ConversionOption {
  type: ConversionType;
  label: string;
  enabled: boolean;
}

/**
 * Retorna as conversões válidas para uma extensão de arquivo
 */
export function getValidConversions(extension: string): ConversionOption[] {
  const ext = extension.toLowerCase();

  const allOptions: ConversionOption[] = [
    {
      type: 'PNG_TO_TGA',
      label: 'PNG → TGA',
      enabled: ext === '.png',
    },
    {
      type: 'TGA_TO_PNG',
      label: 'TGA → PNG',
      enabled: ext === '.tga',
    },
    {
      type: 'PNG_TO_OZT',
      label: 'PNG → OZT',
      enabled: ext === '.png',
    },
    {
      type: 'OZT_TO_PNG',
      label: 'OZT → PNG',
      enabled: ext === '.ozt',
    },
    {
      type: 'OZJ_TO_JPG',
      label: 'OZJ → JPG',
      enabled: ext === '.ozj',
    },
    {
      type: 'JPG_TO_OZJ',
      label: 'JPG → OZJ',
      enabled: ext === '.jpg' || ext === '.jpeg',
    },
    {
      type: 'OZT_TO_TGA',
      label: 'OZT → TGA',
      enabled: ext === '.ozt',
    },
  ];

  return allOptions;
}

/**
 * Verifica se uma conversão é válida para uma extensão
 */
export function isValidConversion(extension: string, conversionType: ConversionType): boolean {
  const validConversions = getValidConversions(extension);
  const conversion = validConversions.find(c => c.type === conversionType);
  return conversion?.enabled || false;
}
