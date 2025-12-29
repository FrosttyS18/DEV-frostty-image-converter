# 🎮 DEU Frostty - Image Converter

Conversor de imagens profissional para Mu Online Season 18 com interface glassmorphism moderna.

![DEU Frostty](https://img.shields.io/badge/Season-18-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-191970?logo=Electron&logoColor=white)

## ✨ Recursos

- 🎨 **Interface Glassmorphism** moderna e elegante
- 🖼️ **Visualização em tempo real** de todos os formatos
- 🔄 **Conversões suportadas**:
  - PNG ↔ TGA
  - PNG → OZT (formato comprimido do Mu)
  - OZT/OZB/OZD → TGA
  - OZJ → JPG
- 🎯 **Preservação total do canal Alpha** (crítico para o jogo!)
- 📦 **Conversão em lote** de múltiplos arquivos
- 🔍 **Preview integrado** com informações de dimensões

## 🚀 Instalação

### Requisitos
- Node.js 18+ 
- npm ou yarn

### Passo a passo

1. **Instalar dependências**
```bash
npm install
```

2. **Executar em modo desenvolvimento**
```bash
npm run dev
```

3. **Compilar aplicação**
```bash
npm run build
npm run electron:build
```

## 📖 Como Usar

### Workflow Básico

1. **Selecionar Pasta** 
   - Clique em "Selecionar Pasta" e escolha a pasta com os arquivos do Mu

2. **Visualizar**
   - Clique em qualquer arquivo da lista para ver o preview no canvas

3. **Converter**
   - Escolha o tipo de conversão desejada
   - Os arquivos serão convertidos automaticamente

### Exemplos de Uso

#### Editar textura do jogo

```
1. OZT → TGA (ou PNG)  - Extrair do formato do jogo
2. Editar no Photoshop/GIMP
3. Salvar como PNG
4. PNG → OZT - Converter de volta para o jogo
```

#### Preparar nova textura

```
1. Criar imagem em PNG (com transparência se necessário)
2. PNG → OZT - Converter para formato do jogo
3. Colocar na pasta do cliente
```

## 🎨 Formatos Suportados

| Formato | Tipo | Uso |
|---------|------|-----|
| **PNG** | Imagem padrão | Edição e visualização |
| **TGA** | Targa | Formato intermediário |
| **OZT** | Comprimido (TGA+Zlib) | Texturas do Mu Online |
| **OZB** | Comprimido (TGA+Zlib) | Texturas do Mu Online |
| **OZD** | Comprimido (TGA+Zlib) | Texturas do Mu Online |
| **OZJ** | Comprimido (JPG+Zlib) | Imagens JPEG do Mu |

## ⚙️ Tecnologias

- **Electron** - Framework desktop
- **React 18** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Pako** - Compressão/Descompressão Zlib

## 🔧 Estrutura do Projeto

```
deu-frostty-image-converter/
├── electron/           # Código Electron
│   ├── main.js        # Processo principal
│   └── preload.js     # Preload script
├── src/
│   ├── components/    # Componentes React
│   │   ├── Sidebar.tsx
│   │   ├── Canvas.tsx
│   │   ├── Logo.tsx
│   │   └── ...
│   ├── utils/         # Utilitários de conversão
│   │   ├── tga.ts     # Encoder/Decoder TGA
│   │   ├── ozt.ts     # Encoder/Decoder OZT
│   │   ├── ozj.ts     # Encoder/Decoder OZJ
│   │   └── converter.ts
│   ├── types/         # Definições TypeScript
│   ├── App.tsx        # Componente raiz
│   └── main.tsx       # Entry point
├── package.json
└── README.md
```

## 🎯 Preservação do Canal Alpha

⚠️ **IMPORTANTE**: Este conversor foi desenvolvido com foco especial na preservação do canal alpha (transparência). Perder o canal alpha pode causar:
- Texturas corrompidas no jogo
- Bordas brancas/pretas indesejadas
- Elementos de UI quebrados

Todas as conversões mantêm **100% do canal alpha original**.

## 🐛 Solução de Problemas

### Arquivo OZT não abre no jogo
- Verifique se a extensão está correta (.ozt)
- Confirme se o arquivo original tinha canal alpha
- Tente converter OZT → TGA → PNG para verificar integridade

### Preview não carrega
- Arquivo pode estar corrompido
- Formato pode não ser suportado
- Verifique o console para erros

### Conversão falha
- Arquivo de origem pode estar corrompido
- Falta de permissões de escrita na pasta
- Formato de arquivo inválido

## 📝 Notas de Desenvolvimento

### Por que Electron + React?

- **Glassmorphism**: CSS moderno com `backdrop-filter`
- **Performance**: Canvas HTML5 para preview rápido
- **Cross-platform**: Funciona em Windows, Mac e Linux
- **Moderno**: Componentização e TypeScript

### Formato OZT Explicado

O formato OZT do Mu Online é simplesmente:
1. Um arquivo TGA normal
2. Comprimido com Zlib (algoritmo Deflate)
3. Mantém todas as propriedades do TGA original

## 📄 Licença

MIT License - Uso livre para projetos pessoais e educacionais.

## 🤝 Contribuições

Sugestões e melhorias são bem-vindas!

---

**DEU® Frostty** - Season 18 Tools
Made with 💜 for the Mu Online community
