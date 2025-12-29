const fs = require('fs');
const path = require('path');
const pako = require('pako');

const ozjPath = path.join(__dirname, 'arquivos para estudar o formato', 'lo_back_01.OZJ');

console.log('='.repeat(80));
console.log('ANÁLISE DE ARQUIVO OZJ DO MU ONLINE');
console.log('='.repeat(80));

if (!fs.existsSync(ozjPath)) {
  console.error('Arquivo não encontrado:', ozjPath);
  process.exit(1);
}

const buffer = fs.readFileSync(ozjPath);
const bytes = new Uint8Array(buffer);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

console.log(`\nArquivo: ${path.basename(ozjPath)}`);
console.log(`Tamanho: ${buffer.length} bytes`);

// Mostra primeiros 64 bytes em hex
console.log('\n--- PRIMEIROS 64 BYTES (HEX) ---');
for (let i = 0; i < Math.min(64, bytes.length); i += 16) {
  const offset = i.toString(16).padStart(8, '0');
  const hexPart = [];
  const asciiPart = [];
  
  for (let j = 0; j < 16 && i + j < bytes.length; j++) {
    const byte = bytes[i + j];
    hexPart.push(byte.toString(16).padStart(2, '0'));
    asciiPart.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.');
  }
  
  console.log(`${offset}  ${hexPart.join(' ')}  |${asciiPart.join('')}|`);
}

// Análise de cabeçalho
console.log('\n--- ANÁLISE DE CABEÇALHO ---');
console.log(`Bytes 0-3: 0x${bytes[0].toString(16).padStart(2, '0')} 0x${bytes[1].toString(16).padStart(2, '0')} 0x${bytes[2].toString(16).padStart(2, '0')} 0x${bytes[3].toString(16).padStart(2, '0')}`);

const view = new DataView(arrayBuffer);
console.log(`  Como uint32 LE: ${view.getUint32(0, true)}`);
console.log(`  Como uint32 BE: ${view.getUint32(0, false)}`);

if (bytes.length >= 8) {
  console.log(`Bytes 4-7: 0x${bytes[4].toString(16).padStart(2, '0')} 0x${bytes[5].toString(16).padStart(2, '0')} 0x${bytes[6].toString(16).padStart(2, '0')} 0x${bytes[7].toString(16).padStart(2, '0')}`);
  console.log(`  Como uint32 LE: ${view.getUint32(4, true)}`);
  console.log(`  Como uint32 BE: ${view.getUint32(4, false)}`);
}

if (bytes.length >= 12) {
  console.log(`Bytes 8-11: 0x${bytes[8].toString(16).padStart(2, '0')} 0x${bytes[9].toString(16).padStart(2, '0')} 0x${bytes[10].toString(16).padStart(2, '0')} 0x${bytes[11].toString(16).padStart(2, '0')}`);
  console.log(`  Como uint32 LE: ${view.getUint32(8, true)}`);
  console.log(`  Como uint32 BE: ${view.getUint32(8, false)}`);
}

// Detecta magic numbers
console.log('\n--- MAGIC NUMBERS ---');

// JPEG
if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
  console.log('✓ JPEG direto no offset 0');
}

// Zlib
if (bytes[0] === 0x78 && (bytes[1] === 0x9C || bytes[1] === 0x01 || bytes[1] === 0xDA || bytes[1] === 0x5E)) {
  console.log('✓ Zlib comprimido no offset 0');
}

// Procura em offsets comuns
const commonOffsets = [1, 2, 4, 8, 12, 16, 20, 24, 28, 32];
for (const offset of commonOffsets) {
  if (offset + 1 < bytes.length) {
    if (bytes[offset] === 0xFF && bytes[offset + 1] === 0xD8) {
      console.log(`✓ JPEG encontrado no offset ${offset}`);
    }
    if (bytes[offset] === 0x78 && 
        (bytes[offset + 1] === 0x9C || bytes[offset + 1] === 0x01 || 
         bytes[offset + 1] === 0xDA || bytes[offset + 1] === 0x5E)) {
      console.log(`✓ Zlib encontrado no offset ${offset}`);
    }
  }
}

// Tenta descomprimir
console.log('\n--- TENTATIVAS DE DESCOMPRESSÃO ---');

// Offset 0
try {
  const decompressed = pako.inflate(bytes);
  console.log(`✓ Offset 0: SUCESSO! ${decompressed.length} bytes descomprimidos`);
  console.log(`  Primeiros 16 bytes: ${Array.from(decompressed.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
  
  if (decompressed[0] === 0xFF && decompressed[1] === 0xD8) {
    console.log(`  ✓✓ Conteúdo é JPEG!`);
    
    // Salva para teste
    const outputPath = path.join(__dirname, 'test-ozj-decompressed.jpg');
    fs.writeFileSync(outputPath, Buffer.from(decompressed));
    console.log(`  ✓✓ Salvo em: ${outputPath}`);
  }
} catch (err) {
  console.log(`✗ Offset 0: FALHOU (${err.message})`);
}

// Tenta outros offsets
for (const offset of [4, 8, 12, 16, 20, 24]) {
  try {
    const sliced = bytes.slice(offset);
    const decompressed = pako.inflate(sliced);
    console.log(`✓ Offset ${offset}: SUCESSO! ${decompressed.length} bytes descomprimidos`);
    console.log(`  Primeiros 16 bytes: ${Array.from(decompressed.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
    
    if (decompressed[0] === 0xFF && decompressed[1] === 0xD8) {
      console.log(`  ✓✓ Conteúdo é JPEG!`);
      
      // Salva para teste
      const outputPath = path.join(__dirname, `test-ozj-offset${offset}.jpg`);
      fs.writeFileSync(outputPath, Buffer.from(decompressed));
      console.log(`  ✓✓ Salvo em: ${outputPath}`);
    }
  } catch (err) {
    console.log(`✗ Offset ${offset}: FALHOU`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('ANÁLISE CONCLUÍDA');
console.log('='.repeat(80));
