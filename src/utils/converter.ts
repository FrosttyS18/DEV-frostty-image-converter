import { ConversionOptions, ImageData } from '../types';
import { decodeTGA, encodeTGA } from './tga';
import { decodeOZT, encodeOZT } from './ozt';
import { decodeOZJ, encodeOZJ } from './ozj';

const fs = window.require('fs');
const path = window.require('path');

export async function convertFiles(options: ConversionOptions): Promise<void> {
  const { type, files, preserveAlpha } = options;

  for (const file of files) {
    try {
      await convertFile(file.path, type, preserveAlpha);
      console.log(`✓ Convertido: ${file.name}`);
    } catch (error) {
      console.error(`✗ Erro ao converter ${file.name}:`, error);
      throw error;
    }
  }
}

async function convertFile(
  filePath: string,
  type: string,
  preserveAlpha: boolean
): Promise<void> {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (type) {
    case 'PNG_TO_TGA':
      if (ext !== '.png') return;
      await pngToTga(filePath);
      break;
      
    case 'TGA_TO_PNG':
      if (ext !== '.tga') return;
      await tgaToPng(filePath);
      break;
      
    case 'PNG_TO_OZT':
      if (ext !== '.png') return;
      await pngToOzt(filePath);
      break;
      
    case 'OZJ_TO_JPG':
      if (ext !== '.ozj') return;
      await ozjToJpg(filePath);
      break;
      
    case 'OZT_TO_TGA':
      if (ext !== '.ozt' && ext !== '.ozb' && ext !== '.ozd') return;
      await oztToTga(filePath);
      break;
  }
}

// PNG -> TGA
async function pngToTga(pngPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const pngData = fs.readFileSync(pngPath);
    const blob = new Blob([pngData], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Contexto 2D não disponível');
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        const data: ImageData = {
          width: img.width,
          height: img.height,
          data: new Uint8Array(imageData.data),
          hasAlpha: true,
        };
        
        const tgaBuffer = encodeTGA(data);
        const outputPath = pngPath.replace(/\.png$/i, '.tga');
        
        fs.writeFileSync(outputPath, Buffer.from(tgaBuffer));
        URL.revokeObjectURL(url);
        resolve();
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao carregar PNG'));
    };
    
    img.src = url;
  });
}

// TGA -> PNG
async function tgaToPng(tgaPath: string): Promise<void> {
  const buffer = fs.readFileSync(tgaPath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  
  const imageData = decodeTGA(arrayBuffer);
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Contexto 2D não disponível'));
      return;
    }
    
    const imgData = ctx.createImageData(imageData.width, imageData.height);
    imgData.data.set(imageData.data);
    ctx.putImageData(imgData, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Falha ao criar blob PNG'));
        return;
      }
      
      blob.arrayBuffer().then(buffer => {
        const outputPath = tgaPath.replace(/\.tga$/i, '.png');
        fs.writeFileSync(outputPath, Buffer.from(buffer));
        resolve();
      }).catch(reject);
    }, 'image/png');
  });
}

// PNG -> OZT
async function pngToOzt(pngPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const pngData = fs.readFileSync(pngPath);
    const blob = new Blob([pngData], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Contexto 2D não disponível');
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        const data: ImageData = {
          width: img.width,
          height: img.height,
          data: new Uint8Array(imageData.data),
          hasAlpha: true,
        };
        
        const oztBuffer = encodeOZT(data);
        const outputPath = pngPath.replace(/\.png$/i, '.ozt');
        
        fs.writeFileSync(outputPath, Buffer.from(oztBuffer));
        URL.revokeObjectURL(url);
        resolve();
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao carregar PNG'));
    };
    
    img.src = url;
  });
}

// OZT -> TGA
async function oztToTga(oztPath: string): Promise<void> {
  const buffer = fs.readFileSync(oztPath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  
  const imageData = decodeOZT(arrayBuffer);
  const tgaBuffer = encodeTGA(imageData);
  
  const outputPath = oztPath.replace(/\.(ozt|ozb|ozd)$/i, '.tga');
  fs.writeFileSync(outputPath, Buffer.from(tgaBuffer));
}

// OZJ -> JPG
async function ozjToJpg(ozjPath: string): Promise<void> {
  const buffer = fs.readFileSync(ozjPath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  
  const jpgBuffer = decodeOZJ(arrayBuffer);
  const outputPath = ozjPath.replace(/\.ozj$/i, '.jpg');
  
  fs.writeFileSync(outputPath, Buffer.from(jpgBuffer));
}
