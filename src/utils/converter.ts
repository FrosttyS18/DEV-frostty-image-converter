import { ConversionOptions, ImageData } from '../types';
import { decodeTGA, encodeTGA } from './tga';
import { decodeOZT, encodeOZT } from './ozt';
import { decodeOZJ } from './ozj';
import { electronService } from '../services/electronService';

export async function convertFiles(options: ConversionOptions): Promise<void> {
  console.log('[convertFiles] Iniciando conversao em lote...');
  const { type, files, preserveAlpha, outputFolder } = options;
  
  console.log(`[convertFiles] Total de ${files.length} arquivo(s) para converter`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      console.log(`[convertFiles] Convertendo ${i + 1}/${files.length}: ${file.name}`);
      await convertFile(file.path, type, preserveAlpha, outputFolder);
      console.log(`[convertFiles] OK - Convertido: ${file.name}`);
    } catch (error) {
      console.error(`[convertFiles] ERRO ao converter ${file.name}:`, error);
      throw error;
    }
  }
  
  console.log('[convertFiles] Conversao em lote concluida!');
}

async function convertFile(
  filePath: string,
  type: string,
  preserveAlpha: boolean,
  outputFolder?: string
): Promise<void> {
  console.log(`[convertFile] Arquivo: ${filePath}`);
  console.log(`[convertFile] Tipo conversao: ${type}`);
  
  const ext = (await electronService.getExtension(filePath)).toLowerCase();
  const filename = await electronService.getBasename(filePath);
  
  console.log(`[convertFile] Extensao: ${ext}, Nome: ${filename}`);
  
  switch (type) {
    case 'PNG_TO_TGA':
      if (ext !== '.png') {
        throw new Error(`Arquivo "${filename}" não é PNG. Conversão PNG→TGA requer arquivos .png`);
      }
      await pngToTga(filePath, outputFolder);
      break;
      
    case 'TGA_TO_PNG':
      if (ext !== '.tga') {
        throw new Error(`Arquivo "${filename}" não é TGA. Conversão TGA→PNG requer arquivos .tga`);
      }
      await tgaToPng(filePath, outputFolder);
      break;
      
    case 'PNG_TO_OZT':
      if (ext !== '.png') {
        throw new Error(`Arquivo "${filename}" não é PNG. Conversão PNG→OZT requer arquivos .png`);
      }
      await pngToOzt(filePath, outputFolder);
      break;
      
    case 'OZJ_TO_JPG':
      if (ext !== '.ozj') {
        throw new Error(`Arquivo "${filename}" não é OZJ. Conversão OZJ→JPG requer arquivos .ozj`);
      }
      await ozjToJpg(filePath, outputFolder);
      break;
      
    case 'OZT_TO_TGA':
      if (ext !== '.ozt') {
        throw new Error(`Arquivo "${filename}" não é OZT. Conversão OZT→TGA requer arquivos .ozt`);
      }
      await oztToTga(filePath, outputFolder);
      break;
      
    default:
      throw new Error(`Tipo de conversão desconhecido: ${type}`);
  }
}

