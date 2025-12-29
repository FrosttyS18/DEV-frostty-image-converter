/**
 * Utilitário para conversão OZD <-> DDS
 * OZD é um arquivo encriptado que contém DDS
 */

export interface OZDDecryptResult {
  success: boolean;
  data?: Uint8Array;
  error?: string;
  key?: number;
}

/**
 * Descriptografa arquivo OZD para DDS
 * OZD usa XOR simples para encriptação
 */
export function decryptOZD(ozdData: Uint8Array): OZDDecryptResult {
  if (!ozdData || ozdData.length < 128) {
    return { success: false, error: 'Arquivo OZD muito pequeno ou inválido' };
  }

  // Magic number DDS esperado: "DDS " = 0x44 0x44 0x53 0x20
  const DDS_MAGIC = [0x44, 0x44, 0x53, 0x20];
  
  // Header DDS esperado (primeiros 8 bytes)
  const DDS_EXPECTED = [
    0x44, 0x44, 0x53, 0x20,  // "DDS "
    0x7C, 0x00, 0x00, 0x00,  // Header size (124)
  ];

  console.log('[OZD] Iniciando descriptografia...');
  console.log('[OZD] Tamanho do arquivo:', ozdData.length, 'bytes');
  console.log('[OZD] Primeiros 8 bytes:', Array.from(ozdData.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

  // MÉTODO 1: Deduz chave XOR comparando com header DDS esperado
  const possibleKeys: number[] = [];
  for (let i = 0; i < 4; i++) {
    const key = ozdData[i] ^ DDS_EXPECTED[i];
    possibleKeys.push(key);
  }

  console.log('[OZD] Chaves possíveis:', possibleKeys.map(k => '0x' + k.toString(16).padStart(2, '0')).join(', '));

  // Verifica se todas as chaves são iguais (XOR com chave fixa)
  const allSame = possibleKeys.every(k => k === possibleKeys[0]);
  
  if (allSame) {
    console.log('[OZD] XOR com chave fixa:', '0x' + possibleKeys[0].toString(16).padStart(2, '0'));
    
    // Descriptografa com chave fixa
    const decrypted = new Uint8Array(ozdData.length);
    const key = possibleKeys[0];
    for (let i = 0; i < ozdData.length; i++) {
      decrypted[i] = ozdData[i] ^ key;
    }

    // Verifica se é DDS válido
    if (decrypted[0] === DDS_MAGIC[0] && 
        decrypted[1] === DDS_MAGIC[1] && 
        decrypted[2] === DDS_MAGIC[2] && 
        decrypted[3] === DDS_MAGIC[3]) {
      console.log('[OZD] ✓ Arquivo descriptografado com sucesso!');
      console.log('[OZD] Primeiros 8 bytes DDS:', Array.from(decrypted.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      return { success: true, data: decrypted, key: key };
    }
  }

  // MÉTODO 2: XOR com chave rotativa
  console.log('[OZD] Tentando XOR com chave rotativa...');
  const decrypted2 = new Uint8Array(ozdData.length);
  for (let i = 0; i < ozdData.length; i++) {
    const key = possibleKeys[i % possibleKeys.length];
    decrypted2[i] = ozdData[i] ^ key;
  }

  if (decrypted2[0] === DDS_MAGIC[0] && 
      decrypted2[1] === DDS_MAGIC[1] && 
      decrypted2[2] === DDS_MAGIC[2] && 
      decrypted2[3] === DDS_MAGIC[3]) {
    console.log('[OZD] ✓ Arquivo descriptografado com chave rotativa!');
    return { success: true, data: decrypted2 };
  }

  // MÉTODO 3: Testa chaves comuns do Mu Online
  const commonKeys = [0xFC, 0x3D, 0xC1, 0xAA, 0x55, 0xFF];
  console.log('[OZD] Tentando chaves comuns do Mu Online...');
  
  for (const testKey of commonKeys) {
    const decrypted3 = new Uint8Array(ozdData.length);
    for (let i = 0; i < ozdData.length; i++) {
      decrypted3[i] = ozdData[i] ^ testKey;
    }

    if (decrypted3[0] === DDS_MAGIC[0] && 
        decrypted3[1] === DDS_MAGIC[1] && 
        decrypted3[2] === DDS_MAGIC[2] && 
        decrypted3[3] === DDS_MAGIC[3]) {
      console.log('[OZD] ✓ Descriptografado com chave comum:', '0x' + testKey.toString(16).padStart(2, '0'));
      return { success: true, data: decrypted3, key: testKey };
    }
  }

  // MÉTODO 4: Verifica se já é DDS sem encriptação (apenas offset)
  const offsets = [0, 4, 8, 12, 16, 20, 24, 32];
  for (const offset of offsets) {
    if (offset + 4 >= ozdData.length) continue;
    
    if (ozdData[offset] === DDS_MAGIC[0] && 
        ozdData[offset + 1] === DDS_MAGIC[1] && 
        ozdData[offset + 2] === DDS_MAGIC[2] && 
        ozdData[offset + 3] === DDS_MAGIC[3]) {
      console.log('[OZD] ✓ DDS encontrado sem encriptação no offset:', offset);
      return { success: true, data: ozdData.slice(offset) };
    }
  }

  console.error('[OZD] ✗ Não foi possível descriptografar o arquivo OZD');
  return { success: false, error: 'Não foi possível descriptografar. Arquivo pode estar corrompido ou usar algoritmo diferente.' };
}

/**
 * Encripta DDS para OZD
 * Usa XOR com chave padrão do Mu Online
 */
export function encryptDDS(ddsData: Uint8Array, key: number = 0xFC): Uint8Array {
  const encrypted = new Uint8Array(ddsData.length);
  for (let i = 0; i < ddsData.length; i++) {
    encrypted[i] = ddsData[i] ^ key;
  }
  return encrypted;
}
