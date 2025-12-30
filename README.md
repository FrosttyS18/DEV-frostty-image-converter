# DEV Frostty - Image Converter

Conversor de imagens profissional para Mu Online Season 18 com interface glassmorphism moderna.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-191970?logo=Electron&logoColor=white)

## Recursos

- Interface Glassmorphism moderna e minimalista
- Visualizacao em tempo real com preview de imagens
- Lista integrada de arquivos com lazy loading de thumbnails
- Menu contextual inteligente (botao direito)
- Conversoes validadas automaticamente
- Preservacao total do canal Alpha
- Performance otimizada para milhares de arquivos

## Conversoes Suportadas

| Origem | Destino | Uso |
|--------|---------|-----|
| PNG | TGA | Preparar textura para edicao |
| TGA | PNG | Converter para edicao |
| PNG | OZT | Criar textura para o jogo |
| OZT | TGA | Extrair textura do jogo |
| OZJ | JPG | Extrair imagens JPEG |

## Formatos do Mu Online

| Formato | Tipo | Descricao |
|---------|------|-----------|
| **OZT** | TGA + Zlib | Texturas comprimidas (Interface, Items, etc) |
| **OZJ** | JPEG + XOR | Imagens JPEG (Loading screens, backgrounds) |
| **TGA** | Targa | Formato intermediario |
| **PNG** | PNG | Formato de edicao |

## Instalacao

### Requisitos
- Node.js 18+
- npm ou yarn

### Passos

```bash
# 1. Instalar dependencias
npm install

# 2. Executar em modo desenvolvimento
npm run dev

# 3. Compilar aplicacao
npm run build
npm run electron:build
```

## Como Usar

### Fluxo de Trabalho

1. **Selecionar Pasta**
   - Clique em "Selecionar Pasta"
   - Escolha a pasta do MU Online (ex: Data/Interface)

2. **Selecionar Arquivo**
   - Clique no arquivo na lista
   - Preview aparece automaticamente ao lado

3. **Converter**
   - Clique com botao DIREITO no arquivo
   - Menu contextual mostra conversoes validas
   - Escolha a conversao desejada
   - Selecione pasta de destino

### Exemplos Praticos

#### Editar textura do jogo

```
1. OZT → TGA - Extrair do formato do jogo
2. TGA → PNG - Converter para edicao
3. Editar no Photoshop/GIMP
4. PNG → TGA - Preparar para converter
5. (Opcional) TGA → OZT - Converter de volta
```

#### Criar nova textura

```
1. Criar imagem em PNG (1024x1024 recomendado)
2. Garantir transparencia (canal alpha) se necessario
3. PNG → OZT - Converter para o jogo
4. Colocar na pasta Data/Interface do MU
```

## Tecnologias

- **Electron** - Framework desktop multiplataforma
- **React 18** - Interface de usuario moderna
- **TypeScript** - Tipagem estatica e seguranca
- **Vite** - Build tool rapido
- **Tailwind CSS** - Estilizacao utilitaria
- **Pako** - Compressao/Descompressao Zlib

## Arquitetura

```
src/
├── components/
│   ├── FileList.tsx        # Lista integrada com menu contextual
│   ├── Canvas.tsx          # Visualizador de preview
│   ├── CustomTitlebar.tsx  # Barra de titulo customizada
│   ├── Toast.tsx           # Notificacoes
│   └── ...
├── hooks/
│   ├── useConversion.ts    # Gerenciamento de conversoes
│   ├── useFileSelection.ts # Selecao de arquivos
│   └── useImagePreview.ts  # Preview com lazy loading
├── utils/
│   ├── tga.ts              # Encoder/Decoder TGA
│   ├── ozt.ts              # Encoder/Decoder OZT (TGA+Zlib)
│   ├── ozj.ts              # Decoder OZJ (JPEG+XOR)
│   ├── converter.ts        # Orquestrador de conversoes
│   └── conversionValidator.ts # Validador de conversoes
├── types/
│   └── index.ts            # Definicoes TypeScript
└── App.tsx                 # Componente raiz

electron/
├── main.js                 # Processo principal Electron
├── preload.cjs             # Bridge segura IPC
└── fileListWindow.html     # Janela de lista (legado)
```

## Performance e Seguranca

### Lazy Loading de Thumbnails
- Carrega apenas thumbnails visiveis (viewport + 50px)
- Intersection Observer para deteccao
- Cleanup automatico de recursos
- Limite de 5MB por thumbnail

### Gerenciamento de Memoria
- Revogacao automatica de Blob URLs
- Cleanup de Intersection Observers
- Remocao de event listeners ao desmontar
- Limpeza completa ao fechar aplicacao

### Validacao de Conversoes
- Menu contextual mostra apenas opcoes validas
- Validacao por extensao de arquivo
- Prevencao de erros de usuario
- Feedback claro via toasts

## Preservacao do Canal Alpha

IMPORTANTE: Este conversor foi desenvolvido com foco especial na preservacao do canal alpha (transparencia).

Todas as conversoes mantem 100% do canal alpha original, essencial para:
- Texturas de interface (UI)
- Items com transparencia
- Efeitos visuais
- Elementos HUD

## Scripts Auxiliares

### convert-ozj-batch.js
Converte multiplos OZJ para JPG em lote.

```bash
node convert-ozj-batch.js "C:\MU\Data\Interface" "output-jpg" "lo_back_s5_im"
```

### merge-loading-screen.js
Junta pecas de loading screen em imagem completa.

```bash
node merge-loading-screen.js "C:\MU\Data\Interface" "lo_back_s5_im"
```

### split-loading-screen.js
Divide imagem editada de volta em pecas OZJ.

```bash
node split-loading-screen.js imagem_COMPLETO.png layout.json output
```

Veja `LOADING-SCREEN-TOOLS.md` para detalhes.

## Solucao de Problemas

### Preview nao carrega
- Arquivo muito grande (> 5MB) - thumbnails desabilitados
- Arquivo corrompido - verifique console
- Formato nao suportado

### Conversao falha
- Extensao de arquivo incorreta
- Arquivo corrompido
- Falta de permissoes na pasta de destino
- Espaco em disco insuficiente

### App trava ao carregar pasta
- Muitos arquivos grandes (> 5MB cada)
- Protecao implementada: thumbnails pulados automaticamente

## Formato OZT Explicado

O formato OZT do Mu Online:
1. Arquivo TGA normal (32-bit BGRA ou 24-bit BGR)
2. Comprimido com Zlib (algoritmo Deflate)
3. Mantem todas as propriedades do TGA original
4. Pode ter offset de 4 bytes (formato Mu Online customizado)

## Formato OZJ Explicado

O formato OZJ do Mu Online:
1. Arquivo JPEG padrao
2. Pode ter XOR simples (chave 0xFC) - arquivos pequenos
3. Pode ser JPEG direto - arquivos grandes (loading screens)
4. Pode ter offset de 24 bytes em alguns casos

## Licenca

MIT License - Uso livre para projetos pessoais e educacionais.

## Autor

**DEV Frostty** - Season 18 Tools

Desenvolvido para a comunidade Mu Online Brasil.
