import pako from 'pako';
import jpeg from 'jpeg-js';

/**
 * OZJ = JPEG do Mu Online (pode conter múltiplas imagens JPEG empacotadas)
 * Estrutura: 
 * - Pode ser JPEG direto (sem compressão)
 * - Pode ser JPEG comprimido com zlib
 * - Pode conter múltiplas imagens JPEG (thumbnails + imagem principal)
 *   Nesse caso, a última imagem geralmente é a principal
 */

export function decodeOZJ(buffer: ArrayBuffer): ArrayBuffer {
  try {
    const data = new Uint8Array(buffer);
    
    // Validação básica
    if (!data || data.length < 2) {
      throw new Error('Arquivo OZJ muito pequeno (mínimo 2 bytes)');
    }
    
    console.log('[OZJ] Tamanho do arquivo:', data.length, 'bytes');
    console.log('[OZJ] Primeiros 10 bytes:', Array.from(data.slice(0, Math.min(10, data.length))).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
    
    // Detecta se é JPEG direto (magic number: 0xFF 0xD8)
    const isJPEG = data.length >= 2 && data[0] === 0xFF && data[1] === 0xD8;
    
    // Detecta se está comprimido (zlib magic numbers: 0x78)
    const isCompressed = data.length >= 2 && 
                        data[0] === 0x78 && 
                        (data[1] === 0x9C || data[1] === 0x01 || data[1] === 0xDA || data[1] === 0x5E);
    
    console.log('[OZJ] É JPEG?', isJPEG, '| É comprimido (zlib)?', isCompressed);
    
    // PRIORIDADE 1: Comprimido com zlib
    if (isCompressed) {
      console.log('[OZJ] Arquivo comprimido com zlib - descomprimindo...');
      const decompressed = pako.inflate(data);
      return decompressed.buffer;
    }
    
    // PRIORIDADE 2: JPEG direto (pode ter múltiplas imagens)
    if (isJPEG) {
      console.log('[OZJ] JPEG detectado - verificando se há múltiplas imagens...');
      
      // Procura todos os marcadores SOI (Start Of Image: FF D8)
      const soiOffsets: number[] = [];
      for (let i = 0; i < data.length - 1; i++) {
        if (data[i] === 0xFF && data[i + 1] === 0xD8) {
          soiOffsets.push(i);
        }
      }
      
      // Procura todos os marcadores EOI (End Of Image: FF D9)
      const eoiOffsets: number[] = [];
      for (let i = 0; i < data.length - 1; i++) {
        if (data[i] === 0xFF && data[i + 1] === 0xD9) {
          eoiOffsets.push(i);
        }
      }
      
      console.log(`[OZJ] Imagens encontradas: ${soiOffsets.length} SOI, ${eoiOffsets.length} EOI`);
      console.log(`[OZJ] Offsets SOI: [${soiOffsets.join(', ')}]`);
      console.log(`[OZJ] Offsets EOI: [${eoiOffsets.join(', ')}]`);
      
      // Estratégia: Arquivos OZJ do Mu Online têm SOIs aninhados (headers)
      // seguidos da imagem principal. Procuramos o SOI que tem estrutura JPEG completa
      // (com DQT, SOF0, DHT, SOS) e vai até o ÚLTIMO EOI
      if (soiOffsets.length > 0 && eoiOffsets.length > 0) {
        const lastEOI = eoiOffsets[eoiOffsets.length - 1];
        
        // Para cada SOI, verifica se tem estrutura JPEG completa após ele
        for (let i = soiOffsets.length - 1; i >= 0; i--) {
          const soi = soiOffsets[i];
          
          // Procura marcadores JPEG essenciais após este SOI
          // DQT (0xDB), SOF0 (0xC0), DHT (0xC4), SOS (0xDA)
          let hasDQT = false;
          let hasSOF0 = false;
          let hasDHT = false;
          let hasSOS = false;
          
          // Verifica os próximos 1000 bytes após o SOI
          const scanLimit = Math.min(soi + 1000, data.length - 1);
          for (let j = soi; j < scanLimit; j++) {
            if (data[j] === 0xFF) {
              const marker = data[j + 1];
              if (marker === 0xDB) hasDQT = true;
              if (marker === 0xC0) hasSOF0 = true;
              if (marker === 0xC4) hasDHT = true;
              if (marker === 0xDA) hasSOS = true;
            }
          }
          
          // Se tem todos os marcadores, é uma imagem JPEG completa
          if (hasDQT && hasSOF0 && hasDHT && hasSOS) {
            const imageSize = lastEOI - soi + 2;
            console.log(`[OZJ] 🎯 Imagem JPEG completa encontrada (SOI:${soi} → EOI:${lastEOI}): ${imageSize} bytes`);
            console.log(`[OZJ]    Marcadores: DQT=${hasDQT}, SOF0=${hasSOF0}, DHT=${hasDHT}, SOS=${hasSOS}`);
            
            const imageData = data.slice(soi, lastEOI + 2);
            return imageData.buffer;
          }
        }
        
        // Fallback: usa do primeiro SOI ao último EOI
        console.log('[OZJ] ⚠️ Nenhum SOI com estrutura completa, usando primeira imagem');
        const imageData = data.slice(soiOffsets[0], lastEOI + 2);
        return imageData.buffer;
      }
      
      // Se há apenas uma imagem ou não conseguiu extrair, usa o arquivo todo
      console.log('[OZJ] Usando arquivo JPEG completo');
      return buffer;
    }
    
    // PRIORIDADE 3: Tenta offsets (formato Mu Online pode ter header extra)
    console.log('[OZJ] Tentando diferentes offsets...');
    const offsets = [4, 2, 8, 12, 16, 20, 24, 32];
    
    for (const skipBytes of offsets) {
      try {
        const offsetBuffer = buffer.slice(skipBytes);
        const offsetData = new Uint8Array(offsetBuffer);
        
        // Verifica se tem header JPEG nesse offset
        if (offsetData.length >= 2 && offsetData[0] === 0xFF && offsetData[1] === 0xD8) {
          console.log(`[OZJ] JPEG encontrado no offset ${skipBytes} bytes!`);
          return offsetBuffer;
        }
        
        // Tenta descomprimir se tiver zlib nesse offset
        if (offsetData.length >= 2 && 
            offsetData[0] === 0x78 && 
            (offsetData[1] === 0x9C || offsetData[1] === 0x01 || offsetData[1] === 0xDA || offsetData[1] === 0x5E)) {
          console.log(`[OZJ] zlib encontrado no offset ${skipBytes}, descomprimindo...`);
          const decompressed = pako.inflate(offsetData);
          return decompressed.buffer;
        }
      } catch (err) {
        // Continua tentando
        console.log(`[OZJ] Offset ${skipBytes} falhou, tentando próximo...`);
      }
    }
    
    throw new Error('Formato OZJ não reconhecido - nenhum formato válido detectado');
  } catch (error) {
    console.error('[OZJ] Erro ao decodificar:', error);
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
  const uint8 = new Uint8Array(jpegBuffer);
  
  try {
    // Tenta decodificar com jpeg-js (JS puro)
    console.log('[OZJ] Decodificando JPEG com jpeg-js...');
    const decoded = jpeg.decode(uint8, { useTArray: true });
    console.log('[OZJ] JPEG decodificado:', decoded.width, 'x', decoded.height);
    
    // Cria canvas e desenha
    const canvas = document.createElement('canvas');
    canvas.width = decoded.width;
    canvas.height = decoded.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contexto 2D não disponível');
    
    const imageData = ctx.createImageData(decoded.width, decoded.height);
    imageData.data.set(decoded.data);
    ctx.putImageData(imageData, 0, 0);
    
    // Retorna como data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('[OZJ] Falha ao decodificar com jpeg-js:', error);
    
    // Fallback: tenta com Blob (método antigo)
    const blob = new Blob([uint8], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  }
}
