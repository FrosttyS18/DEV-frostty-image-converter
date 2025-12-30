# Changelog

Todas as mudancas notaveis deste projeto.

## [2.1.0] - 2025-12-31

### MELHORIAS MAJOR - Canvas e UX Avançada

#### Adicionado
- **Conversão JPG → OZJ**: Suporte completo para converter JPEG para OZJ (compatível com Pentium Tools)
- **Suporte a JPG/JPEG**: Arquivos JPG/JPEG agora aparecem na lista com thumbnails e preview
- **Sistema de inércia (Kinetic Scrolling)**: Pan com física tipo Photoshop (atrito 0.925, média móvel de velocidade)
- **Multi-seleção de arquivos**: Checkboxes para selecionar múltiplos arquivos e converter em lote
- **Botão de reload**: Atualiza lista de arquivos sem precisar reabrir pasta
- **Tooltips em todos os botões**: Informações contextuais ao passar o mouse
- **ResizeObserver**: Recalcula limites automaticamente ao redimensionar janela
- **Suporte a RLE no TGA**: Descompressão de arquivos TGA tipo 10 (Run-Length Encoded)
- **Sistema "Mesa Livre"**: Imagens pequenas podem ser arrastadas livremente pela tela

#### Corrigido
- **Compatibilidade com Pentium Tools**: 
  - OZJ agora inclui header de 24 bytes (duplicando primeiros 24 bytes do JPEG)
  - OZT agora inclui header de 4 bytes (`00 00 02 00`) quando não usa zlib
  - Decodificação OZJ detecta e remove header de 24 bytes corretamente
- **Cache de thumbnails**: Invalidação automática quando arquivo é modificado (baseado em `mtimeMs`)
- **Preview JPG/PNG**: Corrigido problema de preview "quebrando" (race conditions e Blob creation)
- **Limites do Canvas**: Lógica corrigida para origem no centro (compatível com Flexbox)
- **Pan com Espaço**: Removido travamento ao segurar espaço para arrastar
- **Objetos sumindo**: Limites corretos impedem que imagens saiam completamente da tela
- **Scroll ao clicar arquivo**: Prevenido scroll indesejado ao clicar em arquivos na lista
- **Botão mãozinha**: Hover states corrigidos (mostra status ligado/desligado)
- **Contorno ao clicar canvas**: Removido outline indesejado
- **TypeScript errors**: Corrigidos erros de tipagem em `imageLoader.ts` e `converter.ts`

#### Melhorias de UX
- **Batch conversion**: Menu dropdown para conversão em lote (similar ao menu contextual)
- **Toast de seleção**: Mostra contador de arquivos selecionados via toast
- **Checkboxes customizados**: Estilo glassmorphism consistente com UI
- **Filtro obrigatório para multi-seleção**: Checkboxes só aparecem quando filtro está ativo (evita conversões mistas)
- **Listener global de mouse**: Continua arrastando mesmo quando mouse sai do canvas (tipo Photoshop)

#### Performance
- **Sistema de inércia otimizado**: `requestAnimationFrame` para animação suave
- **Média móvel de velocidade**: Últimos 5 movimentos para calcular "flick" preciso
- **Hard stop nas bordas**: Zera velocidade instantaneamente ao bater na borda
- **Cleanup de animações**: Cancela `requestAnimationFrame` ao desmontar componente

#### Compatibilidade
- **Pentium Tools**: Arquivos gerados são 100% compatíveis com Pentium Tools
- **TGA RLE**: Suporte completo para descompressão de TGA tipo 10
- **Header detection**: Detecta e trata headers customizados corretamente

---

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
