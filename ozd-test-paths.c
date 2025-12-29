#include <stdio.h>
#include <stdlib.h>
#include <windows.h>
#include <string.h>

void testPath(void* pOpenImage, const char* input, const char* output, int testNum) {
    printf("\n=== TESTE %d ===\n", testNum);
    printf("Input:  \"%s\"\n", input);
    printf("Output: \"%s\"\n", output);
    
    typedef int (*OpenImageFunc)(const char*, const char*);
    OpenImageFunc OpenImage = (OpenImageFunc)pOpenImage;
    
    int result = OpenImage(input, output);
    printf("Resultado: %d\n", result);
    
    Sleep(50);
    FILE* test = fopen(output, "rb");
    if (test) {
        fseek(test, 0, SEEK_END);
        long size = ftell(test);
        fclose(test);
        if (size > 0) {
            printf(">>> SUCESSO! Arquivo criado (%ld bytes)\n", size);
        }
    } else {
        printf("Arquivo nao foi criado\n");
    }
}

int main(int argc, char* argv[]) {
    if (argc < 3) {
        printf("Uso: ozd-test-paths.exe <input.ozd> <output.dds>\n");
        return 1;
    }
    
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
    if (!pOpenImage) {
        printf("ERRO: OpenImage nao encontrada\n");
        FreeLibrary(hDll);
        return 1;
    }
    
    printf("DLL carregada!\n");
    
    char absInput[MAX_PATH];
    char absOutput[MAX_PATH];
    GetFullPathNameA(argv[1], MAX_PATH, absInput, NULL);
    GetFullPathNameA(argv[2], MAX_PATH, absOutput, NULL);
    
    // Teste 1: Caminhos absolutos com backslashes
    testPath(pOpenImage, absInput, absOutput, 1);
    
    // Teste 2: Caminhos absolutos com forward slashes
    char fwdInput[MAX_PATH], fwdOutput[MAX_PATH];
    strcpy(fwdInput, absInput);
    strcpy(fwdOutput, absOutput);
    for (int i = 0; fwdInput[i]; i++) if (fwdInput[i] == '\\') fwdInput[i] = '/';
    for (int i = 0; fwdOutput[i]; i++) if (fwdOutput[i] == '\\') fwdOutput[i] = '/';
    testPath(pOpenImage, fwdInput, fwdOutput, 2);
    
    // Teste 3: Caminhos relativos originais
    testPath(pOpenImage, argv[1], argv[2], 3);
    
    // Teste 4: Output na mesma pasta do input
    char* lastSlash2 = strrchr(absInput, '\\');
    if (lastSlash2) {
        char localOutput[MAX_PATH];
        strncpy(localOutput, absInput, lastSlash2 - absInput + 1);
        localOutput[lastSlash2 - absInput + 1] = '\0';
        strcat(localOutput, "output.dds");
        testPath(pOpenImage, absInput, localOutput, 4);
    }
    
    FreeLibrary(hDll);
    return 0;
}
