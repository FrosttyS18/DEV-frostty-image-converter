const ffi = require('ffi-napi');
const ref = require('ref-napi');
const path = require('path');
const fs = require('fs');

console.log('='.repeat(80));
console.log('TESTE: USANDO DLL OZD');
console.log('='.repeat(80));

// Tenta carregar a DLL
const dllPath = path.join(__dirname, 'arquivos para estudar o formato/arquivos enviado pelo nosso amigo/ozd.dll');

console.log(`\nDLL Path: ${dllPath}`);
console.log(`DLL existe? ${fs.existsSync(dllPath)}`);

try {
  // Tenta carregar a DLL
  const ozdLib = ffi.Library(dllPath, {
    // Funcoes comuns em DLLs de conversao
    'Convert': ['int', ['string', 'string']],
    'Decrypt': ['int', ['pointer', 'int', 'pointer']],
    'DecryptFile': ['int', ['string', 'string']],
  });
  
  console.log('\nDLL carregada com sucesso!');
  console.log('Funcoes disponiveis:', Object.keys(ozdLib));
  
} catch (err) {
  console.log('\nErro ao carregar DLL (normal se nao tiver ffi-napi):');
  console.log(err.message);
  console.log('\nPara usar DLLs, precisaria instalar: npm install ffi-napi ref-napi');
  console.log('Ou usar abordagem alternativa (executavel wrapper)');
}

console.log('\n' + '='.repeat(80));
