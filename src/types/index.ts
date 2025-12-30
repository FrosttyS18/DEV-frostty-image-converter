import { CONVERSION_TYPES } from '../constants/formats';

// Tipo de conversão disponível
export type ConversionType = typeof CONVERSION_TYPES[keyof typeof CONVERSION_TYPES];

// Informações de arquivo
export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
}

// Dados de imagem decodificada
export interface ImageData {
  width: number;
  height: number;
  data: Uint8Array;
  hasAlpha: boolean;
}

// Opções para conversão de arquivos
export interface ConversionOptions {
  type: ConversionType;
  files: FileInfo[];
  preserveAlpha: boolean;
  outputFolder?: string;
}
