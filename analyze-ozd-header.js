const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('ANALISE: Procurando chave embutida no OZD');
console.log('='.repeat(80));

const ozdDir = path.join(__dirname, 'arquivos para estudar o formato');
const files = fs.readdirSync(ozdDir).filter(f => f.toLowerCase().endsWith('.ozd'));

console.log(`\nAnalisando ${files.length} arquivos OZD...\n`);

for (const filename of files) {
  const filepath = path.join(ozdDir, filename);
  const buffer = fs.readFileSync(filepath);
  const data = new Uint8Array(buffer);
  
  console.log('='.repeat(60));
  console.log(`${filename} (${data.length} bytes)`);
  console.log('='.repeat(60));
  
  // Analisa primeiros 32 bytes em detalhes
  console.log('\nPrimeiros 32 bytes:');
  const first32 = Array.from(data.slice(0, 32));
  console.log(first32.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  
  // Procura por padroes
  console.log('\nPADROES:');
  
  // Verifica se primeiros 4 bytes sao fixos
  console.log(`  Bytes 0-3: [${first32.slice(0, 4).map(b => '0x' + b.toString(16)).join(', ')}]`);
  
  // Verifica se ha um uint32 no inicio (possivel chave ou tamanho)
  const view = new DataView(buffer.buffer);
  const uint32LE = view.getUint32(0, true);
  const uint32BE = view.getUint32(0, false);
  
  console.log(`  Uint32 LE: ${uint32LE} (0x${uint32LE.toString(16)})`);
  console.log(`  Uint32 BE: ${uint32BE} (0x${uint32BE.toString(16)})`);
  
  // Verifica ultimos 32 bytes (pode ter checksum/assinatura)
  const last32 = Array.from(data.slice(-32));
  console.log('\nUltimos 32 bytes:');
  console.log(last32.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  
  // Procura por strings "DDS" ou "OZD" no arquivo
  let hasDDS = false;
  let hasOZD = false;
  
  for (let i = 0; i < data.length - 3; i++) {
    if (data[i] === 0x44 && data[i+1] === 0x44 && data[i+2] === 0x53) {
      console.log(`\n  String "DDS" encontrada no offset ${i}!`);
      hasDDS = true;
    }
    if (data[i] === 0x4F && data[i+1] === 0x5A && data[i+2] === 0x44) {
      console.log(`\n  String "OZD" encontrada no offset ${i}!`);
      hasOZD = true;
    }
  }
  
  console.log('');
}

console.log('='.repeat(80));
console.log('CONCLUSAO:');
console.log('Procurando por:');
console.log('  - Header comum em todos (pode ser tamanho, versao, etc)');
console.log('  - Assinatura/checksum no fim');
console.log('  - Strings "DDS" ou "OZD" embutidas');
console.log('='.repeat(80));
