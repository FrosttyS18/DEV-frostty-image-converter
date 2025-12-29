#include <stdio.h>
#include <windows.h>
#include <imagehlp.h>

#pragma comment(lib, "imagehlp.lib")

int main() {
    LOADED_IMAGE img;
    
    if (!MapAndLoad("ozd.dll", NULL, &img, TRUE, TRUE)) {
        printf("Erro ao carregar ozd.dll\n");
        return 1;
    }
    
    ULONG size;
    IMAGE_EXPORT_DIRECTORY* exports = (IMAGE_EXPORT_DIRECTORY*)
        ImageDirectoryEntryToData(img.MappedAddress, FALSE, 
            IMAGE_DIRECTORY_ENTRY_EXPORT, &size);
    
    if (!exports) {
        printf("Nenhuma exportacao encontrada\n");
        UnMapAndLoad(&img);
        return 1;
    }
    
    DWORD* names = (DWORD*)((BYTE*)img.MappedAddress + exports->AddressOfNames);
    DWORD* funcs = (DWORD*)((BYTE*)img.MappedAddress + exports->AddressOfFunctions);
    WORD* ords = (WORD*)((BYTE*)img.MappedAddress + exports->AddressOfNameOrdinals);
    
    printf("=== Funcoes exportadas por ozd.dll ===\n\n");
    
    for (DWORD i = 0; i < exports->NumberOfNames; i++) {
        char* name = (char*)((BYTE*)img.MappedAddress + names[i]);
        WORD ordinal = ords[i];
        DWORD addr = funcs[ordinal];
        
        printf("[%d] %s (ordinal: %d, RVA: 0x%08X)\n", i+1, name, ordinal, addr);
    }
    
    printf("\nTotal: %d funcoes\n", exports->NumberOfNames);
    
    UnMapAndLoad(&img);
    return 0;
}
