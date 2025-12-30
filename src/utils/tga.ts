import { ImageData } from '../types';

interface TGAHeader {
  idLength: number;
  colorMapType: number;
  imageType: number;
  colorMapOrigin: number;
  colorMapLength: number;
  colorMapDepth: number;
  xOrigin: number;
  yOrigin: number;
  width: number;
  height: number;
  bitsPerPixel: number;
  imageDescriptor: number;
}

export function decodeTGA(buffer: ArrayBuffer): ImageData {
  // Validação básica
  if (!buffer || buffer.byteLength < 18) {
    throw new Error('Arquivo TGA inválido: muito pequeno (mínimo 18 bytes para header)');
  }
  
  const view = new DataView(buffer);
  
  // Debug logs (desabilitados)
  // console.log('[TGA] Buffer size:', buffer.byteLength);

  // Ler cabeçalho TGA (18 bytes total)
  const header: TGAHeader = {
    idLength: view.getUint8(0),
    colorMapType: view.getUint8(1),
    imageType: view.getUint8(2),
    colorMapOrigin: view.getUint16(3, true), 
    colorMapLength: view.getUint16(5, true),
    colorMapDepth: view.getUint8(7),
    xOrigin: view.getUint16(8, true),
    yOrigin: view.getUint16(10, true),
    width: view.getUint16(12, true),
    height: view.getUint16(14, true),
    bitsPerPixel: view.getUint8(16),
    imageDescriptor: view.getUint8(17),
  };
  let offset = 18;

  console.log('[TGA] Header parsed:', {
    width: header.width,
    height: header.height,
    bitsPerPixel: header.bitsPerPixel,
    imageType: header.imageType
  });

  // Workaround: Tenta calcular dimensões a partir do tamanho do arquivo
  if (header.width === 0 || header.height === 0) {
    const dataSize = buffer.byteLength - offset;
    const bytesPerPixel = header.bitsPerPixel / 8;
    const totalPixels = dataSize / bytesPerPixel;
    
    console.log('[TGA] AVISO: Header sem dimensões válidas!');
    console.log('[TGA] Tentando calcular dimensões:', {
      dataSize,
      bytesPerPixel,
      totalPixels
    });
    
    // Tenta dimensão quadrada primeiro (mais comum)
    const squareDimension = Math.sqrt(totalPixels);
    if (Number.isInteger(squareDimension)) {
      header.width = squareDimension;
      header.height = squareDimension;
      console.log('[TGA] Imagem quadrada detectada:', squareDimension, 'x', squareDimension);
    } else {
      // Tenta dimensões retangulares comuns (16:9, 4:3, 2:1, etc)
      const commonRatios = [
        { w: 16, h: 9 },   // 16:9
        { w: 4, h: 3 },    // 4:3
        { w: 3, h: 2 },    // 3:2
        { w: 2, h: 1 },    // 2:1
        { w: 21, h: 9 },   // 21:9
        { w: 5, h: 4 },    // 5:4
        { w: 3, h: 4 },    // 3:4 (vertical)
        { w: 9, h: 16 },   // 9:16 (vertical)
      ];
      
      let found = false;
      for (const ratio of commonRatios) {
        // Tenta múltiplos do ratio
        for (let multiplier = 1; multiplier <= 200; multiplier++) {
          const w = ratio.w * multiplier;
          const h = ratio.h * multiplier;
          if (w * h === totalPixels) {
            header.width = w;
            header.height = h;
            console.log(`[TGA] Dimensoes encontradas (${ratio.w}:${ratio.h}):`, w, 'x', h);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      
      if (!found) {
        // Última tentativa: fatoração simples (aceita qualquer tamanho >= 4x4)
        for (let w = 4; w <= Math.sqrt(totalPixels) * 2; w++) {
          if (totalPixels % w === 0) {
            const h = totalPixels / w;
            if (w * h === totalPixels && w >= 4 && h >= 4 && w <= 16384 && h <= 16384) {
              header.width = w;
              header.height = h;
              console.log('[TGA] Dimensoes calculadas por fatoracao:', w, 'x', h);
              found = true;
              break;
            }
          }
        }
      }
      
      if (!found) {
        throw new Error(
          `Dimensões inválidas no header (${header.width}x${header.height}) ` +
          `e não foi possível calcular a partir do tamanho do arquivo (${totalPixels} pixels)`
        );
      }
    }
  }

  // Pular ID se existir
  if (header.idLength > 0) {
    offset += header.idLength;
  }

  // Pular color map se existir
  if (header.colorMapType === 1) {
    offset += header.colorMapLength * Math.ceil(header.colorMapDepth / 8);
  }

  const bytesPerPixel = header.bitsPerPixel / 8;
  const hasAlpha = header.bitsPerPixel === 32;
  const pixelCount = header.width * header.height;
  
  // Array RGBA (sempre 4 bytes por pixel)
  const rgbaData = new Uint8Array(pixelCount * 4);

  // Ler dados de imagem
  const imageData = new Uint8Array(buffer, offset);
  
  // Verificar tipo de compressão
  if (header.imageType === 10) {
    // Tipo 10: Run-Length Encoded (RLE) True-Color
    console.log('[TGA] AVISO: Arquivo TGA com compressão RLE detectado (tipo 10)');
    console.log('[TGA] Descomprimindo RLE...');
    
    let pixelIndex = 0;
    let dataIndex = 0;
    
    while (pixelIndex < pixelCount && dataIndex < imageData.length) {
      // Ler byte de controle RLE
      const controlByte = imageData[dataIndex++];
      const isRlePacket = (controlByte & 0x80) !== 0; // Bit 7 indica se é RLE
      const runLength = (controlByte & 0x7F) + 1; // Bits 0-6 = comprimento (1-128)
      
      if (isRlePacket) {
        // RLE packet: repetir o próximo pixel 'runLength' vezes
        if (dataIndex + bytesPerPixel > imageData.length) break;
        
        const b = imageData[dataIndex];
        const g = imageData[dataIndex + 1];
        const r = imageData[dataIndex + 2];
        const a = hasAlpha ? imageData[dataIndex + 3] : 255;
        
        dataIndex += bytesPerPixel;
        
        // Repetir pixel 'runLength' vezes
        for (let i = 0; i < runLength && pixelIndex < pixelCount; i++) {
          const dstIndex = pixelIndex * 4;
          rgbaData[dstIndex] = r;
          rgbaData[dstIndex + 1] = g;
          rgbaData[dstIndex + 2] = b;
          rgbaData[dstIndex + 3] = a;
          pixelIndex++;
        }
      } else {
        // Raw packet: ler 'runLength' pixels sem compressão
        for (let i = 0; i < runLength && pixelIndex < pixelCount && dataIndex + bytesPerPixel <= imageData.length; i++) {
          const b = imageData[dataIndex];
          const g = imageData[dataIndex + 1];
          const r = imageData[dataIndex + 2];
          const a = hasAlpha ? imageData[dataIndex + 3] : 255;
          
          const dstIndex = pixelIndex * 4;
          rgbaData[dstIndex] = r;
          rgbaData[dstIndex + 1] = g;
          rgbaData[dstIndex + 2] = b;
          rgbaData[dstIndex + 3] = a;
          
          pixelIndex++;
          dataIndex += bytesPerPixel;
        }
      }
    }
    
    if (pixelIndex < pixelCount) {
      console.warn(`[TGA] AVISO: RLE descomprimido incompleto. Esperado ${pixelCount} pixels, decodificado ${pixelIndex}`);
    }
  } else if (header.imageType === 2) {
    // Tipo 2: Uncompressed True-Color (comum em Mu Online)
    for (let i = 0; i < pixelCount; i++) {
      const srcIndex = i * bytesPerPixel;
      const dstIndex = i * 4;

      // TGA é BGR(A), converter para RGBA
      const b = imageData[srcIndex];
      const g = imageData[srcIndex + 1];
      const r = imageData[srcIndex + 2];
      const a = hasAlpha ? imageData[srcIndex + 3] : 255;

      rgbaData[dstIndex] = r;
      rgbaData[dstIndex + 1] = g;
      rgbaData[dstIndex + 2] = b;
      rgbaData[dstIndex + 3] = a;
    }
  } else {
    // Tipos não suportados
    console.warn(`[TGA] AVISO: Tipo de imagem TGA não suportado: ${header.imageType}`);
    console.warn('[TGA] Tipos suportados: 2 (Uncompressed), 10 (RLE)');
    console.warn('[TGA] Tentando ler como tipo 2 (Uncompressed)...');
    
    // Fallback: tenta ler como não comprimido
    for (let i = 0; i < pixelCount; i++) {
      const srcIndex = i * bytesPerPixel;
      const dstIndex = i * 4;

      if (srcIndex + bytesPerPixel > imageData.length) break;

      const b = imageData[srcIndex];
      const g = imageData[srcIndex + 1];
      const r = imageData[srcIndex + 2];
      const a = hasAlpha ? imageData[srcIndex + 3] : 255;

      rgbaData[dstIndex] = r;
      rgbaData[dstIndex + 1] = g;
      rgbaData[dstIndex + 2] = b;
      rgbaData[dstIndex + 3] = a;
    }
  }

  // TGA pode estar invertido verticalmente
  const originAtTop = (header.imageDescriptor & 0x20) !== 0;
  if (!originAtTop) {
    // Inverter verticalmente
    const flipped = new Uint8Array(pixelCount * 4);
    for (let y = 0; y < header.height; y++) {
      const srcY = header.height - 1 - y;
      const srcOffset = srcY * header.width * 4;
      const dstOffset = y * header.width * 4;
      flipped.set(rgbaData.subarray(srcOffset, srcOffset + header.width * 4), dstOffset);
    }
    return {
      width: header.width,
      height: header.height,
      data: flipped,
      hasAlpha,
    };
  }

  return {
    width: header.width,
    height: header.height,
    data: rgbaData,
    hasAlpha,
  };
}

export function encodeTGA(imageData: ImageData): ArrayBuffer {
  const { width, height, data, hasAlpha } = imageData;
  console.log('[TGA] Codificando TGA:', width, 'x', height, 'pixels, alpha:', hasAlpha);
  const bitsPerPixel = hasAlpha ? 32 : 24;
  const bytesPerPixel = bitsPerPixel / 8;
  
  // Tamanho do arquivo
  const headerSize = 18;
  const imageDataSize = width * height * bytesPerPixel;
  const buffer = new ArrayBuffer(headerSize + imageDataSize);
  const view = new DataView(buffer);
  
  let offset = 0;
  
  // Escrever cabeçalho TGA
  view.setUint8(offset++, 0); // ID length
  view.setUint8(offset++, 0); // Color map type
  view.setUint8(offset++, 2); // Image type (uncompressed true-color)
  view.setUint16(offset, 0, true); offset += 2; // Color map origin
  view.setUint16(offset, 0, true); offset += 2; // Color map length
  view.setUint8(offset++, 0); // Color map depth
  view.setUint16(offset, 0, true); offset += 2; // X origin
  view.setUint16(offset, 0, true); offset += 2; // Y origin
  view.setUint16(offset, width, true); offset += 2; // Width
  view.setUint16(offset, height, true); offset += 2; // Height
  console.log('[TGA] Header TGA escrito - Width:', width, 'Height:', height);
  view.setUint8(offset++, bitsPerPixel); // Bits per pixel
  view.setUint8(offset++, hasAlpha ? 8 : 0); // Image descriptor (alpha channel depth)

  // Escrever dados de imagem (BGR(A) format, bottom-up)
  const imageBytes = new Uint8Array(buffer, headerSize);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Inverter Y (TGA é bottom-up)
      const srcY = height - 1 - y;
      const srcIndex = (srcY * width + x) * 4;
      const dstIndex = (y * width + x) * bytesPerPixel;

      // RGBA -> BGR(A)
      imageBytes[dstIndex] = data[srcIndex + 2]; // B
      imageBytes[dstIndex + 1] = data[srcIndex + 1]; // G
      imageBytes[dstIndex + 2] = data[srcIndex]; // R
      if (hasAlpha) {
        imageBytes[dstIndex + 3] = data[srcIndex + 3]; // A
      }
    }
  }

  return buffer;
}

export async function tgaToDataURL(buffer: ArrayBuffer): Promise<string> {
  const imageData = decodeTGA(buffer);
  
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
