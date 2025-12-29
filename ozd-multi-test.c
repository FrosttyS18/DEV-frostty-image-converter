#include <stdio.h>
#include <stdlib.h>
#include <windows.h>
#include <string.h>

int main(int argc, char* argv[]) {
    if (argc < 3) {
        printf("Uso: ozd-multi-test.exe <input.ozd> <output.dds>\n");
        return 1;
    }
    
    const char* inputPath = argv[1];
    const char* outputPath = argv[2];
    
    // Converte para caminhos absolutos
    char absInput[MAX_PATH];
    char absOutput[MAX_PATH];
    GetFullPathNameA(inputPath, MAX_PATH, absInput, NULL);
    GetFullPathNameA(outputPath, MAX_PATH, absOutput, NULL);
    
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
        printf("ERRO: Nao foi possivel carregar DLL\n");
        return 1;
    }
    
    void* pOpenImage = GetProcAddress(hDll, "OpenImage");
    void* pSaveImage = GetProcAddress(hDll, "SaveImage");
    
    if (!pOpenImage || !pSaveImage) {
        printf("ERRO: Funcoes nao encontradas\n");
        FreeLibrary(hDll);
        return 1;
    }
    
    printf("DLL e funcoes carregadas!\n\n");
    
    // TESTE 1: OpenImage(absInput, absOutput) com caminhos absolutos
    printf("TESTE 1: OpenImage(absInput, absOutput)\n");
    typedef int (*Func1)(const char*, const char*);
    Func1 f1 = (Func1)pOpenImage;
    int r1 = f1(absInput, absOutput);
    printf("  Resultado: %d\n", r1);
    FILE* t1 = fopen(absOutput, "rb");
    if (t1) {
        fclose(t1);
        printf("  [SUCESSO] Arquivo criado!\n");
        FreeLibrary(hDll);
        return 0;
    }
    
    // TESTE 2: OpenImage retorna handle, SaveImage salva
    printf("\nTESTE 2: handle = OpenImage(absInput); SaveImage(handle, absOutput)\n");
    typedef void* (*Func2)(const char*);
    typedef int (*Func3)(void*, const char*);
    Func2 f2 = (Func2)pOpenImage;
    Func3 f3 = (Func3)pSaveImage;
    
    void* handle = f2(absInput);
    printf("  OpenImage retornou: %p\n", handle);
    
    if (handle != NULL && handle != (void*)0xFFFFFFFF) {
        int r2 = f3(handle, absOutput);
        printf("  SaveImage retornou: %d\n", r2);
        
        FILE* t2 = fopen(absOutput, "rb");
        if (t2) {
            fclose(t2);
            printf("  [SUCESSO] Arquivo criado!\n");
            FreeLibrary(hDll);
            return 0;
        }
    }
    
    // TESTE 3: Com ponteiros para tamanho
    printf("\nTESTE 3: OpenImage(absInput, absOutput, &width, &height)\n");
    typedef int (*Func4)(const char*, const char*, int*, int*);
    Func4 f4 = (Func4)pOpenImage;
    int width = 0, height = 0;
    int r3 = f4(absInput, absOutput, &width, &height);
    printf("  Resultado: %d, Width: %d, Height: %d\n", r3, width, height);
    
    FILE* t3 = fopen(absOutput, "rb");
    if (t3) {
        fclose(t3);
        printf("  [SUCESSO] Arquivo criado!\n");
        FreeLibrary(hDll);
        return 0;
    }
    
    printf("\nNenhum teste funcionou.\n");
    FreeLibrary(hDll);
    return 1;
}
