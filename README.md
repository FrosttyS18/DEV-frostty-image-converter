# DEV Frostty - Image Converter

Conversor de imagens profissional para Mu Online Season 18 com interface glassmorphism moderna.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-191970?logo=Electron&logoColor=white)

## Recursos

- Interface Glassmorphism moderna e minimalista
- Lista integrada de arquivos com lazy loading otimizado
- Menu contextual inteligente (botao direito)
- Conversoes validadas automaticamente
- Visualizacao em tempo real com controles de zoom e pan
- **Sistema de inércia (Kinetic Scrolling)** tipo Photoshop
- **Multi-seleção e conversão em lote** de arquivos
- Cache LRU para performance maxima (com invalidação automática)
- Otimizacao para arquivos ate 20MB
- Preservacao total do canal Alpha
- Sistema de fila com prioridades
- Splash screen profissional
- **Compatibilidade total com Pentium Tools**
- **Suporte a TGA RLE** (Run-Length Encoded)

## Conversoes Suportadas

### Fluxo Recomendado (Editar Textura)

```
OZT -> PNG (1 conversao)
Edita no Photoshop
PNG -> OZT (1 conversao)

Total: 2 passos
```

### Conversoes Disponiveis

| Origem | Destino | Uso |
|--------|---------|-----|
| PNG | TGA | Preparar textura intermediaria |
| TGA | PNG | Converter para edicao |
| PNG | OZT | Criar textura para o jogo |
| OZT | PNG | Extrair textura do jogo (DIRETO) |
| OZT | TGA | Extrair textura (formato intermediario) |
| OZJ | JPG | Extrair imagens JPEG |
| JPG | OZJ | Criar imagens JPEG para o jogo (compatível Pentium Tools) |

## Formatos do Mu Online

| Formato | Tipo | Descricao | Tamanho Tipico |
|---------|------|-----------|----------------|
| OZT | TGA + Zlib | Texturas comprimidas | 50KB - 5MB |
| OZJ | JPEG + XOR/Zlib | Imagens JPEG | 10KB - 20MB |
| TGA | Targa (RLE suportado) | Formato intermediario | 100KB - 15MB |
| PNG | PNG | Formato de edicao | 50KB - 10MB |
| JPG/JPEG | JPEG | Formato de edicao | 10KB - 20MB |

### Compatibilidade
- **Pentium Tools**: Arquivos gerados são 100% compatíveis
- **TGA RLE**: Suporte completo para compressão Run-Length Encoded (tipo 10)
- **Headers customizados**: Detecta e trata headers de 24 bytes (OZJ) e 4 bytes (OZT)

## Instalacao

### Requisitos
- Node.js 18+
- npm

### Passos

```bash
npm install
npm run dev
```

## Como Usar

### Fluxo Simplificado

```
1. Selecionar Pasta
   - Clique em "Selecionar Pasta"
   - Lista carrega automaticamente

2. Buscar/Filtrar (opcional)
   - Campo de busca por nome
   - Dropdown para filtrar por tipo

3. Selecionar Arquivo
   - Clique no arquivo
   - Preview aparece no canvas

4. Converter
   - Clique DIREITO no arquivo
   - Menu mostra apenas conversoes validas
   - Selecione a conversao
   - Escolha pasta de destino
```

## Performance

### Sistema de Cache LRU
- Mantem 50 previews em cache
- Revisitas sao instantaneas
- Remove automaticamente os mais antigos
- Memoria controlada (max 200MB)

### Fila com Prioridades
```
Prioridade ALTA (< 1MB):
- 10 simultaneous
- Carrega primeiro

Prioridade MEDIA (1-5MB):
- 5 simultaneous
- Carrega depois

Prioridade BAIXA (> 5MB):
- 2 simultaneous
- Ultimo a carregar
```

### Otimizacao de Arquivos Grandes
```
Thumbnails: Downsampling para 256x256
Preview: Downsampling para 2048x2048
Arquivos ate 20MB: Suportados
```

## Controles do Canvas

### Toolbar
```
[Zoom-] [Zoom+] [Auto] [Pan] | Zoom: 100%
```

### Atalhos
- **Alt + Scroll**: Zoom in/out
- **Espaço**: Ativar pan temporário (arrastar enquanto segura)
- **Ctrl + 0**: Auto-fit (resetar zoom)
- **Clique e arraste**: Mover imagem (quando pan ativo ou zoom > 100%)
- **Botão Pan**: Ativar/desativar pan permanente

### Sistema de Inércia (Kinetic Scrolling)
- **Arraste rápido**: Ao soltar, imagem continua movimento com decaimento suave
- **Atrito**: 0.925 (sensação "pesada" tipo Photoshop)
- **Hard stop**: Para instantaneamente ao bater nas bordas
- **Mesa livre**: Imagens pequenas podem ser arrastadas livremente pela tela

### Multi-seleção e Conversão em Lote
- **Filtro ativo**: Checkboxes aparecem para selecionar múltiplos arquivos
- **Botão "Converter X"**: Aparece quando arquivos estão selecionados
- **Menu dropdown**: Mostra apenas conversões válidas para o tipo selecionado
- **Uma pasta de destino**: Pergunta pasta apenas uma vez para todos os arquivos

## Tecnologias

- Electron - Framework desktop
- React 18 - Interface moderna
- TypeScript - Tipagem estatica
- Vite - Build rapido
- Tailwind CSS - Estilizacao
- Pako - Compressao Zlib

## Preservacao do Canal Alpha

IMPORTANTE: Todas as conversoes preservam 100% do canal alpha (transparencia).

O canal alpha e essencial para:
- Texturas de interface
- Items com transparencia
- Efeitos visuais
- Elementos HUD

## Scripts Auxiliares

### convert-ozj-batch.js
Converte multiplos OZJ para JPG em lote.

```bash
node convert-ozj-batch.js "C:\MU\Data\Interface" "output" "padrao"
```

### merge-loading-screen.js
Junta pecas de loading screen em imagem unica.

### split-loading-screen.js
Divide imagem editada de volta em pecas OZJ.

Veja LOADING-SCREEN-TOOLS.md para detalhes.

## Seguranca e Cleanup

- Cleanup automatico de recursos ao fechar
- Revogacao de blob URLs
- Desconexao de Intersection Observers
- Remocao de event listeners
- Zero memory leaks

## Solucao de Problemas

### Preview nao carrega
- Arquivo muito grande (aplicando downsampling automatico)
- Arquivo corrompido
- Formato nao suportado

### App lento com muitos arquivos
- Cache LRU ativo (maximo 50 previews)
- Fila com prioridades ativa
- Lazy loading otimizado

### Conversao falha
- Extensao incorreta (menu contextual so mostra validas)
- Arquivo corrompido
- Falta de permissoes

## Licenca

MIT License

## Autor

DEV Frostty - Season 18 Tools
Desenvolvido para a comunidade Mu Online
