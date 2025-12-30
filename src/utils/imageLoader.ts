import { tgaToDataURL } from './tga';
import { oztToDataURL } from './ozt';
import { ozjToDataURL } from './ozj';
import { electronService } from '../services/electronService';
import { ImageData } from '../types';

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
        // Usa data URL ao invés de blob URL (não precisa revogar)
        const pngBase64 = btoa(String.fromCharCode(...Array.from(uint8Array)));
        return `data:image/png;base64,${pngBase64}`;
        
      case '.jpg':
      case '.jpeg':
        // Valida magic number JPEG (FF D8)
        if (uint8Array.length < 2 || uint8Array[0] !== 0xFF || uint8Array[1] !== 0xD8) {
          throw new Error('Arquivo JPEG inválido (magic number incorreto)');
        }
        // Usa data URL ao invés de blob URL (não precisa revogar)
        const jpgBase64 = btoa(String.fromCharCode(...Array.from(uint8Array)));
        return `data:image/jpeg;base64,${jpgBase64}`;
        
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
          
          // Converte Uint8ClampedArray para Uint8Array (tipo esperado por ImageData)
          const dataArray = new Uint8Array(imageData.data);
          
          // Verifica se a imagem tem canal alpha (se algum pixel tem alpha < 255)
          let hasAlphaChannel = false;
          for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] < 255) {
              hasAlphaChannel = true;
              break;
            }
          }
          
          resolve({
            width: img.width,
            height: img.height,
            data: dataArray,
            hasAlpha: hasAlphaChannel,
          });
        };
        img.onerror = () => reject(new Error('Falha ao carregar imagem'));
        img.src = dataUrl;
      })
      .catch(reject);
  });
}
