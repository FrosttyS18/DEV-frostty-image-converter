# Formatos de Imagem Mu Online - Especificações Técnicas

Estes arquivos contêm a lógica de leitura e escrita para os formatos proprietários do Mu Online.

## Arquivos Incluídos

### 1. ozt.ts (Formato OZT)
O formato OZT é basicamente um arquivo TGA encapsulado.
- **Leitura**:
  - Pode estar comprimido com Zlib (headers: `0x78 0x9C`, etc).
  - Pode ser um TGA direto, mas deslocado (offsets comuns: 4 bytes).
  - A lógica tenta descomprimir zlib primeiro, se falhar, tenta ler como TGA ignorando os primeiros N bytes (4, 0, 2, 8, etc).
- **Escrita**: 
  - Geralmente salvo como TGA puro com um header de 4 bytes (`00 00 02 00`) para compatibilidade com Pentium Tools.

### 2. ozj.ts (Formato OZJ)
O formato OZJ é um arquivo JPEG (JFIF) encapsulado.
- **Leitura**:
  - Pode ser um JPEG direto.
  - Pode estar comprimido com Zlib.
  - Pode ter um header de 24 bytes (cópia dos primeiros 24 bytes do JPEG) - usado pelo Pentium Tools.
  - Pode estar "encriptado" com XOR simples (Chave `0xFC`).
  - Pode conter múltiplas imagens (thumbnails + imagem real).
- **Escrita**:
  - Salvo como JPEG com header de 24 bytes para máxima compatibilidade.

### 3. tga.ts (Formato TGA)
Manipulação padrão de arquivos TGA (Targa).
- Suporta 24-bit (BGR) e 32-bit (BGRA).
- Suporta compressão RLE (Run-Length Encoding) - Tipo 10.
- Suporta origem Top-Left e Bottom-Left.

## Dicas para Web (JavaScript/TypeScript)

Para usar na web:
1. Você precisará de uma lib para Zlib (ex: `pako`).
2. Para imagens, você pode manipular os bytes diretamente ou usar Canvas API.
3. Essas funções retornam `ImageData` (width, height, data=Uint8Array) que pode ser facilmente jogado num `<canvas>`.

## Byte Patterns Importantes

- **Zlib**: `0x78` (byte 0)
- **JPEG**: `0xFF 0xD8` (Start), `0xFF 0xD9` (End)
- **TGA**: Header de 18 bytes.
- **XOR Key (Mu)**: `0xFC`

---
por DEV Frostty
