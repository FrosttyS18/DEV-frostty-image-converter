const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('TESTE: MODULUS CIPHER (comum no Mu Online)');
console.log('='.repeat(80));

const filepath = path.join(__dirname, 'arquivos para estudar o formato/bg_3_1.ozd');
const buffer = fs.readFileSync(filepath);
const data = new Uint8Array(buffer);

console.log(`\nArquivo: bg_3_1.ozd`);
console.log(`Tamanho: ${data.length} bytes\n`);

const DDS_MAGIC = [0x44, 0x44, 0x53, 0x20];

// ModulusCipher comum no Mu Online
function modulusCipher(data, key, modValue) {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = (data[i] - (key[i % key.length] % modValue)) & 0xFF;
  }
  return result;
}

// Teste com diferentes parametros
console.log('TESTANDO MODULUS CIPHER:');

const keys = [
  [0xFC, 0x3D, 0x1C],
  [0xC3, 0xB1, 0xA2, 0x93],
  [0x5E, 0x2D, 0x1C, 0x0B],
];

const modValues = [256, 251, 127, 100, 64];

for (const key of keys) {
  for (const mod of modValues) {
    const decrypted = modulusCipher(data, key, mod);
    
    if (decrypted[0] === DDS_MAGIC[0] && decrypted[1] === DDS_MAGIC[1] && 
        decrypted[2] === DDS_MAGIC[2] && decrypted[3] === DDS_MAGIC[3]) {
      console.log(`  SUCESSO!`);
      console.log(`    Chave: [${key.map(k => '0x' + k.toString(16)).join(', ')}]`);
      console.log(`    Modulus: ${mod}`);
      
      const outputPath = path.join(__dirname, 'test-ozd-modulus.dds');
      fs.writeFileSync(outputPath, Buffer.from(decrypted));
      console.log(`    Salvo em: ${outputPath}`);
    }
  }
}

// Teste: Simple decrypt do MapleStory (similar a Mu Online)
console.log('\nTESTE: Algoritmo estilo MapleStory/Mu:');

function mapleDecrypt(data, key) {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = (((data[i] - 0x80) ^ key) - (i & 0xFF)) & 0xFF;
  }
  return result;
}

const testKeys = [0xFC, 0x3D, 0xC1, 0x5E, 0x0F];
for (const key of testKeys) {
  const decrypted = mapleDecrypt(data, key);
  
  if (decrypted[0] === DDS_MAGIC[0] && decrypted[1] === DDS_MAGIC[1]) {
    console.log(`  SUCESSO! Chave: 0x${key.toString(16)}`);
    
    const outputPath = path.join(__dirname, 'test-ozd-maple.dds');
    fs.writeFileSync(outputPath, Buffer.from(decrypted));
    console.log(`  Salvo em: ${outputPath}`);
  }
}

// Teste: Brute force inteligente (testa apenas offsets + chaves simples)
console.log('\nTESTE: Brute force com offset + XOR:');

const offsets = [0, 4, 8, 12, 16, 20, 24, 32];
const xorKeys = [0x00, 0x0F, 0x1F, 0x2F, 0x3F, 0x4F, 0x5F, 0x6F, 0x7F, 0x8F, 0x9F, 0xAF, 0xBF, 0xCF, 0xDF, 0xEF, 0xFF];

for (const offset of offsets) {
  for (const xorKey of xorKeys) {
    if (offset >= data.length - 4) continue;
    
    const slice = data.slice(offset);
    const decrypted = new Uint8Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      decrypted[i] = slice[i] ^ xorKey;
    }
    
    if (decrypted[0] === DDS_MAGIC[0] && decrypted[1] === DDS_MAGIC[1] && 
        decrypted[2] === DDS_MAGIC[2] && decrypted[3] === DDS_MAGIC[3]) {
      console.log(`  SUCESSO! Offset: ${offset}, XOR: 0x${xorKey.toString(16)}`);
      
      const outputPath = path.join(__dirname, `test-ozd-offset${offset}-xor${xorKey.toString(16)}.dds`);
      fs.writeFileSync(outputPath, Buffer.from(decrypted));
      console.log(`  Salvo em: ${outputPath}`);
    }
  }
}

console.log('\n' + '='.repeat(80));
