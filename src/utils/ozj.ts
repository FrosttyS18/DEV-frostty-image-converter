import pako from 'pako';

/**
 * OZJ = JPEG comprimido com Zlib (formato usado pelo Mu Online)
 * Estrutura: [dados zlib comprimidos do JPEG]
 */

export function decodeOZJ(buffer: ArrayBuffer): ArrayBuffer {
  try {
    // Descomprimir com zlib
    const compressed = new Uint8Array(buffer);
    const decompressed = pako.inflate(compressed);
    
    return decompressed.buffer;
  } catch (error) {
    console.error('Erro ao decodificar OZJ:', error);
    throw new Error(`Falha ao decodificar OZJ: ${error}`);
  }
}

export function encodeOZJ(jpegBuffer: ArrayBuffer): ArrayBuffer {
  try {
    // Comprimir JPEG com zlib
    const jpegData = new Uint8Array(jpegBuffer);
    const compressed = pako.deflate(jpegData);
    
    return compressed.buffer;
  } catch (error) {
    console.error('Erro ao codificar OZJ:', error);
    throw new Error(`Falha ao codificar OZJ: ${error}`);
  }
}

export async function ozjToDataURL(buffer: ArrayBuffer): Promise<string> {
  const jpegBuffer = decodeOZJ(buffer);
  const blob = new Blob([jpegBuffer], { type: 'image/jpeg' });
  return URL.createObjectURL(blob);
}
