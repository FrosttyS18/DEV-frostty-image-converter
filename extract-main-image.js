const fs = require('fs');
const path = require('path');

const ozjPath = path.join(__dirname, 'arquivos para estudar o formato', 'lo_back_01.OZJ');
const buffer = fs.readFileSync(ozjPath);
const bytes = new Uint8Array(buffer);

console.log('='.repeat(80));
console.log('EXTRAÇÃO DA IMAGEM PRINCIPAL DO OZJ');
console.log('='.repeat(80));

// Encontra todos os SOI
const soiOffsets = [];
for (let i = 0; i < bytes.length - 1; i++) {
  if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8) {
    soiOffsets.push(i);
  }
}

// Encontra todos os EOI
const eoiOffsets = [];
for (let i = 0; i < bytes.length - 1; i++) {
  if (bytes[i] === 0xFF && bytes[i + 1] === 0xD9) {
    eoiOffsets.push(i);
  }
}

console.log(`SOI encontrados: ${soiOffsets.length} (offsets: ${soiOffsets.join(', ')})`);
console.log(`EOI encontrados: ${eoiOffsets.length} (offsets: ${eoiOffsets.join(', ')})`);

// A última imagem geralmente é a principal
const lastSOI = soiOffsets[soiOffsets.length - 1];
const lastEOI = eoiOffsets[eoiOffsets.length - 1];

console.log(`\nImagem principal (última):`);
console.log(`  Início: ${lastSOI}`);
console.log(`  Fim: ${lastEOI + 2}`);
console.log(`  Tamanho: ${(lastEOI + 2 - lastSOI)} bytes`);

const mainImage = bytes.slice(lastSOI, lastEOI + 2);
const outputPath = path.join(__dirname, 'main-image.jpg');
fs.writeFileSync(outputPath, Buffer.from(mainImage));

console.log(`\n✓ Imagem principal extraída: ${outputPath}`);

// Também vamos tentar pegar a imagem completa (todo o arquivo)
const fullPath = path.join(__dirname, 'full-file.jpg');
fs.writeFileSync(fullPath, buffer);
console.log(`✓ Arquivo completo salvo: ${fullPath}`);

console.log('\n' + '='.repeat(80));
