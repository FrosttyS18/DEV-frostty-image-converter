#include <stdio.h>
#include <stdlib.h>
#include <windows.h>
#include <string.h>

int checkFile(const char* path) {
    FILE* f = fopen(path, "rb");
    if (f) {
        fseek(f, 0, SEEK_END);
        long size = ftell(f);
        fclose(f);
        if (size > 128) {
            // Verifica se é DDS (magic: "DDS ")
            f = fopen(path, "rb");
            char magic[4];
            fread(magic, 1, 4, f);
            fclose(f);
            if (magic[0] == 'D' && magic[1] == 'D' && magic[2] == 'S' && magic[3] == ' ') {
                printf("    >>> SUCESSO! DDS valido criado (%ld bytes)\n", size);
                return 1;
            } else {
                printf("    Arquivo criado mas nao parece DDS (%ld bytes)\n", size);
                printf("    Magic: 0x%02X 0x%02X 0x%02X 0x%02X\n", magic[0], magic[1], magic[2], magic[3]);
                return 0;
            }
        }
    }
    return 0;
}

int main(int argc, char* argv[]) {
    if (argc < 3) {
        printf("Uso: ozd-safe-test.exe <input.ozd> <output.dds>\n");
        return 1;
    }
    
    char absInput[MAX_PATH];
    char absOutput[MAX_PATH];
    GetFullPathNameA(argv[1], MAX_PATH, absInput, NULL);
    GetFullPathNameA(argv[2], MAX_PATH, absOutput, NULL);
    
    printf("Input:  %s\n", absInput);
    printf("Output: %s\n\n", absOutput);
    
    // Carrega DLL
    char exePath[MAX_PATH];
    char dllPath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    char* lastSlash = strrchr(exePath, '\\');
    if (lastSlash) *lastSlash = '\0';
    snprintf(dllPath, MAX_PATH, "%s\\ozd.dll", exePath);
    
    HMODULE hDll = LoadLibraryA(dllPath);
    if (!hDll) {
        printf("ERRO: DLL nao encontrada\n");
        return 1;
    }
    
    void* pOpenImage = GetProcAddress(hDll, "OpenImage");
    void* pSaveImage = GetProcAddress(hDll, "SaveImage");
    
    printf("DLL carregada!\n");
    printf("OpenImage: %p\n", pOpenImage);
    printf("SaveImage: %p\n\n", pSaveImage);
    
    // Lê o arquivo OZD inteiro
    FILE* f = fopen(absInput, "rb");
    if (!f) {
        printf("ERRO: Nao foi possivel abrir arquivo OZD\n");
        FreeLibrary(hDll);
        return 1;
    }
    
    fseek(f, 0, SEEK_END);
    long fileSize = ftell(f);
    fseek(f, 0, SEEK_SET);
    unsigned char* buffer = malloc(fileSize);
    fread(buffer, 1, fileSize, f);
    fclose(f);
    
    printf("Arquivo OZD lido: %ld bytes\n", fileSize);
    printf("Primeiros 16 bytes: ");
    for (int i = 0; i < 16 && i < fileSize; i++) {
        printf("%02X ", buffer[i]);
    }
    printf("\n\n");
    
    // TESTE SEGURO 1: OpenImage(input_path, output_path)
    printf("[TESTE 1] OpenImage(input_path, output_path)\n");
    typedef int (*Func2)(const char*, const char*);
    Func2 f2 = (Func2)pOpenImage;
    int result = f2(absInput, absOutput);
    printf("  Retorno: %d\n", result);
    if (checkFile(absOutput)) {
        free(buffer);
        FreeLibrary(hDll);
        return 0;
    }
    
    // TESTE SEGURO 2: OpenImage(buffer, size) + SaveImage(handle, output)
    printf("\n[TESTE 2] OpenImage(buffer, size)\n");
    typedef void* (*FuncBuf)(void*, int);
    FuncBuf fb = (FuncBuf)pOpenImage;
    void* handle = fb(buffer, fileSize);
    printf("  Handle retornado: %p\n", handle);
    
    if (handle && handle != (void*)0xFFFFFFFF && handle != (void*)1) {
        printf("  Chamando SaveImage(handle, output)...\n");
        typedef int (*SaveFunc2)(void*, const char*);
        SaveFunc2 sf2 = (SaveFunc2)pSaveImage;
        int r = sf2(handle, absOutput);
        printf("  Retorno: %d\n", r);
        if (checkFile(absOutput)) {
            free(buffer);
            FreeLibrary(hDll);
            return 0;
        }
    }
    
    // TESTE SEGURO 3: Malloc buffer de saída e pedir DLL preencher
    printf("\n[TESTE 3] OpenImage retorna buffer DDS\n");
    typedef unsigned char* (*FuncRet)(const char*, int*);
    FuncRet fr = (FuncRet)pOpenImage;
    int outSize = 0;
    unsigned char* outBuffer = fr(absInput, &outSize);
    printf("  Buffer retornado: %p, tamanho: %d\n", outBuffer, outSize);
    
    if (outBuffer && outSize > 0) {
        FILE* out = fopen(absOutput, "wb");
        fwrite(outBuffer, 1, outSize, out);
        fclose(out);
        printf("  Arquivo salvo\n");
        if (checkFile(absOutput)) {
            free(buffer);
            FreeLibrary(hDll);
            return 0;
        }
    }
    
    printf("\n=== Nenhum teste funcionou ===\n");
    free(buffer);
    FreeLibrary(hDll);
    return 1;
}
