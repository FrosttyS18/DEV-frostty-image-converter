# Changelog

Todas as mudancas notaveis deste projeto.

## [2.0.0] - 2025-12-30

### MAJOR REDESIGN - UX Completamente Reformulada

#### Adicionado
- Lista de arquivos integrada (substituiu janela separada)
- Menu contextual inteligente com validacao de conversoes
- Conversao direta OZT para PNG (fluxo simplificado)
- Toolbar do Canvas (Zoom+, Zoom-, Auto-fit, Pan)
- Campo de busca com filtro por tipo (dropdown glass morphism)
- Cache LRU (50 previews, revisitas instantaneas)
- Sistema de fila com 3 niveis de prioridade
- Downsampling inteligente (thumbnails 256x256, preview 2048x2048)
- Splash screen profissional com delay minimo
- Info da pasta selecionada (caminho + contador)
- Canvas mostra nome arquivo + dimensoes + tamanho
- Lazy loading com Intersection Observer otimizado
- Toast system minimalista (1 linha, sem palavras viuvas)

#### Corrigido
- Memory leaks em imageLoader.ts e ozj.ts (blob URLs nao revogados)
- App travando com arquivos grandes (17MB+)
- Menu contextual ficando atras do canvas (React Portal)
- Pan/arrastar lento e travado (requestAnimationFrame)
- Thumbnails carregando todas de uma vez
- Splash fechando muito rapido
- Texto quebrando em toasts
- Suporte a OZB removido (causava travamento)

#### Removido
- Suporte a OZB e OZD (43 arquivos deletados)
- Janela separada de lista de arquivos
- Todos arquivos de teste e analise
- DLLs nao funcionais
- Scripts de desenvolvimento obsoletos
- Sidebar antiga (substituida por FileList)

#### Performance
- Fila com prioridades (alta/media/baixa)
- Cache LRU (50 previews)
- Downsampling automatico
- Lazy loading otimizado
- RequestAnimationFrame para pan suave
- Arquivos ate 20MB sem travar

#### Seguranca
- Cleanup completo ao fechar app
- Revogacao de todos blob URLs
- Desconexao de observers
- Remocao de event listeners
- Zero memory leaks

---

## [1.0.0] - 2025-12-28

### Release Inicial

#### Implementado
- Conversao PNG para TGA e TGA para PNG
- Conversao PNG para OZT
- Conversao OZT para TGA
- Conversao OZJ para JPG
- Preview em tempo real
- Interface glassmorphism
- Titlebar customizada
- Sistema de toasts basico

---

Mantenha este arquivo atualizado.
