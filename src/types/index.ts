export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
}

export type ConversionType = 
  | 'PNG_TO_TGA'
  | 'TGA_TO_PNG'
  | 'PNG_TO_OZT'
  | 'OZJ_TO_JPG'
  | 'JPG_TO_OZJ'
  | 'OZT_TO_TGA';

export interface ConversionOptions {
  type: ConversionType;
  files: FileInfo[];
  preserveAlpha: boolean;
  outputFolder?: string;
}

export interface ImageData {
  width: number;
  height: number;
  data: Uint8Array;
  hasAlpha: boolean;
}
