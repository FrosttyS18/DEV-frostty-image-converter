# 📝 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2025-12-29

### 🎉 Lançamento Inicial

#### ✨ Adicionado

**Interface:**
- Interface glassmorphism moderna com design roxo/azul
- Sidebar com botões de conversão e lista de arquivos
- Canvas grande para preview em tempo real
- Logo DEU Frostty personalizado
- Background animado com efeitos gradient
- Efeitos hover e transições suaves
- Scrollbar customizada

**Funcionalidades:**
- Seleção de pasta para carregar arquivos
- Listagem de arquivos com cores por extensão
- Preview integrado com informações de dimensões
- Conversão PNG → TGA (preservando alpha)
- Conversão TGA → PNG (preservando alpha)
- Conversão PNG → OZT (formato comprimido do Mu)
- Conversão OZT/OZB/OZD → TGA (descompressão)
- Conversão OZJ → JPG (JPEG comprimido)
- Conversão em lote de múltiplos arquivos
- Preservação total do canal Alpha (transparência)

**Componentes React:**
- `App.tsx` - Componente raiz da aplicação
- `Sidebar.tsx` - Painel lateral com controles
- `Canvas.tsx` - Visualizador de imagens
- `FileList.tsx` - Lista de arquivos com cores
- `Logo.tsx` - Logo DEU Frostty
- `Button.tsx` - Botão reutilizável
- `BackgroundEffect.tsx` - Efeito de fundo animado

**Utilitários de Conversão:**
- `tga.ts` - Decoder/Encoder TGA customizado (24-bit e 32-bit RGBA)
- `ozt.ts` - Decoder/Encoder OZT (TGA + Zlib)
- `ozj.ts` - Decoder/Encoder OZJ (JPEG + Zlib)
- `imageLoader.ts` - Carregador de imagens
- `converter.ts` - Sistema de conversão principal

**Documentação:**
- `README.md` - Documentação completa do projeto
- `INSTALACAO.md` - Guia detalhado de instalação
- `QUICKSTART.md` - Guia rápido de uso
- `PROJETO_CONCLUIDO.md` - Documentação técnica completa

**Configuração:**
- Electron 33 configurado
- Vite como build tool
- TypeScript com configuração strict
- Tailwind CSS com glassmorphism
- ESLint e Prettier (futuro)

**Arquivos de Teste:**
- Incluídos 5 arquivos de exemplo (TGA, OZT, OZJ)
- Pasta `arquivos para estudar o formato/`

#### 🔧 Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript 5.7, Tailwind CSS 3.4
- **Desktop:** Electron 33, Node.js
- **Build:** Vite 6.0, PostCSS, Autoprefixer
- **Conversão:** Pako 2.1 (Zlib), Canvas API
- **Dev Tools:** Concurrently, Wait-on, Electron Builder

#### 🎯 Formatos Suportados

| Formato | Tipo | Leitura | Escrita | Preserva Alpha |
|---------|------|---------|---------|----------------|
| PNG | Imagem padrão | ✅ | ✅ | ✅ |
| TGA | Targa | ✅ | ✅ | ✅ |
| OZT | TGA+Zlib | ✅ | ✅ | ✅ |
| OZB | TGA+Zlib | ✅ | ❌ | ✅ |
| OZD | TGA+Zlib | ✅ | ❌ | ✅ |
| OZJ | JPEG+Zlib | ✅ | ❌ | N/A |

#### 📊 Estatísticas

- **Linhas de código:** ~10.243
- **Arquivos criados:** 37
- **Componentes React:** 7
- **Utilitários:** 5
- **Formatos suportados:** 6
- **Conversões disponíveis:** 5

---

## 🚀 Roadmap

### [1.1.0] - Planejado

#### Possíveis Melhorias
- [ ] Drag & drop de arquivos
- [ ] Atalhos de teclado (Ctrl+O, Ctrl+R, etc)
- [ ] Histórico de conversões
- [ ] Preview lado a lado (antes/depois)
- [ ] Ajuste de nível de compressão OZT
- [ ] Batch rename de arquivos
- [ ] Export de relatório de conversões
- [ ] Modo claro/escuro
- [ ] Zoom no canvas
- [ ] Grid de thumbnails
- [ ] Filtros de busca de arquivo

#### Otimizações
- [ ] Worker threads para conversões pesadas
- [ ] Cache de previews
- [ ] Lazy loading de arquivos grandes
- [ ] Compressão otimizada

---

## 📌 Notas de Versão

### Convenções de Commit

Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Mudanças na documentação
- `style:` - Formatação, espaços, etc
- `refactor:` - Refatoração de código
- `perf:` - Melhorias de performance
- `test:` - Adição de testes
- `chore:` - Tarefas de manutenção

### Versionamento

- **MAJOR** (X.0.0) - Mudanças incompatíveis
- **MINOR** (1.X.0) - Novas funcionalidades compatíveis
- **PATCH** (1.0.X) - Correções de bugs

---

**DEU® Frostty** - Season 18 Tools  
*Made with 💜 for the Mu Online community*
