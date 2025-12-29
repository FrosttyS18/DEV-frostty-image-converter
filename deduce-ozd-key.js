const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('DEDUZINDO CHAVE DE ENCRIPTACAO OZD');
console.log('='.repeat(80));

const filepath = path.join(__dirname, 'arquivos para estudar o formato/bg_3_1.ozd');
const buffer = fs.readFileSync(filepath);
const data = new Uint8Array(buffer);

console.log(`\nArquivo: bg_3_1.ozd`);
console.log(`Primeiros 16 bytes OZD: ${Array.from(data.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

// Header DDS esperado (padrao)
// "DDS " + tamanho header (124) + flags
const DDS_EXPECTED = [
  0x44, 0x44, 0x53, 0x20,  // "DDS "
  0x7C, 0x00, 0x00, 0x00,  // Header size (124)
];

console.log(`\nHeader DDS esperado: ${DDS_EXPECTED.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

// Deduz chave XOR comparando
console.log('\nDEDUZINDO CHAVE XOR:');

// Testa se é XOR com chave fixa (todos os bytes usam mesma chave)
const possibleKeys = [];
for (let i = 0; i < 4; i++) {
  const key = data[i] ^ DDS_EXPECTED[i];
  possibleKeys.push(key);
  console.log(`  Byte ${i}: 0x${data[i].toString(16).padStart(2, '0')} XOR 0x${DDS_EXPECTED[i].toString(16).padStart(2, '0')} = Chave 0x${key.toString(16).padStart(2, '0')}`);
}

// Verifica se todas as chaves sao iguais (XOR simples)
const allSame = possibleKeys.every(k => k === possibleKeys[0]);
console.log(`\nTodas as chaves iguais? ${allSame ? 'SIM' : 'NAO'}`);

if (allSame) {
  console.log(`  CHAVE XOR FIXA: 0x${possibleKeys[0].toString(16).padStart(2, '0')}`);
  
  // Desencripta todo o arquivo
  const decrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    decrypted[i] = data[i] ^ possibleKeys[0];
  }
  
  console.log(`\nPrimeiros 16 bytes desencriptados: ${Array.from(decrypted.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
  
  // Verifica se e DDS valido
  if (decrypted[0] === 0x44 && decrypted[1] === 0x44 && 
      decrypted[2] === 0x53 && decrypted[3] === 0x20) {
    console.log(`\nSUCESSO! Arquivo desencriptado e DDS valido!`);
    
    const outputPath = path.join(__dirname, 'test-ozd-DECRYPTED.dds');
    fs.writeFileSync(outputPath, Buffer.from(decrypted));
    console.log(`Salvo em: ${outputPath}`);
    
    // Tenta ler header DDS
    const view = new DataView(decrypted.buffer);
    const headerSize = view.getUint32(4, true);
    const height = view.getUint32(12, true);
    const width = view.getUint32(16, true);
    
    console.log(`\nINFORMACOES DDS:`);
    console.log(`  Header size: ${headerSize}`);
    console.log(`  Dimensoes: ${width} x ${height}`);
  }
} else {
  console.log(`\nChaves diferentes - XOR com array ou algoritmo mais complexo:`);
  console.log(`  [${possibleKeys.map(k => '0x' + k.toString(16)).join(', ')}]`);
  
  // Testa com essa sequencia
  const decrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const key = possibleKeys[i % possibleKeys.length];
    decrypted[i] = data[i] ^ key;
  }
  
  console.log(`\nPrimeiros 16 bytes com chave rotativa: ${Array.from(decrypted.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
  
  if (decrypted[0] === 0x44 && decrypted[1] === 0x44) {
    console.log(`  PARECE DDS!`);
    const outputPath = path.join(__dirname, 'test-ozd-rotative.dds');
    fs.writeFileSync(outputPath, Buffer.from(decrypted));
    console.log(`  Salvo em: ${outputPath}`);
  }
}

console.log('\n' + '='.repeat(80));
