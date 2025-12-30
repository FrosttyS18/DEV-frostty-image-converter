# Arquitetura Tecnica - DEV Frostty Image Converter

Documentacao tecnica completa para desenvolvedores e IAs.

## Visao Geral

Aplicacao Electron + React + TypeScript para conversao de formatos de imagem proprietarios do jogo Mu Online.

## Stack Tecnologica

```
Frontend:  React 18 + TypeScript + Tailwind CSS + Vite
Backend:   Electron (Node.js)
Build:     Vite + Electron Builder
```

## Arquitetura de Componentes

### Componentes Principais

#### 1. App.tsx (Raiz)
```typescript
Responsabilidades:
- Gerenciamento de estado global
- Orquestracao de conversoes
- Controle de toasts
- Integracao FileList + Canvas
```

#### 2. FileList.tsx (Lista Integrada)
```typescript
Props:
- files: FileInfo[]          # Lista de arquivos carregados
- selectedFile: FileInfo     # Arquivo selecionado
- onSelectFile: (file) => void
- onConvert: (file, type) => void
- onSelectFolder: () => void
- isConverting: boolean

Funcionalidades:
- Lista com scroll
- Lazy loading de thumbnails (Intersection Observer)
- Menu contextual (botao direito)
- Validacao de conversoes
- Visual feedback de selecao
```

#### 3. Canvas.tsx (Visualizador)
```typescript
Props:
- currentPreview: string | null  # Path do arquivo

Funcionalidades:
- Preview em tempo real
- Auto-fit de imagem
- Exibicao de dimensoes
- Suporte a todos os formatos
```

#### 4. Toast.tsx (Notificacoes)
```typescript
Props:
- message: string
- type: 'success' | 'error' | 'info'
- duration: number
- onClose: () => void

Features:
- Animacao slide-in
- Barra de progresso
- Auto-close
- Glass morphism
```

## Hooks Customizados

### useFileSelection
```typescript
// Gerencia selecao de arquivos via dialog
const { selectedFiles, isLoading, error, selectFolder } = useFileSelection();

Retorna:
- selectedFiles: FileInfo[]
- isLoading: boolean
- error: string | null
- selectFolder: () => Promise<void>
```

### useConversion
```typescript
// Gerencia processo de conversao
const { isConverting, error, successMessage, convert } = useConversion();

Funcao principal:
convert(type: ConversionType, files: FileInfo[], outputFolder?: string)
```

### useImagePreview
```typescript
// Carrega preview com lazy loading
const { previewUrl, imageInfo, isLoading, error } = useImagePreview(filePath);

Features:
- Lazy loading (null = nao carrega)
- Cleanup automatico de blob URLs
- Cache interno
- Suporte PNG, TGA, OZT, OZJ
```

## Servicos

### electronService.ts
```typescript
// Bridge para APIs do Electron via IPC

Metodos:
- selectFolder(): Promise<{ canceled, filePath }>
- selectOutputFolder(): Promise<string>
- readFile(path): Promise<Uint8Array>
- writeFile(path, data): Promise<void>
- readDirectory(path): Promise<string[]>
- getFileStats(path): Promise<{ size, ... }>
- getExtension(path): Promise<string>
- getBasename(path): Promise<string>
- joinPath(...paths): Promise<string>
```

## Utilitarios de Conversao

### converter.ts
Orquestrador principal de conversoes.

```typescript
Funcao principal:
convertFiles(options: ConversionOptions): Promise<void>

Funcoes internas:
- pngToTga(path, outputFolder)
- tgaToPng(path, outputFolder)
- pngToOzt(path, outputFolder)
- oztToTga(path, outputFolder)
- ozjToJpg(path, outputFolder)

Validacoes:
- Extensao de arquivo
- Magic numbers
- Dimensoes validas
- Tamanho de arquivo
```

