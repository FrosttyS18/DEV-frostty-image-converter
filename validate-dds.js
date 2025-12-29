const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('VALIDACAO DO DDS DESENCRIPTADO');
console.log('='.repeat(80));

const ddsPath = path.join(__dirname, 'test-ozd-rotative.dds');

if (!fs.existsSync(ddsPath)) {
  console.log('ERRO: Arquivo DDS nao encontrado!');
  process.exit(1);
}

const buffer = fs.readFileSync(ddsPath);
const view = new DataView(buffer.buffer);

console.log(`\nTamanho do arquivo: ${buffer.length} bytes`);

// Le header DDS
console.log('\nHEADER DDS:');
const magic = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
console.log(`  Magic: "${magic}" (deve ser "DDS ")`);

if (magic !== 'DDS ') {
  console.log('  ERRO: Nao e um DDS valido!');
  process.exit(1);
}

const headerSize = view.getUint32(4, true);
const flags = view.getUint32(8, true);
const height = view.getUint32(12, true);
const width = view.getUint32(16, true);
const pitchOrLinearSize = view.getUint32(20, true);
const mipMapCount = view.getUint32(28, true);

console.log(`  Header size: ${headerSize}`);
console.log(`  Flags: 0x${flags.toString(16)}`);
console.log(`  Dimensoes: ${width} x ${height}`);
console.log(`  Pitch/Linear size: ${pitchOrLinearSize}`);
console.log(`  MipMap count: ${mipMapCount}`);

// Pixel format (offset 76)
console.log('\nPIXEL FORMAT:');
const pfSize = view.getUint32(76, true);
const pfFlags = view.getUint32(80, true);
const pfFourCC = String.fromCharCode(
  buffer[84], buffer[85], buffer[86], buffer[87]
);
const pfRGBBitCount = view.getUint32(88, true);

console.log(`  Size: ${pfSize}`);
console.log(`  Flags: 0x${pfFlags.toString(16)}`);
console.log(`  FourCC: "${pfFourCC}"`);
console.log(`  RGB Bit Count: ${pfRGBBitCount}`);

console.log('\n' + '='.repeat(80));
console.log('DDS VALIDO!');
console.log(`Formato: ${pfFourCC || (pfRGBBitCount + 'bit RGB')}`);
console.log(`Dimensoes: ${width} x ${height}`);
console.log('='.repeat(80));

console.log('\nProximos passos:');
console.log('  1. Implementar desencriptacao OZD no app');
console.log('  2. Converter DDS para formato visualizavel (PNG/TGA)');
console.log('  3. Testar com todos os arquivos OZD');
