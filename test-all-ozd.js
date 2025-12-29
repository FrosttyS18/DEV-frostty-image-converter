const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('TESTANDO TODOS OS OZD');
console.log('='.repeat(80));

const ozdDir = path.join(__dirname, 'arquivos para estudar o formato');
const files = fs.readdirSync(ozdDir).filter(f => f.toLowerCase().endsWith('.ozd'));

const DDS_EXPECTED = [0x44, 0x44, 0x53, 0x20]; // "DDS "

for (const filename of files) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`ARQUIVO: ${filename}`);
  console.log('='.repeat(60));
  
  const filepath = path.join(ozdDir, filename);
  const buffer = fs.readFileSync(filepath);
  const data = new Uint8Array(buffer);
  
  console.log(`Tamanho: ${data.length} bytes`);
  console.log(`Primeiros 8 bytes: ${Array.from(data.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
  
  // Deduz chave dos primeiros 4 bytes
  const keys = [];
  for (let i = 0; i < 4; i++) {
    keys.push(data[i] ^ DDS_EXPECTED[i]);
  }
  
  console.log(`Chaves XOR deduzidas: [${keys.map(k => '0x' + k.toString(16).padStart(2, '0')).join(', ')}]`);
  
  // Verifica se ha um padrao
  const allSame = keys.every(k => k === keys[0]);
  console.log(`Chave unica? ${allSame ? 'SIM (0x' + keys[0].toString(16) + ')' : 'NAO (array)'}`);
}

console.log('\n' + '='.repeat(80));
console.log('CONCLUSAO:');
console.log('Se todos os arquivos tem a mesma chave, e um padrao consistente');
console.log('Se cada arquivo tem chave diferente, e baseado em algo (nome, tamanho, etc)');
console.log('='.repeat(80));
