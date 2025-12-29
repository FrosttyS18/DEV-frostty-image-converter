const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('ANALISE DETALHADA DE ARQUIVO OZD');
console.log('='.repeat(80));

const filepath = path.join(__dirname, 'arquivos para estudar o formato/bg_3_1.ozd');
const data = fs.readFileSync(filepath);

console.log(`\nArquivo: bg_3_1.ozd`);
console.log(`Tamanho: ${data.length} bytes (0x${data.length.toString(16)})`);

// Mostra primeiros 256 bytes em hex
console.log('\n' + '='.repeat(80));
console.log('PRIMEIROS 256 BYTES:');
console.log('='.repeat(80));

for (let i = 0; i < Math.min(256, data.length); i += 16) {
  const offset = i.toString(16).padStart(8, '0').toUpperCase();
  const hex = [];
  const ascii = [];
  
  for (let j = 0; j < 16 && i + j < data.length; j++) {
    const byte = data[i + j];
    hex.push(byte.toString(16).padStart(2, '0').toUpperCase());
    ascii.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.');
  }
  
  console.log(`${offset}  ${hex.join(' ').padEnd(47, ' ')}  ${ascii.join('')}`);
}

// Análise de header DDS esperado
console.log('\n' + '='.repeat(80));
console.log('ANALISE: PROCURANDO PADROES DDS');
console.log('='.repeat(80));

const DDS_MAGIC = Buffer.from([0x44, 0x44, 0x53, 0x20]); // "DDS "
const DDS_HEADER_SIZE = 124; // 0x7C
const TYPICAL_DDS_START = Buffer.from([0x44, 0x44, 0x53, 0x20, 0x7C, 0x00, 0x00, 0x00]);

// Procura magic number DDS no arquivo
console.log('\nProcurando "DDS " (0x44 0x44 0x53 0x20) no arquivo...');
let foundDDS = false;
for (let i = 0; i < data.length - 4; i++) {
  if (data[i] === 0x44 && data[i+1] === 0x44 && data[i+2] === 0x53 && data[i+3] === 0x20) {
    console.log(`  ENCONTRADO no offset 0x${i.toString(16)} (${i} bytes)`);
    foundDDS = true;
  }
}
if (!foundDDS) {
  console.log('  NÃO ENCONTRADO - arquivo está encriptado/comprimido');
}

// Análise de entropia (randomness)
console.log('\n' + '='.repeat(80));
console.log('ANALISE DE ENTROPIA (mede aleatoriedade):');
console.log('='.repeat(80));

const freq = new Array(256).fill(0);
for (let i = 0; i < data.length; i++) {
  freq[data[i]]++;
}

let entropy = 0;
for (let i = 0; i < 256; i++) {
  if (freq[i] > 0) {
    const p = freq[i] / data.length;
    entropy -= p * Math.log2(p);
  }
}

console.log(`Entropia: ${entropy.toFixed(4)} bits/byte (máximo: 8.0)`);
console.log('  < 6.0 : Provavelmente comprimido ou padrão repetitivo');
console.log('  > 7.5 : Altamente aleatório (encriptado ou comprimido)');
console.log('  ~ 8.0 : Aleatório perfeito (encriptação forte)');

// Bytes mais frequentes
console.log('\nBytes mais frequentes:');
const sorted = freq.map((count, byte) => ({ byte, count }))
  .filter(x => x.count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, 10);

for (const {byte, count} of sorted) {
  const pct = (count / data.length * 100).toFixed(2);
  console.log(`  0x${byte.toString(16).padStart(2, '0')} : ${count.toString().padStart(5)} vezes (${pct}%)`);
}

// Procura por padrões repetitivos
console.log('\n' + '='.repeat(80));
console.log('PROCURANDO PADROES REPETITIVOS:');
console.log('='.repeat(80));

// Verifica se há sequências de bytes iguais
let maxSeq = 0;
let maxSeqByte = 0;
let currentSeq = 1;
for (let i = 1; i < Math.min(1000, data.length); i++) {
  if (data[i] === data[i-1]) {
    currentSeq++;
    if (currentSeq > maxSeq) {
      maxSeq = currentSeq;
      maxSeqByte = data[i];
    }
  } else {
    currentSeq = 1;
  }
}

console.log(`Maior sequência de bytes iguais: ${maxSeq} × 0x${maxSeqByte.toString(16).padStart(2, '0')}`);

// Últimos 128 bytes (pode ter footer)
console.log('\n' + '='.repeat(80));
console.log('ULTIMOS 128 BYTES:');
console.log('='.repeat(80));

const start = Math.max(0, data.length - 128);
for (let i = start; i < data.length; i += 16) {
  const offset = i.toString(16).padStart(8, '0').toUpperCase();
  const hex = [];
  const ascii = [];
  
  for (let j = 0; j < 16 && i + j < data.length; j++) {
    const byte = data[i + j];
    hex.push(byte.toString(16).padStart(2, '0').toUpperCase());
    ascii.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.');
  }
  
  console.log(`${offset}  ${hex.join(' ').padEnd(47, ' ')}  ${ascii.join('')}`);
}

// Testa se pode ser algum tipo de compressão conhecida
console.log('\n' + '='.repeat(80));
console.log('TESTANDO FORMATOS CONHECIDOS:');
console.log('='.repeat(80));

// ZLIB
if (data[0] === 0x78 && (data[1] === 0x9C || data[1] === 0x01 || data[1] === 0xDA || data[1] === 0x5E)) {
  console.log('✓ Pode ser ZLIB (magic: 0x78)');
} else {
  console.log('✗ Não é ZLIB');
}

// GZIP
if (data[0] === 0x1F && data[1] === 0x8B) {
  console.log('✓ Pode ser GZIP (magic: 0x1F 0x8B)');
} else {
  console.log('✗ Não é GZIP');
}

// BZIP2
if (data[0] === 0x42 && data[1] === 0x5A && data[2] === 0x68) {
  console.log('✓ Pode ser BZIP2 (magic: BZh)');
} else {
  console.log('✗ Não é BZIP2');
}

// LZ4
if (data[0] === 0x04 && data[1] === 0x22 && data[2] === 0x4D && data[3] === 0x18) {
  console.log('✓ Pode ser LZ4 (magic: 0x04 0x22 0x4D 0x18)');
} else {
  console.log('✗ Não é LZ4');
}

console.log('\n' + '='.repeat(80));
console.log('FIM DA ANALISE');
console.log('='.repeat(80));
