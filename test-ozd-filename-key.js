const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('TESTE: CHAVE BASEADA NO NOME DO ARQUIVO');
console.log('='.repeat(80));

const ozdDir = path.join(__dirname, 'arquivos para estudar o formato');
const files = fs.readdirSync(ozdDir).filter(f => f.toLowerCase().endsWith('.ozd'));

const DDS_EXPECTED = [0x44, 0x44, 0x53, 0x20];

console.log('\nARQUIVOS E CHAVES DEDUZIDAS:\n');

for (const filename of files) {
  const filepath = path.join(ozdDir, filename);
  const buffer = fs.readFileSync(filepath);
  const data = new Uint8Array(buffer);
  
  // Deduz chave
  const keys = [];
  for (let i = 0; i < 4; i++) {
    keys.push(data[i] ^ DDS_EXPECTED[i]);
  }
  
  console.log(`${filename}:`);
  console.log(`  Chave: [${keys.map(k => '0x' + k.toString(16).padStart(2, '0')).join(', ')}]`);
  console.log(`  Chave ASCII: "${String.fromCharCode(...keys)}"`);
  console.log(`  Nome sem extensao: "${filename.replace('.ozd', '').replace('.OZD', '')}"`);
  
  // Testa se a chave e derivada do nome
  const baseName = filename.replace('.ozd', '').replace('.OZD', '');
  console.log(`  Comprimento nome: ${baseName.length}`);
  
  // Calcula hash simples do nome
  let hash = 0;
  for (let i = 0; i < baseName.length; i++) {
    hash = ((hash << 5) - hash) + baseName.charCodeAt(i);
    hash = hash & 0xFFFFFFFF;
  }
  console.log(`  Hash do nome: 0x${hash.toString(16)}`);
  console.log('');
}

console.log('='.repeat(80));
console.log('ANALISE:');
console.log('  - Verificar se ha correlacao entre nome e chave');
console.log('  - A chave pode usar primeiros N caracteres do nome');
console.log('  - Ou hash do nome do arquivo');
console.log('='.repeat(80));

// Teste: usa primeiros caracteres do nome como chave
console.log('\nTESTE: Primeiros caracteres do nome como chave');
for (const filename of files.slice(0, 1)) {
  const filepath = path.join(ozdDir, filename);
  const buffer = fs.readFileSync(filepath);
  const data = new Uint8Array(buffer);
  const baseName = filename.replace('.ozd', '').replace('.OZD', '');
  
  console.log(`\n${filename}:`);
  
  // Testa diferentes tamanhos de chave do nome
  for (let keyLen = 3; keyLen <= Math.min(8, baseName.length); keyLen++) {
    const nameKey = baseName.substring(0, keyLen).split('').map(c => c.charCodeAt(0));
    
    const decrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      decrypted[i] = data[i] ^ nameKey[i % nameKey.length];
    }
    
    if (decrypted[0] === 0x44 && decrypted[1] === 0x44 && 
        decrypted[2] === 0x53 && decrypted[3] === 0x20) {
      console.log(`  SUCESSO! Chave dos primeiros ${keyLen} chars: "${baseName.substring(0, keyLen)}"`);
      
      const outputPath = path.join(__dirname, `test-ozd-name-${keyLen}.dds`);
      fs.writeFileSync(outputPath, Buffer.from(decrypted));
      console.log(`  Salvo em: ${outputPath}`);
    }
  }
}

console.log('\n' + '='.repeat(80));