// PNG -> TGA
async function pngToTga(pngPath: string, outputFolder?: string): Promise<void> {
  const pngData = await electronService.readFile(pngPath);
  
  // Validação básica
  if (!pngData || pngData.length === 0) {
    throw new Error('Arquivo PNG vazio ou não foi possível ler');
  }
  
  // Valida magic number PNG
  if (pngData[0] !== 0x89 || pngData[1] !== 0x50 || pngData[2] !== 0x4E || pngData[3] !== 0x47) {
    throw new Error('Arquivo não é um PNG válido');
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([pngData], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    
    img.onload = async () => {
      try {
        // Valida dimensões básicas
        if (img.width <= 0 || img.height <= 0) {
          throw new Error(`Dimensoes invalidas: ${img.width}x${img.height}`);
        }
        
        if (img.width > 16384 || img.height > 16384) {
          console.warn(`[PNG→TGA] AVISO: Imagem muito grande (${img.width}x${img.height}), processamento pode ser lento`);
        }
        
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
        const filename = (await electronService.getBasename(pngPath)).replace(/\.png$/i, '.tga');
        const outputPath = outputFolder 
          ? await electronService.joinPath(outputFolder, filename)
          : pngPath.replace(/\.png$/i, '.tga');
        
        console.log('[PNG→TGA] ========================================');
        console.log('[PNG→TGA] Arquivo de origem:', pngPath);
        console.log('[PNG→TGA] Pasta de destino:', outputFolder || 'mesma pasta do arquivo');
        console.log('[PNG→TGA] Nome do arquivo:', filename);
        console.log('[PNG→TGA] Caminho completo:', outputPath);
        console.log('[PNG→TGA] Tamanho do buffer:', tgaBuffer.byteLength, 'bytes');
        console.log('[PNG→TGA] Dimensões:', data.width, 'x', data.height);
        console.log('[PNG→TGA] ========================================');
        
        await electronService.writeFile(outputPath, new Uint8Array(tgaBuffer));
        
        // Verifica se o arquivo foi criado consultando stats
        try {
          const stats = await electronService.getFileStats(outputPath);
          console.log('[PNG→TGA] Arquivo criado com sucesso!');
          console.log('[PNG→TGA] Tamanho verificado:', stats.size, 'bytes');
          console.log('[PNG→TGA] Localizacao:', outputPath);
        } catch (err) {
          console.error('[PNG→TGA] ERRO: Arquivo nao foi encontrado apos salvar!');
          throw new Error(`Arquivo TGA não foi criado: ${outputPath}`);
        }
        
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
async function tgaToPng(tgaPath: string, outputFolder?: string): Promise<void> {
  const uint8Array = await electronService.readFile(tgaPath);
  
  // Validação básica
  if (!uint8Array || uint8Array.length < 18) {
    throw new Error('Arquivo TGA inválido (muito pequeno)');
  }
  
  const arrayBuffer = uint8Array.buffer.slice(
    uint8Array.byteOffset,
    uint8Array.byteOffset + uint8Array.byteLength
  );
  
  const imageData = decodeTGA(arrayBuffer);
  
  // Valida resultado
  if (!imageData || imageData.width <= 0 || imageData.height <= 0) {
    throw new Error('Falha ao decodificar TGA: dimensões inválidas');
  }
  
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
      
      blob.arrayBuffer().then(async buffer => {
        const filename = (await electronService.getBasename(tgaPath)).replace(/\.tga$/i, '.png');
        const outputPath = outputFolder 
          ? await electronService.joinPath(outputFolder, filename)
          : tgaPath.replace(/\.tga$/i, '.png');
        
        console.log('[TGA→PNG] ========================================');
        console.log('[TGA→PNG] Arquivo de origem:', tgaPath);
        console.log('[TGA→PNG] Pasta de destino:', outputFolder || 'mesma pasta do arquivo');
        console.log('[TGA→PNG] Nome do arquivo:', filename);
        console.log('[TGA→PNG] Caminho completo:', outputPath);
        console.log('[TGA→PNG] Dimensões:', imageData.width, 'x', imageData.height);
        console.log('[TGA→PNG] ========================================');
        
        await electronService.writeFile(outputPath, new Uint8Array(buffer));
        
        // Verifica se o arquivo foi criado
        try {
          const stats = await electronService.getFileStats(outputPath);
          console.log('[TGA→PNG] Arquivo criado com sucesso!');
          console.log('[TGA→PNG] Tamanho verificado:', stats.size, 'bytes');
          console.log('[TGA→PNG] Localizacao:', outputPath);
        } catch (err) {
          console.error('[TGA→PNG] ERRO: Arquivo nao foi encontrado apos salvar!');
          throw new Error(`Arquivo PNG não foi criado: ${outputPath}`);
        }
        
        resolve();
      }).catch(reject);
    }, 'image/png');
  });
}

// PNG -> OZT
async function pngToOzt(pngPath: string, outputFolder?: string): Promise<void> {
  const pngData = await electronService.readFile(pngPath);
  
  // Validação básica
  if (!pngData || pngData.length === 0) {
    throw new Error('Arquivo PNG vazio ou não foi possível ler');
  }
  
  // Valida magic number PNG
  if (pngData[0] !== 0x89 || pngData[1] !== 0x50 || pngData[2] !== 0x4E || pngData[3] !== 0x47) {
    throw new Error('Arquivo não é um PNG válido');
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([pngData], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    
    img.onload = async () => {
      try {
        // Valida dimensões básicas
        if (img.width <= 0 || img.height <= 0) {
          throw new Error(`Dimensoes invalidas: ${img.width}x${img.height}`);
        }
        
        if (img.width > 16384 || img.height > 16384) {
          console.warn(`[PNG→OZT] AVISO: Imagem muito grande (${img.width}x${img.height}), processamento pode ser lento`);
        }
        
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
        const filename = (await electronService.getBasename(pngPath)).replace(/\.png$/i, '.ozt');
        const outputPath = outputFolder 
          ? await electronService.joinPath(outputFolder, filename)
          : pngPath.replace(/\.png$/i, '.ozt');
        
        console.log('[PNG→OZT] ========================================');
        console.log('[PNG→OZT] Arquivo de origem:', pngPath);
        console.log('[PNG→OZT] Pasta de destino:', outputFolder || 'mesma pasta do arquivo');
        console.log('[PNG→OZT] Nome do arquivo:', filename);
        console.log('[PNG→OZT] Caminho completo:', outputPath);
        console.log('[PNG→OZT] Dimensões:', data.width, 'x', data.height);
        console.log('[PNG→OZT] ========================================');
        
        await electronService.writeFile(outputPath, new Uint8Array(oztBuffer));
        
        // Verifica se o arquivo foi criado
        try {
          const stats = await electronService.getFileStats(outputPath);
          console.log('[PNG→OZT] Arquivo criado com sucesso!');
          console.log('[PNG→OZT] Tamanho verificado:', stats.size, 'bytes');
          console.log('[PNG→OZT] Localizacao:', outputPath);
        } catch (err) {
          console.error('[PNG→OZT] ERRO: Arquivo nao foi encontrado apos salvar!');
          throw new Error(`Arquivo OZT não foi criado: ${outputPath}`);
        }
        
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
async function oztToTga(oztPath: string, outputFolder?: string): Promise<void> {
  const uint8Array = await electronService.readFile(oztPath);
  
  // Validação básica
  if (!uint8Array || uint8Array.length < 18) {
    throw new Error('Arquivo OZT inválido (muito pequeno)');
  }
  
  const arrayBuffer = uint8Array.buffer.slice(
    uint8Array.byteOffset,
    uint8Array.byteOffset + uint8Array.byteLength
  );
  
  const imageData = decodeOZT(arrayBuffer);
  
  // Valida resultado
  if (!imageData || imageData.width <= 0 || imageData.height <= 0) {
    throw new Error('Falha ao decodificar OZT: dimensões inválidas');
  }
  
  const tgaBuffer = encodeTGA(imageData);
  
  const filename = (await electronService.getBasename(oztPath)).replace(/\.ozt$/i, '.tga');
  const outputPath = outputFolder 
    ? await electronService.joinPath(outputFolder, filename)
    : oztPath.replace(/\.ozt$/i, '.tga');
  
  console.log('[OZT→TGA] ========================================');
  console.log('[OZT→TGA] Arquivo de origem:', oztPath);
  console.log('[OZT→TGA] Pasta de destino:', outputFolder || 'mesma pasta do arquivo');
  console.log('[OZT→TGA] Nome do arquivo:', filename);
  console.log('[OZT→TGA] Caminho completo:', outputPath);
  console.log('[OZT→TGA] Dimensões:', imageData.width, 'x', imageData.height);
  console.log('[OZT→TGA] ========================================');
  
  await electronService.writeFile(outputPath, new Uint8Array(tgaBuffer));
  
  // Verifica se o arquivo foi criado
  try {
    const stats = await electronService.getFileStats(outputPath);
    console.log('[OZT→TGA] Arquivo criado com sucesso!');
    console.log('[OZT→TGA] Tamanho verificado:', stats.size, 'bytes');
    console.log('[OZT→TGA] Localizacao:', outputPath);
  } catch (err) {
    console.error('[OZT→TGA] ERRO: Arquivo nao foi encontrado apos salvar!');
    throw new Error(`Arquivo TGA não foi criado: ${outputPath}`);
  }
}

// OZJ -> JPG
async function ozjToJpg(ozjPath: string, outputFolder?: string): Promise<void> {
  const uint8Array = await electronService.readFile(ozjPath);
  
  // Validação básica
  if (!uint8Array || uint8Array.length < 2) {
    throw new Error('Arquivo OZJ inválido (muito pequeno)');
  }
  
  const arrayBuffer = uint8Array.buffer.slice(
    uint8Array.byteOffset,
    uint8Array.byteOffset + uint8Array.byteLength
  );
  
  console.log('[OZJ→JPG] ========================================');
  console.log('[OZJ→JPG] Arquivo de origem:', ozjPath);
  console.log('[OZJ→JPG] Tamanho do arquivo OZJ:', arrayBuffer.byteLength, 'bytes');
  
  const jpgBuffer = decodeOZJ(arrayBuffer);
  
  // Valida resultado
  if (!jpgBuffer || jpgBuffer.byteLength < 2) {
    throw new Error('Falha ao extrair JPEG do arquivo OZJ');
  }
  
  // Valida magic number JPEG
  const jpgData = new Uint8Array(jpgBuffer);
  if (jpgData[0] !== 0xFF || jpgData[1] !== 0xD8) {
    throw new Error('JPEG extraído é inválido (magic number incorreto)');
  }
  
  console.log('[OZJ→JPG] Tamanho do JPEG extraído:', jpgBuffer.byteLength, 'bytes');
  
  const filename = (await electronService.getBasename(ozjPath)).replace(/\.ozj$/i, '.jpg');
  const outputPath = outputFolder 
    ? await electronService.joinPath(outputFolder, filename)
    : ozjPath.replace(/\.ozj$/i, '.jpg');
  
  console.log('[OZJ→JPG] Pasta de destino:', outputFolder || 'mesma pasta do arquivo');
  console.log('[OZJ→JPG] Nome do arquivo:', filename);
  console.log('[OZJ→JPG] Caminho completo:', outputPath);
  
  await electronService.writeFile(outputPath, new Uint8Array(jpgBuffer));
  
  // Verifica se o arquivo foi criado
  try {
    const stats = await electronService.getFileStats(outputPath);
    console.log('[OZJ→JPG] Arquivo criado com sucesso!');
    console.log('[OZJ→JPG] Tamanho verificado:', stats.size, 'bytes');
    console.log('[OZJ→JPG] Localizacao:', outputPath);
  } catch (err) {
    console.error('[OZJ→JPG] ERRO: Arquivo nao foi encontrado apos salvar!');
    throw new Error(`Arquivo JPG não foi criado: ${outputPath}`);
  }
  
  console.log('[OZJ→JPG] ========================================');
}
