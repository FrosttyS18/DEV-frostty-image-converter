const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('TESTE AVANCADO DE DESENCRIPTACAO OZD');
console.log('='.repeat(80));

const filepath = path.join(__dirname, 'arquivos para estudar o formato/bg_3_1.ozd');
const buffer = fs.readFileSync(filepath);
const data = new Uint8Array(buffer);

console.log(`Arquivo: bg_3_1.ozd`);
console.log(`Tamanho: ${data.length} bytes\n`);

const DDS_MAGIC = [0x44, 0x44, 0x53, 0x20]; // "DDS "

// Teste 1: XOR com array de chaves (comum em jogos coreanos)
console.log('[1] XOR com array de chaves (sequencia):');
const keyArrays = [
  [0xFC, 0x3D, 0x1C],
  [0x5E, 0x1F, 0x8A],
  [0xC1, 0xC2, 0xC3, 0xC4],
  [0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16],
];

for (const keyArray of keyArrays) {
  const decrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const key = keyArray[i % keyArray.length];
    decrypted[i] = data[i] ^ key;
  }
  
  if (decrypted[0] === DDS_MAGIC[0] && decrypted[1] === DDS_MAGIC[1] && 
      decrypted[2] === DDS_MAGIC[2] && decrypted[3] === DDS_MAGIC[3]) {
    console.log(`  SUCESSO! Chave: [${keyArray.map(k => '0x' + k.toString(16)).join(', ')}]`);
    
    const outputPath = path.join(__dirname, 'test-ozd-decrypted.dds');
    fs.writeFileSync(outputPath, Buffer.from(decrypted));
    console.log(`  Salvo em: ${outputPath}`);
    process.exit(0);
  }
}

// Teste 2: XOR com chave derivada do tamanho do arquivo
console.log('\n[2] XOR com chave baseada no tamanho:');
const sizeKey = data.length & 0xFF;
const decrypted2 = new Uint8Array(data.length);
for (let i = 0; i < data.length; i++) {
  decrypted2[i] = data[i] ^ sizeKey;
}

console.log(`  Chave: 0x${sizeKey.toString(16)}`);
console.log(`  Primeiros bytes: ${Array.from(decrypted2.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

// Teste 3: Busca brute force parcial (chaves comuns de jogos coreanos)
console.log('\n[3] Brute force chaves comuns:');
const commonKeys = [
  0xFC, 0x3D, 0xC1, 0x5E, 0xAA, 0x55, 0xCC, 0x33,
  0x0F, 0xF0, 0x1C, 0xC8, 0x7E, 0xE7, 0x9A, 0xA9
];

for (const key of commonKeys) {
  const decrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    decrypted[i] = data[i] ^ key;
  }
  
  // Verifica DDS magic
  if (decrypted[0] === DDS_MAGIC[0] && decrypted[1] === DDS_MAGIC[1] && 
      decrypted[2] === DDS_MAGIC[2] && decrypted[3] === DDS_MAGIC[3]) {
    console.log(`  SUCESSO! Chave: 0x${key.toString(16).padStart(2, '0')}`);
    
    const outputPath = path.join(__dirname, 'test-ozd-key-' + key.toString(16) + '.dds');
    fs.writeFileSync(outputPath, Buffer.from(decrypted));
    console.log(`  Salvo em: ${outputPath}`);
  }
}

// Teste 4: Analise de entropia (verifica se e compressao ou encriptacao)
console.log('\n[4] Analise de entropia:');
const freq = new Array(256).fill(0);
for (let i = 0; i < Math.min(1000, data.length); i++) {
  freq[data[i]]++;
}

const uniqueBytes = freq.filter(f => f > 0).length;
console.log(`  Bytes unicos (primeiros 1000): ${uniqueBytes}/256`);
console.log(`  Entropia: ${uniqueBytes > 240 ? 'ALTA (encriptado/comprimido)' : 'BAIXA (dados raw)'}`);

console.log('\n' + '='.repeat(80));
console.log('Se nenhum metodo funcionou, OZD usa encriptacao customizada');
console.log('Seria necessario:');
console.log('  1. Engenharia reversa do cliente do Mu Online');
console.log('  2. Documentacao da comunidade Mu Online');
console.log('  3. Ferramenta de terceiros que ja desencripta');
console.log('='.repeat(80));