### tga.ts
```typescript
Funcoes:
- decodeTGA(buffer: ArrayBuffer): ImageData
- encodeTGA(imageData: ImageData): ArrayBuffer

Suporte:
- TGA 24-bit (BGR)
- TGA 32-bit (BGRA)
- Origem top/bottom
- Calculo de dimensoes automatico (se header invalido)
```

### ozt.ts
```typescript
Funcoes:
- decodeOZT(buffer: ArrayBuffer): ImageData
- encodeOZT(imageData: ImageData): ArrayBuffer

Deteccao automatica:
- Zlib comprimido (magic: 0x78 0x9C)
- TGA direto com offset (4 bytes)
- Multiplos offsets tentados (0, 2, 4, 8, 16, 32)
```

### ozj.ts
```typescript
Funcoes:
- decodeOZJ(buffer: ArrayBuffer): ArrayBuffer

Deteccao automatica:
- JPEG direto (FF D8)
- JPEG com XOR 0xFC
- JPEG com offset 24
- Multiplos offsets tentados
```

### conversionValidator.ts
```typescript
Funcoes:
- getValidConversions(extension): ConversionOption[]
- isValidConversion(extension, type): boolean

Logica:
- Mapeia extensao para conversoes validas
- Retorna opcoes com flag enabled/disabled
- Usado pelo menu contextual
```

## Fluxo de Dados

### Selecao de Pasta
```
Usuario clica "Selecionar Pasta"
   ↓
electronService.selectFolder() (IPC)
   ↓
Dialog nativo do SO
   ↓
Retorna folderPath
   ↓
electronService.readDirectory(folderPath)
   ↓
Filtra por extensoes suportadas
   ↓
Mapeia para FileInfo[]
   ↓
Atualiza estado selectedFiles
   ↓
FileList renderiza lista
   ↓
Lazy loading de thumbnails inicia
```

### Conversao de Arquivo
```
Usuario clica direito em arquivo
   ↓
Menu contextual abre
   ↓
getValidConversions(file.extension)
   ↓
Renderiza opcoes (validas/invalidas)
   ↓
Usuario clica em conversao valida
   ↓
Dialog de pasta de destino
   ↓
convert(type, [file], outputFolder)
   ↓
convertFile() executa conversao especifica
   ↓
Valida extensao
   ↓
Decodifica formato origem
   ↓
Codifica formato destino
   ↓
Salva arquivo
   ↓
Toast de sucesso
```

## Seguranca e Performance

### Gerenciamento de Memoria

#### Blob URLs
```typescript
// Criacao
const url = URL.createObjectURL(blob);

// Uso
img.src = url;

// Cleanup OBRIGATORIO
URL.revokeObjectURL(url);  // No finally, onload, onerror
```

#### Intersection Observers
```typescript
// Criacao
const observer = new IntersectionObserver(callback, options);
observer.observe(element);

// Cleanup OBRIGATORIO
useEffect(() => {
  return () => {
    observer.disconnect();  // Ao desmontar
  };
}, []);
```

#### Event Listeners
```typescript
// Adicao
element.addEventListener('click', handler);

// Remocao OBRIGATORIA
useEffect(() => {
  return () => {
    element.removeEventListener('click', handler);
  };
}, []);
```

### Protecoes Implementadas

#### Limite de Tamanho
```typescript
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB

if (fileSize > MAX_THUMBNAIL_SIZE) {
  return placeholderIcon; // Nao carrega thumb
}
```

#### Lazy Loading
```typescript
// So carrega quando visivel
const observer = new IntersectionObserver(..., {
  rootMargin: '50px',  // Pre-carrega 50px antes
  threshold: 0.01,
});
```

#### Validacao de Formatos
```typescript
// Valida magic numbers
PNG:  0x89 0x50 0x4E 0x47
JPEG: 0xFF 0xD8
TGA:  Header 18 bytes
```

## IPC (Inter-Process Communication)

