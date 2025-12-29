const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('DEDUZINDO CHAVE COMPLETA (nao apenas 4 bytes)');
console.log('='.repeat(80));

const filepath = path.join(__dirname, 'arquivos para estudar o formato/bg_3_1.ozd');
const buffer = fs.readFileSync(filepath);
const data = new Uint8Array(buffer);

// Header DDS completo esperado (primeiros 128 bytes padrao)
// Vou assumir valores comuns de DDS para deduzir a chave
const DDS_HEADER_EXPECTED = new Uint8Array(128);

// Magic "DDS "
DDS_HEADER_EXPECTED[0] = 0x44; // D
DDS_HEADER_EXPECTED[1] = 0x44; // D
DDS_HEADER_EXPECTED[2] = 0x53; // S
DDS_HEADER_EXPECTED[3] = 0x20; // space

// Header size (124 bytes)
DDS_HEADER_EXPECTED[4] = 0x7C;
DDS_HEADER_EXPECTED[5] = 0x00;
DDS_HEADER_EXPECTED[6] = 0x00;
DDS_HEADER_EXPECTED[7] = 0x00;

console.log('Deduzindo chave dos primeiros 128 bytes:\n');

// Deduz chave byte por byte
const deducedKey = [];
for (let i = 0; i < Math.min(128, data.length); i++) {
  const keyByte = data[i] ^ DDS_HEADER_EXPECTED[i];
  deducedKey.push(keyByte);
}

// Procura por padroes repetitivos na chave
console.log('Procurando padrao repetitivo na chave...\n');

for (let keyLength = 4; keyLength <= 64; keyLength++) {
  const pattern = deducedKey.slice(0, keyLength);
  let matches = true;
  
  // Verifica se o padrao se repete
  for (let i = keyLength; i < 128 && i < data.length; i++) {
    if (deducedKey[i] !== pattern[i % keyLength]) {
      matches = false;
      break;
    }
  }
  
  if (matches) {
    console.log(`PADRAO ENCONTRADO! Comprimento da chave: ${keyLength} bytes`);
    console.log(`Chave: [${pattern.map(k => '0x' + k.toString(16).padStart(2, '0')).join(', ')}]`);
    console.log(`Chave ASCII: "${String.fromCharCode(...pattern.filter(k => k >= 32 && k <= 126))}"`);
    
    // Aplica a chave no arquivo todo
    const decrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      decrypted[i] = data[i] ^ pattern[i % keyLength];
    }
    
    console.log(`\nPrimeiros 32 bytes desencriptados:`);
    console.log(Array.from(decrypted.slice(0, 32)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
    
    // Salva
    const outputPath = path.join(__dirname, `test-ozd-key${keyLength}.dds`);
    fs.writeFileSync(outputPath, Buffer.from(decrypted));
    console.log(`\nSalvo em: ${outputPath}`);
    
    // Valida header DDS
    const view = new DataView(decrypted.buffer);
    console.log(`\nVALIDACAO DDS:`);
    console.log(`  Magic: "${String.fromCharCode(decrypted[0], decrypted[1], decrypted[2], decrypted[3])}"`);
    console.log(`  Header size: ${view.getUint32(4, true)}`);
    console.log(`  Height: ${view.getUint32(12, true)}`);
    console.log(`  Width: ${view.getUint32(16, true)}`);
    
    break; // Para no primeiro padrao encontrado
  }
}

console.log('\n' + '='.repeat(80));
