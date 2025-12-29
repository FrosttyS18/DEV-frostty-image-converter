import pako from 'pako';
import { ImageData } from '../types';
import { decodeTGA, encodeTGA } from './tga';

/**
 * OZT = TGA comprimido com Zlib (formato usado pelo Mu Online)
 * Estrutura: [dados zlib comprimidos do TGA]
 */

export function decodeOZT(buffer: ArrayBuffer): ImageData {
  try {
    // Descomprimir com zlib
    const compressed = new Uint8Array(buffer);
    const decompressed = pako.inflate(compressed);
    
    // Decodificar TGA
    return decodeTGA(decompressed.buffer);
  } catch (error) {
    console.error('Erro ao decodificar OZT:', error);
    throw new Error(`Falha ao decodificar OZT: ${error}`);
  }
}

export function encodeOZT(imageData: ImageData): ArrayBuffer {
  try {
    // Codificar como TGA
    const tgaBuffer = encodeTGA(imageData);
    
    // Comprimir com zlib
    const tgaData = new Uint8Array(tgaBuffer);
    const compressed = pako.deflate(tgaData);
    
    return compressed.buffer;
  } catch (error) {
    console.error('Erro ao codificar OZT:', error);
    throw new Error(`Falha ao codificar OZT: ${error}`);
  }
}

export async function oztToDataURL(buffer: ArrayBuffer): Promise<string> {
  const imageData = decodeOZT(buffer);
  
  // Criar canvas para converter para PNG
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível obter contexto 2D');
  
  const imgData = ctx.createImageData(imageData.width, imageData.height);
  imgData.data.set(imageData.data);
  ctx.putImageData(imgData, 0, 0);
  
  return canvas.toDataURL('image/png');
}
