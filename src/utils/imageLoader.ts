import { tgaToDataURL } from './tga';
import { oztToDataURL } from './ozt';
import { ozjToDataURL } from './ozj';
import { electronService } from '../services/electronService';

export async function loadImageAsDataUrl(filePath: string): Promise<string> {
  try {
    const ext = (await electronService.getExtension(filePath)).toLowerCase();
    const uint8Array = await electronService.readFile(filePath);
    
    console.log('[ImageLoader] Arquivo:', filePath);
    console.log('[ImageLoader] Extensão:', ext);
    console.log('[ImageLoader] Bytes recebidos:', uint8Array.length);
    
    // Validação básica
    if (!uint8Array || uint8Array.length === 0) {
      throw new Error('Arquivo vazio ou não foi possível ler o conteúdo');
    }
    
    console.log('[ImageLoader] Primeiros 10 bytes:', Array.from(uint8Array.slice(0, Math.min(10, uint8Array.length))));
    
    // Converte Uint8Array para ArrayBuffer
    const arrayBuffer = uint8Array.buffer as ArrayBuffer;

    switch (ext) {
      case '.png':
        // Valida magic number PNG (89 50 4E 47)
        if (uint8Array.length < 8 || uint8Array[0] !== 0x89 || uint8Array[1] !== 0x50 || 
            uint8Array[2] !== 0x4E || uint8Array[3] !== 0x47) {
          throw new Error('Arquivo PNG inválido (magic number incorreto)');
        }
        const pngBlob = new Blob([uint8Array], { type: 'image/png' });
        return URL.createObjectURL(pngBlob);
        
      case '.jpg':
      case '.jpeg':
        // Valida magic number JPEG (FF D8)
        if (uint8Array.length < 2 || uint8Array[0] !== 0xFF || uint8Array[1] !== 0xD8) {
          throw new Error('Arquivo JPEG inválido (magic number incorreto)');
        }
        const jpgBlob = new Blob([uint8Array], { type: 'image/jpeg' });
        return URL.createObjectURL(jpgBlob);
        
      case '.tga':
        if (uint8Array.length < 18) {
          throw new Error('Arquivo TGA muito pequeno (mínimo 18 bytes para header)');
        }
        return await tgaToDataURL(arrayBuffer as ArrayBuffer);
        
      case '.ozt':
        if (uint8Array.length < 18) {
          throw new Error('Arquivo OZT muito pequeno');
        }
        return await oztToDataURL(arrayBuffer as ArrayBuffer);
        
      case '.ozj':
        if (uint8Array.length < 2) {
          throw new Error('Arquivo OZJ muito pequeno');
        }
        return await ozjToDataURL(arrayBuffer as ArrayBuffer);
        
      default:
        throw new Error(`Formato não suportado para preview: ${ext}`);
    }
  } catch (error) {
    console.error('[ImageLoader] Erro ao carregar imagem:', error);
    
    // Melhora a mensagem de erro
    if (error instanceof Error) {
      throw new Error(`Falha ao carregar imagem: ${error.message}`);
    }
    throw new Error('Falha desconhecida ao carregar imagem');
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
            data: new Uint8ClampedArray(imageData.data),
            hasAlpha: true,
          });
        };
        img.onerror = () => reject(new Error('Falha ao carregar imagem'));
        img.src = dataUrl;
      })
      .catch(reject);
  });
}
