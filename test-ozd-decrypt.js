const fs = require('fs');
const path = require('path');
const pako = require('pako');

console.log('='.repeat(80));
console.log('TESTE DE DESENCRIPTACAO OZD');
console.log('='.repeat(80));

const filepath = path.join(__dirname, 'arquivos para estudar o formato/bg_3_1.ozd');
const buffer = fs.readFileSync(filepath);
const data = new Uint8Array(buffer);

console.log(`\nArquivo: bg_3_1.ozd`);
console.log(`Tamanho: ${data.length} bytes\n`);

// Magic number DDS esperado: "DDS " = 0x44 0x44 0x53 0x20
const DDS_MAGIC = [0x44, 0x44, 0x53, 0x20];

console.log('TESTANDO METODOS DE DESENCRIPTACAO:');
console.log('='.repeat(80));

// Teste 1: XOR com chave simples
console.log('\n[1] XOR com chaves simples:');
const xorKeys = [0xFC, 0x3D, 0xC1, 0xAA, 0x55, 0xFF, 0x00];

for (const key of xorKeys) {
  const decrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    decrypted[i] = data[i] ^ key;
  }
  
  // Verifica se comeca com DDS magic
  if (decrypted[0] === DDS_MAGIC[0] && decrypted[1] === DDS_MAGIC[1] && 
      decrypted[2] === DDS_MAGIC[2] && decrypted[3] === DDS_MAGIC[3]) {
    console.log(`  SUCESSO! Chave XOR: 0x${key.toString(16).padStart(2, '0')}`);
    
    const outputPath = path.join(__dirname, `test-ozd-xor-${key.toString(16)}.dds`);
    fs.writeFileSync(outputPath, Buffer.from(decrypted));
    console.log(`  Salvo em: ${outputPath}`);
  }
}

// Teste 2: XOR com chave rotativa
console.log('\n[2] XOR com chave rotativa (byte index):');
for (let keyBase = 0; keyBase < 256; keyBase += 17) {
  const decrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const key = (keyBase + i) & 0xFF;
    decrypted[i] = data[i] ^ key;
  }
  
  if (decrypted[0] === DDS_MAGIC[0] && decrypted[1] === DDS_MAGIC[1] && 
      decrypted[2] === DDS_MAGIC[2] && decrypted[3] === DDS_MAGIC[3]) {
    console.log(`  SUCESSO! Chave base: 0x${keyBase.toString(16).padStart(2, '0')}`);
  }
}

// Teste 3: Sem encriptacao, apenas offset
console.log('\n[3] Testando offsets sem encriptacao:');
const offsets = [4, 8, 12, 16, 20, 24, 32, 64, 128];

for (const offset of offsets) {
  if (offset >= data.length) continue;
  
  if (data[offset] === DDS_MAGIC[0] && data[offset + 1] === DDS_MAGIC[1] && 
      data[offset + 2] === DDS_MAGIC[2] && data[offset + 3] === DDS_MAGIC[3]) {
    console.log(`  SUCESSO! DDS encontrado no offset ${offset}`);
    
    const outputPath = path.join(__dirname, `test-ozd-offset-${offset}.dds`);
    fs.writeFileSync(outputPath, Buffer.from(data.slice(offset)));
    console.log(`  Salvo em: ${outputPath}`);
  }
}

// Teste 4: XOR com chave especifica do Mu Online (comum: 0xFC)
console.log('\n[4] XOR com chave 0xFC (comum no Mu Online):');
const muKey = 0xFC;
const decrypted = new Uint8Array(data.length);
for (let i = 0; i < data.length; i++) {
  decrypted[i] = data[i] ^ muKey;
}

console.log(`  Primeiros 16 bytes desencriptados: ${Array.from(decrypted.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

if (decrypted[0] === DDS_MAGIC[0] && decrypted[1] === DDS_MAGIC[1]) {
  console.log(`  PARECE DDS!`);
  const outputPath = path.join(__dirname, 'test-ozd-decrypted.dds');
  fs.writeFileSync(outputPath, Buffer.from(decrypted));
  console.log(`  Salvo em: ${outputPath}`);
}

console.log('\n' + '='.repeat(80));
console.log('TESTE CONCLUIDO');
console.log('='.repeat(80));
