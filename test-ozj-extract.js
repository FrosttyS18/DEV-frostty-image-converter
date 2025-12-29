const fs = require('fs');
const path = require('path');

const ozjPath = path.join(__dirname, 'arquivos para estudar o formato', 'lo_back_01.OZJ');
const outputPath = path.join(__dirname, 'test-extracted.jpg');

console.log('Lendo OZJ:', ozjPath);
const buffer = fs.readFileSync(ozjPath);

console.log('Tamanho:', buffer.length, 'bytes');
console.log('Primeiros 4 bytes:', buffer[0].toString(16), buffer[1].toString(16), buffer[2].toString(16), buffer[3].toString(16));

// Como é JPEG direto, só copia
fs.writeFileSync(outputPath, buffer);

console.log('✓ JPEG extraído:', outputPath);
console.log('Abra o arquivo para verificar se está correto!');
