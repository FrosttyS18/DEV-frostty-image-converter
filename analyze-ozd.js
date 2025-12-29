const fs = require('fs');
const path = require('path');
const pako = require('pako');

console.log('='.repeat(80));
console.log('ANALISE DE ARQUIVOS OZD');
console.log('='.repeat(80));

const ozdDir = path.join(__dirname, 'arquivos para estudar o formato');
const files = fs.readdirSync(ozdDir).filter(f => f.toLowerCase().endsWith('.ozd'));

console.log(`\nArquivos OZD encontrados: ${files.length}\n`);

for (const filename of files.slice(0, 3)) { // Analisa os 3 primeiros
  const filepath = path.join(ozdDir, filename);
  const buffer = fs.readFileSync(filepath);
  const data = new Uint8Array(buffer);
  const stats = fs.statSync(filepath);
  
  console.log('='.repeat(80));
  console.log(`ARQUIVO: ${filename}`);
  console.log('='.repeat(80));
  console.log(`Tamanho: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
  
  // Primeiros 64 bytes
  console.log('\nPRIMEIROS 64 BYTES (HEX + ASCII):');
  for (let i = 0; i < Math.min(64, data.length); i += 16) {
    const hexPart = [];
    const asciiPart = [];
    
    for (let j = 0; j < 16 && i + j < data.length; j++) {
      const byte = data[i + j];
      hexPart.push(byte.toString(16).padStart(2, '0'));
      asciiPart.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.');
    }
    
    console.log(`${i.toString(16).padStart(4, '0')}  ${hexPart.join(' ')}  |${asciiPart.join('')}|`);
  }
  
  // Deteccao de formatos conhecidos
  console.log('\nDETECCAO DE FORMATO:');
  
  // DDS magic: "DDS " (0x44 0x44 0x53 0x20)
  const isDDS = data[0] === 0x44 && data[1] === 0x44 && data[2] === 0x53 && data[3] === 0x20;
  console.log(`  DDS direto (44 44 53 20): ${isDDS ? 'SIM' : 'NAO'}`);
  
  // Zlib comprimido
  const isZlib = data[0] === 0x78 && 
                 (data[1] === 0x9C || data[1] === 0x01 || data[1] === 0xDA || data[1] === 0x5E);
  console.log(`  Zlib comprimido (78 XX): ${isZlib ? 'SIM' : 'NAO'}`);
  
  // TGA
  const mightBeTGA = data[2] === 0x02 || data[2] === 0x0A;
  console.log(`  Pode ser TGA (byte[2] = 02/0A): ${mightBeTGA ? 'SIM' : 'NAO'}`);
  
  // Tenta offsets comuns
  console.log('\nTENTANDO OFFSETS COMUNS:');
  const offsets = [0, 4, 8, 12, 16, 20, 24, 32, 64];
  
  for (const offset of offsets) {
    if (offset >= data.length) continue;
    
    const b0 = data[offset];
    const b1 = data[offset + 1];
    const b2 = data[offset + 2];
    const b3 = data[offset + 3];
    
    // DDS?
    if (b0 === 0x44 && b1 === 0x44 && b2 === 0x53 && b3 === 0x20) {
      console.log(`  Offset ${offset}: DDS encontrado!`);
    }
    
    // Zlib?
    if (b0 === 0x78 && (b1 === 0x9C || b1 === 0x01 || b1 === 0xDA || b1 === 0x5E)) {
      console.log(`  Offset ${offset}: Zlib encontrado! (78 ${b1.toString(16)})`);
      
      // Tenta descomprimir
      try {
        const sliced = data.slice(offset);
        const decompressed = pako.inflate(sliced);
        console.log(`    -> Descomprimido: ${decompressed.length} bytes`);
        console.log(`    -> Primeiros 16 bytes: ${Array.from(decompressed.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
        
        // Verifica se e DDS
        if (decompressed[0] === 0x44 && decompressed[1] === 0x44 && 
            decompressed[2] === 0x53 && decompressed[3] === 0x20) {
          console.log(`    -> CONTEUDO E DDS!`);
          
          // Salva para analise
          const outputPath = path.join(__dirname, `test-${filename.replace('.ozd', '')}-decompressed.dds`);
          fs.writeFileSync(outputPath, Buffer.from(decompressed));
          console.log(`    -> Salvo em: ${outputPath}`);
        }
      } catch (err) {
        console.log(`    -> Falhou: ${err.message}`);
      }
    }
  }
  
  console.log('');
}

console.log('='.repeat(80));
console.log('ANALISE CONCLUIDA');
console.log('='.repeat(80));
