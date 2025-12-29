#include <stdio.h>
#include <stdlib.h>
#include <windows.h>
#include <string.h>

int main(int argc, char* argv[]) {
    if (argc < 3) {
        printf("Uso: ozd-brute-force.exe <input.ozd> <output.dds>\n");
        return 1;
    }
    
    char absInput[MAX_PATH];
    char absOutput[MAX_PATH];
    GetFullPathNameA(argv[1], MAX_PATH, absInput, NULL);
    GetFullPathNameA(argv[2], MAX_PATH, absOutput, NULL);
    
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
    
    // Tenta chamar OpenImage com zero parametros (retorna handle)
    printf("TESTE 1: handle = OpenImage()\n");
    typedef void* (*Func0)();
    Func0 f0 = (Func0)pOpenImage;
    void* handle = f0();
    printf("  Retornou: %p\n", handle);
    
    // Tenta SaveImage(handle, input, output)
    if (handle) {
        printf("\nTESTE 2: SaveImage(handle, input, output)\n");
        typedef int (*SaveFunc)(void*, const char*, const char*);
        SaveFunc sf = (SaveFunc)pSaveImage;
        int r = sf(handle, absInput, absOutput);
        printf("  Retornou: %d\n", r);
    }
    
    // Tenta OpenImage com 3 parametros (handle, input, output)
    printf("\nTESTE 3: OpenImage(NULL, input, output)\n");
    typedef int (*Func3)(void*, const char*, const char*);
    Func3 f3 = (Func3)pOpenImage;
    int r3 = f3(NULL, absInput, absOutput);
    printf("  Retornou: %d\n", r3);
    
    // Verifica arquivo
    FILE* test = fopen(absOutput, "rb");
    if (test) {
        fseek(test, 0, SEEK_END);
        long size = ftell(test);
        fclose(test);
        if (size > 0) {
            printf("\n>>> SUCESSO! Arquivo criado (%ld bytes)\n", size);
            FreeLibrary(hDll);
            return 0;
        }
    }
    
    // Tenta com buffer
    printf("\nTESTE 4: Lendo arquivo manualmente e passando buffer\n");
    FILE* f = fopen(absInput, "rb");
    if (f) {
        fseek(f, 0, SEEK_END);
        long size = ftell(f);
        fseek(f, 0, SEEK_SET);
        unsigned char* buffer = malloc(size);
        fread(buffer, 1, size, f);
        fclose(f);
        
        printf("  Arquivo lido: %ld bytes\n", size);
        
        // Tenta OpenImage(buffer, size, output)
        typedef int (*Func4)(void*, long, const char*);
        Func4 f4 = (Func4)pOpenImage;
        int r4 = f4(buffer, size, absOutput);
        printf("  OpenImage(buffer, size, output) = %d\n", r4);
        
        free(buffer);
    }
    
    // Verifica novamente
    test = fopen(absOutput, "rb");
    if (test) {
        fseek(test, 0, SEEK_END);
        long size = ftell(test);
        fclose(test);
        if (size > 0) {
            printf("\n>>> SUCESSO! Arquivo criado (%ld bytes)\n", size);
            FreeLibrary(hDll);
            return 0;
        }
    }
    
    printf("\nNenhum teste funcionou.\n");
    FreeLibrary(hDll);
    return 1;
}
