import pako from 'pako';
import { ImageData } from '../types';
import { decodeTGA, encodeTGA } from './tga';

/**
 * OZT = TGA comprimido com Zlib (formato usado pelo Mu Online)
 * Estrutura: [dados zlib comprimidos do TGA]
 */

export function decodeOZT(buffer: ArrayBuffer): ImageData {
  try {
    const data = new Uint8Array(buffer);
    
    // Validação básica
    if (!data || data.length < 18) {
      throw new Error('Arquivo OZT muito pequeno (mínimo 18 bytes para header TGA)');
    }
    
    // Detecta se está comprimido (zlib magic numbers: 0x78, 0x9C ou 0x78, 0x01, etc)
    const isCompressed = data.length >= 2 && 
                        data[0] === 0x78 && 
                        (data[1] === 0x9C || data[1] === 0x01 || data[1] === 0xDA || data[1] === 0x5E);
    
    if (isCompressed) {
      // Está comprimido: descomprime primeiro
      const decompressed = pako.inflate(data);
      return decodeTGA(decompressed.buffer);
    } else {
      // Formato customizado do Mu Online: header TGA começa no byte 4
      // Tenta offset 4 primeiro (mais comum), depois outros
      const offsets = [4, 0, 2, 8, 16, 32];
      
      for (const skipBytes of offsets) {
        try {
          const offsetBuffer = buffer.slice(skipBytes);
          const result = decodeTGA(offsetBuffer);
          if (skipBytes > 0) {
            console.log(`[OZT] Arquivo usa offset ${skipBytes} bytes (formato Mu Online)`);
          }
          return result;
        } catch (err) {
          // Tenta próximo offset silenciosamente
        }
      }
      
      // Se nenhum offset funcionou, lança erro
      throw new Error('Não consegui encontrar header TGA válido no arquivo');
    }
  } catch (error) {
    console.error('Erro ao decodificar OZT:', error);
    throw new Error(`Falha ao decodificar OZT: ${error}`);
  }
}

export function encodeOZT(imageData: ImageData, useZlib: boolean = false): ArrayBuffer {
  try {
    // Codificar como TGA
    const tgaBuffer = encodeTGA(imageData);
    const tgaData = new Uint8Array(tgaBuffer);
    
    if (useZlib) {
      // Comprimir com zlib (formato comprimido)
      console.log('[OZT] Codificando com zlib...');
      const compressed = pako.deflate(tgaData);
      return compressed.buffer;
    } else {
      // TGA direto com header de 4 bytes - formato usado pelo Pentium Tools (compatível com o jogo)
      // O Pentium Tools adiciona um header de 4 bytes antes do TGA
      console.log('[OZT] Codificando como TGA direto com header de 4 bytes (formato Pentium Tools)...');
      
      // Header de 4 bytes: 00 00 02 00 (formato usado pelo Pentium Tools)
      const header = new Uint8Array([0x00, 0x00, 0x02, 0x00]);
      
      // Cria novo buffer: header (4 bytes) + TGA completo
      const result = new Uint8Array(4 + tgaData.length);
      result.set(header, 0);        // Header (4 bytes)
      result.set(tgaData, 4);        // TGA completo após o header
      
      return result.buffer;
    }
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
