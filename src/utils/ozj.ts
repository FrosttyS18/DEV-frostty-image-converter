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
      console.log('[OZJ] JPEG detectado - verificando se há header de 24 bytes (formato Pentium Tools)...');
      
      // Detecta se há header de 24 bytes (formato Pentium Tools)
      // O header é uma cópia dos primeiros 24 bytes do JPEG
      if (data.length >= 48) {
        const headerMatches = data.slice(0, 24).every((byte, i) => byte === data[i + 24]);
        if (headerMatches) {
          console.log('[OZJ] Header de 24 bytes detectado (formato Pentium Tools) - pulando header...');
          // Retorna apenas o JPEG real (sem o header duplicado)
          return buffer.slice(24);
        }
      }
      
      console.log('[OZJ] Verificando se há múltiplas imagens...');
      
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
      
      // Estratégia: Tenta cada combinação SOI + EOI e valida decodificando
      if (soiOffsets.length > 0 && eoiOffsets.length > 0) {
        const lastEOI = eoiOffsets[eoiOffsets.length - 1];
        
        // Tenta cada SOI do primeiro ao último
        for (let i = 0; i < soiOffsets.length; i++) {
          const soi = soiOffsets[i];
          const imageSize = lastEOI - soi + 2;
          
          // Ignora apenas segmentos muito pequenos (lixo/header)
          if (imageSize < 100) {
            console.log(`[OZJ] SOI em ${soi} ignorado (muito pequeno: ${imageSize} bytes)`);
            continue;
          }
          
          const candidateImage = data.slice(soi, lastEOI + 2);
          
          // Validação básica de marcadores JPEG
          const hasValidStart = candidateImage[0] === 0xFF && candidateImage[1] === 0xD8;
          const hasValidEnd = candidateImage[candidateImage.length - 2] === 0xFF && 
                              candidateImage[candidateImage.length - 1] === 0xD9;
          
          if (!hasValidStart || !hasValidEnd) {
            console.log(`[OZJ] SOI em ${soi} ignorado (marcadores invalidos)`);
            continue;
          }
          
          // Tenta decodificar com jpeg-js para validar
          try {
            const testDecode = jpeg.decode(candidateImage, { useTArray: true });
            
            // Se decodificou com sucesso e tem dimensões válidas (qualquer tamanho razoável)
            if (testDecode.width > 0 && testDecode.height > 0 && 
                testDecode.width <= 16384 && testDecode.height <= 16384) {
              console.log(`[OZJ] Imagem valida encontrada (SOI:${soi}): ${imageSize} bytes, ${testDecode.width}x${testDecode.height}`);
              
              if (testDecode.width > 8192 || testDecode.height > 8192) {
                console.warn(`[OZJ] AVISO: Imagem muito grande, pode ser lento`);
              }
              
              return candidateImage.buffer;
            } else {
              console.log(`[OZJ] SOI em ${soi} dimensoes invalidas: ${testDecode.width}x${testDecode.height}`);
            }
          } catch (err) {
            console.log(`[OZJ] SOI em ${soi} falhou ao decodificar: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
            continue;
          }
        }
        
        // Fallback: retorna do primeiro SOI ao último EOI
        console.log('[OZJ] Usando fallback: primeiro SOI ao ultimo EOI');
        const imageData = data.slice(soiOffsets[0], lastEOI + 2);
        return imageData.buffer;
      }
      
      // Se há apenas uma imagem ou não conseguiu extrair, usa o arquivo todo
      console.log('[OZJ] Usando arquivo JPEG completo');
      return buffer;
    }
    
    // PRIORIDADE 3: Tenta XOR com chave 0xFC (formato encriptado do Mu Online)
    console.log('[OZJ] Tentando decodificar com XOR (0xFC)...');
    try {
      const decoded = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        decoded[i] = data[i] ^ 0xFC;
      }
      
      // Verifica se após XOR ficou um JPEG válido
      if (decoded.length >= 2 && decoded[0] === 0xFF && decoded[1] === 0xD8) {
        console.log('[OZJ] JPEG encontrado após aplicar XOR (0xFC)!');
        return decoded.buffer;
      }
    } catch (err) {
      console.log('[OZJ] XOR falhou, tentando offsets...');
    }
    
    // PRIORIDADE 4: Tenta offsets (formato Mu Online pode ter header extra)
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
        
        // Tenta XOR no offset
        try {
          const decoded = new Uint8Array(offsetData.length);
          for (let i = 0; i < offsetData.length; i++) {
            decoded[i] = offsetData[i] ^ 0xFC;
          }
          if (decoded.length >= 2 && decoded[0] === 0xFF && decoded[1] === 0xD8) {
            console.log(`[OZJ] JPEG encontrado no offset ${skipBytes} após XOR!`);
            return decoded.buffer;
          }
        } catch (err) {
          // Continua
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

export function encodeOZJ(jpegBuffer: ArrayBuffer, useXOR: boolean = false, useZlib: boolean = false): ArrayBuffer {
  try {
    const jpegData = new Uint8Array(jpegBuffer);
    
    if (useXOR) {
      // Codifica com XOR (chave 0xFC) - formato encriptado do Mu Online
      console.log('[OZJ] Codificando com XOR (0xFC)...');
      const encoded = new Uint8Array(jpegData.length);
      for (let i = 0; i < jpegData.length; i++) {
        encoded[i] = jpegData[i] ^ 0xFC;
      }
      return encoded.buffer;
    } else if (useZlib) {
      // Comprimir JPEG com zlib (formato comprimido)
      console.log('[OZJ] Codificando com zlib...');
      const compressed = pako.deflate(jpegData);
      return compressed.buffer;
    } else {
      // JPEG direto com header de 24 bytes - formato usado pelo Pentium Tools (compatível com o jogo)
      // O Pentium Tools adiciona os primeiros 24 bytes do JPEG como header
      console.log('[OZJ] Codificando como JPEG direto com header de 24 bytes (formato Pentium Tools)...');
      
      if (jpegData.length < 24) {
        throw new Error('JPEG muito pequeno para adicionar header de 24 bytes');
      }
      
      // Pega os primeiros 24 bytes do JPEG
      const header = jpegData.slice(0, 24);
      
      // Cria novo buffer: header (24 bytes) + JPEG completo
      const result = new Uint8Array(24 + jpegData.length);
      result.set(header, 0);        // Header (primeiros 24 bytes)
      result.set(jpegData, 24);     // JPEG completo após o header
      
      return result.buffer;
    }
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
    
    // Fallback: usa data URL (sem memory leak)
    const base64 = btoa(String.fromCharCode(...Array.from(uint8)));
    return `data:image/jpeg;base64,${base64}`;
  }
}
