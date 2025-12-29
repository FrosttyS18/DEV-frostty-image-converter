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
  const view = new DataView(buffer);
  let offset = 0;

  // Ler cabeçalho TGA
  const header: TGAHeader = {
    idLength: view.getUint8(offset++),
    colorMapType: view.getUint8(offset++),
    imageType: view.getUint8(offset++),
    colorMapOrigin: view.getUint16(offset, true), 
    colorMapLength: view.getUint16(offset + 2, true),
    colorMapDepth: view.getUint8(offset + 4),
    xOrigin: view.getUint16(offset + 5, true),
    yOrigin: view.getUint16(offset + 7, true),
    width: view.getUint16(offset + 9, true),
    height: view.getUint16(offset + 11, true),
    bitsPerPixel: view.getUint8(offset + 13),
    imageDescriptor: view.getUint8(offset + 14),
  };
  offset += 13;

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
