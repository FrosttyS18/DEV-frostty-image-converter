#include <windows.h>
#include <stdio.h>
int main() {
    HMODULE h = LoadLibraryA("ozd.dll");
    if (!h) {
        printf("Erro: %d\n", GetLastError());
    } else {
        printf("Sucesso!\n");
        FreeLibrary(h);
    }
    return 0;
}
