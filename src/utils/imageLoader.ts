import { tgaToDataURL } from './tga';
import { oztToDataURL } from './ozt';
import { ozjToDataURL } from './ozj';

export async function loadImageAsDataUrl(filePath: string): Promise<string> {
  const fs = window.require('fs');
  const path = window.require('path');
  
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );

  switch (ext) {
    case '.png':
      const pngBlob = new Blob([arrayBuffer], { type: 'image/png' });
      return URL.createObjectURL(pngBlob);
      
    case '.jpg':
    case '.jpeg':
      const jpgBlob = new Blob([arrayBuffer], { type: 'image/jpeg' });
      return URL.createObjectURL(jpgBlob);
      
    case '.tga':
      return await tgaToDataURL(arrayBuffer);
      
    case '.ozt':
    case '.ozb':
    case '.ozd':
      return await oztToDataURL(arrayBuffer);
      
    case '.ozj':
      return await ozjToDataURL(arrayBuffer);
      
    default:
      throw new Error(`Formato não suportado: ${ext}`);
  }
}

export function loadImageData(filePath: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    loadImageAsDataUrl(filePath)
      .then(dataUrl => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Não foi possível obter contexto 2D'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          
          resolve({
            width: img.width,
            height: img.height,
            data: new Uint8Array(imageData.data),
            hasAlpha: true,
          });
        };
        img.onerror = () => reject(new Error('Falha ao carregar imagem'));
        img.src = dataUrl;
      })
      .catch(reject);
  });
}
