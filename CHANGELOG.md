# Changelog

Todas as mudancas notaveis deste projeto serao documentadas neste arquivo.

## [2.0.0] - 2025-12-29

### MAJOR REDESIGN - UX Completamente Reformulada

#### Adicionado
- Lista de arquivos integrada (substitui janela separada)
- Menu contextual inteligente (botao direito)
- Validacao automatica de conversoes
- Lazy loading de thumbnails com Intersection Observer
- Toast system minimalista
- Protecao de tamanho de arquivo (5MB max para thumbnails)
- Cleanup completo de recursos ao fechar app
- Scripts de loading screen (merge/split)
- Documentacao tecnica completa (ARCHITECTURE.md)

#### Modificado
- UX simplificada: tudo em uma janela
- Conversoes via menu contextual (nao mais botoes fixos)
- Toasts compactos e em 1 linha
- Performance otimizada para 1000+ arquivos
- Glass morphism refinado

#### Removido
- Suporte a OZB (causava travamento)
- Suporte a OZD (criptografia nao descoberta)
- Janela separada de lista de arquivos
- Todos os arquivos de teste e analise
- DLLs nao funcionais
- Scripts de teste obsoletos

#### Corrigido
- App travando com arquivos grandes
- Thumbnails carregando todos de uma vez
- Memory leaks de blob URLs
- Intersection Observers nao sendo limpos
- Texto quebrando em toasts

---

## [1.0.0] - 2025-12-28

### Release Inicial

#### Adicionado
- Conversao PNG ↔ TGA
- Conversao PNG → OZT
- Conversao OZT → TGA
- Conversao OZJ → JPG
- Preview em tempo real
- Interface glassmorphism
- Titlebar customizada
- Sistema de toasts

#### Implementado
- Decodificador TGA completo
- Encoder TGA com preservacao alpha
- Decodificador OZT (TGA + Zlib)
- Encoder OZT
- Decodificador OZJ (JPEG + XOR)
- Sistema de preview multi-formato

---

## Tipos de Mudancas

- `Adicionado` - Novas funcionalidades
- `Modificado` - Mudancas em funcionalidades existentes
- `Removido` - Funcionalidades removidas
- `Corrigido` - Bugs corrigidos
- `Seguranca` - Vulnerabilidades corrigidas
- `Performance` - Melhorias de performance

---

## Roadmap Futuro

### v2.1.0 (Planejado)
- [ ] Conversao em lote (multiplos arquivos simultaneos)
- [ ] Drag & drop de arquivos
- [ ] Historico de conversoes recentes
- [ ] Favoritos/bookmarks de pastas

### v2.2.0 (Planejado)
- [ ] Presets de conversao personalizados
- [ ] Configuracoes de compressao OZT
- [ ] Batch rename de arquivos
- [ ] Exportacao de relatorio

### v3.0.0 (Futuro)
- [ ] Suporte a mais formatos do MU (se descobertos)
- [ ] Editor de imagem integrado basico
- [ ] Comparacao lado a lado (antes/depois)
- [ ] Plugin system

---

Mantenha este arquivo atualizado a cada release significativa.
