const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('ANALISE DE STRINGS NA DLL (procurando pistas)');
console.log('='.repeat(80));

const dllPath = path.join(__dirname, 'arquivos para estudar o formato/arquivos enviado pelo nosso amigo/ozd.dll');
const buffer = fs.readFileSync(dllPath);

// Procura por strings ASCII na DLL
const strings = [];
let currentString = '';

for (let i = 0; i < buffer.length; i++) {
  const byte = buffer[i];
  
  // Caracteres ASCII imprimiveis
  if (byte >= 32 && byte <= 126) {
    currentString += String.fromCharCode(byte);
  } else {
    if (currentString.length >= 4) {
      strings.push(currentString);
    }
    currentString = '';
  }
}

// Filtra strings relevantes
const relevantStrings = strings.filter(s => 
  s.toLowerCase().includes('convert') ||
  s.toLowerCase().includes('decrypt') ||
  s.toLowerCase().includes('encrypt') ||
  s.toLowerCase().includes('dds') ||
  s.toLowerCase().includes('ozd') ||
  s.toLowerCase().includes('file') ||
  s.length > 20
);

console.log(`\nTotal de strings encontradas: ${strings.length}`);
console.log(`Strings relevantes: ${relevantStrings.length}\n`);

console.log('STRINGS ENCONTRADAS (primeiras 50):');
console.log('-'.repeat(80));
relevantStrings.slice(0, 50).forEach((str, idx) => {
  console.log(`${(idx + 1).toString().padStart(3)}. ${str}`);
});

console.log('\n' + '='.repeat(80));
console.log('STRINGS QUE MENCIONAM FUNCOES:');
console.log('-'.repeat(80));

const functionNames = strings.filter(s => 
  (s.includes('Convert') || s.includes('Decrypt') || s.includes('Encode')) &&
  s.length < 50
);

functionNames.forEach(name => {
  console.log(`  - ${name}`);
});

console.log('\n' + '='.repeat(80));
