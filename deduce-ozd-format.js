const fs = require('fs');
const path = require('path');
const pako = require('pako');

console.log('='.repeat(80));
console.log('TENTANDO DEDUZIR FORMATO OZD');
console.log('='.repeat(80));

const filepath = path.join(__dirname, 'arquivos para estudar o formato/bg_3_1.ozd');
const data = fs.readFileSync(filepath);

console.log(`Arquivo: ${data.length} bytes`);
console.log(`Header: ${Array.from(data.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

// HIPÓTESE 1: Header de 4 bytes + dados comprimidos
console.log('\n[TESTE 1] Header 4 bytes + zlib');
const header4 = data.slice(0, 4);
console.log(`  Header: ${Array.from(header4).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
console.log(`  Interpretação:`);
console.log(`    Byte 0 (0x${header4[0].toString(16)}): ${header4[0]} = tipo/versão?`);
console.log(`    Byte 1 (0x${header4[1].toString(16)}): ${header4[1]} = flags?`);
console.log(`    Bytes 2-3 (0x${header4[2].toString(16)} 0x${header4[3].toString(16)}): ${header4[2] | (header4[3] << 8)} = tamanho?`);

try {
  const decompressed = pako.inflate(data.slice(4));
  console.log(`  SUCESSO! Dados descomprimidos: ${decompressed.length} bytes`);
  
  if (decompressed[0] === 0x44 && decompressed[1] === 0x44 && decompressed[2] === 0x53 && decompressed[3] === 0x20) {
    console.log(`  É DDS! Salvando...`);
    fs.writeFileSync('test-ozd-deduced-4.dds', decompressed);
  }
} catch (e) {
  const msg = e.message ? e.message.split('\n')[0] : String(e);
  console.log(`  Falhou: ${msg}`);
}

// HIPÓTESE 2: Header de 8 bytes + dados
console.log('\n[TESTE 2] Header 8 bytes + zlib');
const header8 = data.slice(0, 8);
console.log(`  Header: ${Array.from(header8).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

try {
  const decompressed = pako.inflate(data.slice(8));
  console.log(`  SUCESSO! Dados descomprimidos: ${decompressed.length} bytes`);
  
  if (decompressed[0] === 0x44 && decompressed[1] === 0x44) {
    console.log(`  É DDS! Salvando...`);
    fs.writeFileSync('test-ozd-deduced-8.dds', decompressed);
  }
} catch (e) {
  const msg = e.message ? e.message.split('\n')[0] : String(e);
  console.log(`  Falhou: ${msg}`);
}

// HIPÓTESE 3: Header de 16 bytes + dados
console.log('\n[TESTE 3] Header 16 bytes + zlib');
try {
  const decompressed = pako.inflate(data.slice(16));
  console.log(`  SUCESSO! Dados descomprimidos: ${decompressed.length} bytes`);
  
  if (decompressed[0] === 0x44 && decompressed[1] === 0x44) {
    console.log(`  É DDS! Salvando...`);
    fs.writeFileSync('test-ozd-deduced-16.dds', decompressed);
  }
} catch (e) {
  const msg = e.message ? e.message.split('\n')[0] : String(e);
  console.log(`  Falhou: ${msg}`);
}

// HIPÓTESE 4: Tenta inflar diferentes offsets
console.log('\n[TESTE 4] Procurando header zlib em diferentes offsets');
for (let offset = 0; offset < 64; offset++) {
  const slice = data.slice(offset);
  // Verifica se começa com magic zlib
  if (slice[0] === 0x78 && (slice[1] === 0x9C || slice[1] === 0x01 || slice[1] === 0xDA || slice[1] === 0x5E)) {
    console.log(`  Possível zlib no offset ${offset}`);
    try {
      const decompressed = pako.inflate(slice);
      console.log(`    SUCESSO! ${decompressed.length} bytes`);
      
      if (decompressed[0] === 0x44 && decompressed[1] === 0x44) {
        console.log(`    É DDS! Salvando...`);
        fs.writeFileSync(`test-ozd-offset-${offset}.dds`, decompressed);
      }
    } catch (e) {
      console.log(`    Falhou: ${e.message.split('\n')[0]}`);
    }
  }
}

// HIPÓTESE 5: LZ77/LZSS customizado (comum em jogos)
console.log('\n[TESTE 5] Header pode conter informações de tamanho');
const view = new DataView(data.buffer);

// Tenta diferentes interpretações do header
console.log(`  Little-endian uint32 em offset 0: ${view.getUint32(0, true)}`);
console.log(`  Little-endian uint32 em offset 4: ${view.getUint32(4, true)}`);
console.log(`  Little-endian uint16 em offset 0: ${view.getUint16(0, true)}`);
console.log(`  Little-endian uint16 em offset 2: ${view.getUint16(2, true)}`);
console.log(`  Little-endian uint16 em offset 4: ${view.getUint16(4, true)}`);
console.log(`  Little-endian uint16 em offset 6: ${view.getUint16(6, true)}`);

// Tamanho descomprimido esperado para DDS (aproximado)
// DDS = 128 bytes header + pixel data
// Se for 512x512 RGBA = 128 + 512*512*4 = 1048704 bytes
// Se for 256x256 RGBA = 128 + 256*256*4 = 262272 bytes

const possibleSizes = [
  view.getUint32(0, true),
  view.getUint32(4, true),
  view.getUint16(0, true),
  view.getUint16(2, true),
  view.getUint16(4, true),
  view.getUint16(6, true),
];

console.log(`\n  Tamanhos possíveis no header:`);
for (const size of possibleSizes) {
  if (size > 128 && size < 10000000) {
    console.log(`    ${size} bytes (${Math.sqrt(size/4).toFixed(0)}x${Math.sqrt(size/4).toFixed(0)} se for RGBA)`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('FIM');
console.log('='.repeat(80));
