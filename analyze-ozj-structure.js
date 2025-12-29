const fs = require('fs');
const path = require('path');

const ozjPath = path.join(__dirname, 'arquivos para estudar o formato', 'lo_back_01.OZJ');
const buffer = fs.readFileSync(ozjPath);
const bytes = new Uint8Array(buffer);

console.log('='.repeat(80));
console.log('ANÁLISE DETALHADA DO OZJ');
console.log('='.repeat(80));
console.log(`Tamanho total: ${bytes.length} bytes\n`);

// Procura todos os marcadores JPEG importantes
const markers = [];

for (let i = 0; i < bytes.length - 1; i++) {
  if (bytes[i] === 0xFF) {
    const marker = bytes[i + 1];
    
    // Marcadores importantes
    const markerNames = {
      0xD8: 'SOI (Start Of Image)',
      0xD9: 'EOI (End Of Image)',
      0xE0: 'APP0 (JFIF)',
      0xE1: 'APP1 (EXIF)',
      0xDB: 'DQT (Define Quantization Table)',
      0xC0: 'SOF0 (Start Of Frame)',
      0xC4: 'DHT (Define Huffman Table)',
      0xDA: 'SOS (Start Of Scan)',
    };
    
    if (markerNames[marker]) {
      markers.push({
        offset: i,
        marker: marker,
        name: markerNames[marker]
      });
    }
  }
}

console.log('MARCADORES JPEG ENCONTRADOS:');
console.log('-'.repeat(80));
markers.forEach((m, idx) => {
  console.log(`${idx + 1}. Offset ${m.offset.toString().padStart(6)} (0x${m.offset.toString(16).padStart(6, '0')}): FF ${m.marker.toString(16).toUpperCase().padStart(2, '0')} - ${m.name}`);
});

// Verifica se há múltiplas imagens
const soiMarkers = markers.filter(m => m.marker === 0xD8);
const eoiMarkers = markers.filter(m => m.marker === 0xD9);

console.log('\n' + '='.repeat(80));
console.log(`Total de SOI (início de imagem): ${soiMarkers.length}`);
console.log(`Total de EOI (fim de imagem): ${eoiMarkers.length}`);

if (soiMarkers.length > 1) {
  console.log('\n⚠️  MÚLTIPLAS IMAGENS DETECTADAS!');
  console.log('Offsets dos inícios:');
  soiMarkers.forEach((m, idx) => {
    console.log(`  Imagem ${idx + 1}: offset ${m.offset}`);
  });
}

// Tenta extrair cada imagem
if (soiMarkers.length > 0 && eoiMarkers.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('TENTANDO EXTRAIR IMAGENS:');
  console.log('-'.repeat(80));
  
  for (let i = 0; i < soiMarkers.length; i++) {
    const startOffset = soiMarkers[i].offset;
    
    // Procura o próximo EOI após este SOI
    const endMarker = eoiMarkers.find(m => m.offset > startOffset);
    
    if (endMarker) {
      const endOffset = endMarker.offset + 2; // +2 para incluir FF D9
      const imageSize = endOffset - startOffset;
      
      console.log(`\nImagem ${i + 1}:`);
      console.log(`  Início: offset ${startOffset} (0x${startOffset.toString(16)})`);
      console.log(`  Fim: offset ${endOffset} (0x${endOffset.toString(16)})`);
      console.log(`  Tamanho: ${imageSize} bytes`);
      
      // Extrai a imagem
      const imageData = bytes.slice(startOffset, endOffset);
      const outputPath = path.join(__dirname, `test-image-${i + 1}.jpg`);
      fs.writeFileSync(outputPath, Buffer.from(imageData));
      
      console.log(`  ✓ Salva em: ${outputPath}`);
    }
  }
}

// Verifica o que vem depois do último EOI
if (eoiMarkers.length > 0) {
  const lastEOI = eoiMarkers[eoiMarkers.length - 1];
  const remainingBytes = bytes.length - (lastEOI.offset + 2);
  
  console.log('\n' + '='.repeat(80));
  console.log(`Bytes após o último EOI: ${remainingBytes}`);
  
  if (remainingBytes > 0) {
    console.log('Primeiros 32 bytes após EOI:');
    const afterEOI = bytes.slice(lastEOI.offset + 2, Math.min(lastEOI.offset + 34, bytes.length));
    const hex = Array.from(afterEOI).map(b => b.toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from(afterEOI).map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : '.').join('');
    console.log('Hex:', hex);
    console.log('ASCII:', ascii);
  }
}

console.log('\n' + '='.repeat(80));
console.log('ANÁLISE CONCLUÍDA');
console.log('='.repeat(80));
