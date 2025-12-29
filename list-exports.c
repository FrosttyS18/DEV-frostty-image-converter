#include <stdio.h>
#include <windows.h>

void listExports(const char* dllPath) {
    HMODULE dll = LoadLibraryA(dllPath);
    if (!dll) {
        printf("ERRO: Nao foi possivel carregar DLL\n");
        return;
    }
    
    printf("DLL carregada com sucesso!\n\n");
    
    PIMAGE_DOS_HEADER dosHeader = (PIMAGE_DOS_HEADER)dll;
    PIMAGE_NT_HEADERS ntHeaders = (PIMAGE_NT_HEADERS)((BYTE*)dll + dosHeader->e_lfanew);
    
    DWORD exportDirRVA = ntHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress;
    
    if (exportDirRVA == 0) {
        printf("DLL nao tem exports visiveis\n");
        FreeLibrary(dll);
        return;
    }
    
    PIMAGE_EXPORT_DIRECTORY exports = (PIMAGE_EXPORT_DIRECTORY)((BYTE*)dll + exportDirRVA);
    DWORD *nameRVAs = (DWORD*)((BYTE*)dll + exports->AddressOfNames);
    
    printf("FUNCOES EXPORTADAS: %lu\n\n", exports->NumberOfNames);
    
    for (DWORD i = 0; i < exports->NumberOfNames; i++) {
        const char *name = (const char*)((BYTE*)dll + nameRVAs[i]);
        printf("  %3lu. %s\n", i+1, name);
    }
    
    FreeLibrary(dll);
}

int main() {
    char dllPath[512];
    GetModuleFileNameA(NULL, dllPath, sizeof(dllPath));
    
    char *lastSlash = strrchr(dllPath, '\\');
    if (lastSlash) *lastSlash = '\0';
    
    strcat(dllPath, "\\arquivos para estudar o formato\\arquivos enviado pelo nosso amigo\\ozd.dll");
    
    for(int i=0; i<60; i++) printf("=");
    printf("\nLISTANDO EXPORTS: ozd.dll\n");
    for(int i=0; i<60; i++) printf("=");
    printf("\n\n");
    
    listExports(dllPath);
    
    printf("\n");
    for(int i=0; i<60; i++) printf("=");
    printf("\n");
    
    return 0;
}