### Handlers no main.js
```javascript
// File operations
ipcMain.handle('read-file', async (_, path) => {...})
ipcMain.handle('write-file', async (_, {path, data}) => {...})
ipcMain.handle('read-directory', async (_, path) => {...})
ipcMain.handle('get-file-stats', async (_, path) => {...})

// Dialogs
ipcMain.handle('select-folder', async () => {...})
ipcMain.handle('select-output-folder', async () => {...})

// Window controls
ipcMain.on('window-minimize', () => {...})
ipcMain.on('window-maximize', () => {...})
ipcMain.on('window-close', () => {...})

// Path utilities
ipcMain.handle('path-join', async (_, paths) => {...})
ipcMain.handle('path-extname', async (_, path) => {...})
ipcMain.handle('path-basename', async (_, path) => {...})
```

### API Exposta (preload.cjs)
```javascript
window.electronAPI = {
  // File operations
  readFile(path),
  writeFile(path, data),
  readDirectory(path),
  getFileStats(path),
  
  // Dialogs
  selectFolder(),
  selectOutputFolder(),
  
  // Path utilities
  pathJoin(...paths),
  pathExtname(path),
  pathBasename(path),
  
  // Window controls
  minimizeWindow(),
  maximizeWindow(),
  closeWindow(),
}
```

## Lifecycle e Cleanup

### Aplicacao
```javascript
// Inicializacao
app.whenReady()
  ↓
createWindow()
  ↓
Carrega React app

// Encerramento
app.on('before-quit')
  ↓
Fecha todas as janelas
  ↓
Remove IPC listeners
  ↓
Limpa atalhos globais
  ↓
app.quit()
```

### Componentes React
```typescript
useEffect(() => {
  // Setup
  const resource = create();
  
  // Cleanup
  return () => {
    resource.cleanup();
  };
}, [dependencies]);
```

## Convencoes de Codigo

### Nomenclatura
```typescript
// Componentes: PascalCase
FileList.tsx
Canvas.tsx

// Hooks: camelCase com "use" prefix
useConversion.ts
useImagePreview.ts

// Utils: camelCase
converter.ts
imageLoader.ts

// Constants: UPPER_SNAKE_CASE
SUPPORTED_EXTENSIONS
CONVERSION_TYPES
```

### Estrutura de Arquivos
```typescript
// Um export default por arquivo de componente
export default FileList;

// Multiplos exports em utils
export { decodeTGA, encodeTGA };
```

### Logs
```typescript
// Prefixo com nome do modulo
console.log('[FileList] Arquivo selecionado');
console.error('[Converter] Erro ao converter');
console.warn('[Performance] Arquivo muito grande');
```

## Troubleshooting para Devs

### Build falha
```bash
# Limpa cache
rm -rf node_modules dist
npm install
npm run build
```

### Electron nao inicia
```bash
# Verifica processos
taskkill /F /IM electron.exe

# Reinicia dev
npm run dev
```

### TypeScript errors
```bash
# Verifica tipos
npx tsc --noEmit

# Atualiza dependencias
npm update
```

## Proximas Features (Roadmap)

1. Conversao em lote (multiplos arquivos)
2. Drag & drop de arquivos
3. Historico de conversoes
4. Presets de conversao
5. Compressao customizada OZT

## Notas para IAs

### Este projeto:
- E um conversor de formatos proprietarios do Mu Online
- Foca em preservacao de canal alpha
- Prioriza UX simples e intuitiva
- Performance otimizada para muitos arquivos
- Codigo limpo e bem documentado

### Formatos suportados:
- PNG, TGA (padroes)
- OZT (TGA + Zlib)
- OZJ (JPEG + XOR opcional)

### Formatos NAO suportados:
- OZB (muito encriptado, causa travamento)
- OZD (criptografia proprietaria nao descoberta)

### Quando modificar:
- Sempre preserve canal alpha
- Valide magic numbers
- Faca cleanup de recursos
- Adicione logs para debug
- Teste com arquivos reais do MU

---

Versao: 2.0.0  
Ultima atualizacao: 2025-12-29
