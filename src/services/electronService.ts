/**
 * Service para centralizar todas as chamadas da API do Electron
 */

declare global {
  interface Window {
    require: any;
  }
}

class ElectronService {
  private getElectron() {
    if (typeof window.require !== 'function') {
      throw new Error('Electron not available');
    }
    return window.require('electron');
  }

  private getFS() {
    return window.require('fs');
  }

  private getPath() {
    return window.require('path');
  }

  /**
   * Abre o diálogo de seleção de pasta (via IPC)
   */
  async selectFolder(): Promise<string | null> {
    try {
      const electron = this.getElectron();
      
      // Usa IPC ao invés de remote
      const result = await electron.ipcRenderer.invoke('select-folder');
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.canceled) {
        return null;
      }
      
      return result.filePath || null;
    } catch (error) {
      console.error('[ElectronService] Error selecting folder:', error);
      throw new Error('Não foi possível abrir o seletor de pastas.');
    }
  }

  /**
   * Lista arquivos de uma pasta (via IPC)
   */
  async readDirectory(folderPath: string): Promise<string[]> {
    try {
      const electron = this.getElectron();
      const result = await electron.ipcRenderer.invoke('read-directory', folderPath);
      
      if (!result.ok) {
        throw new Error(result.error || 'Erro ao ler pasta');
      }
      
      return result.files || [];
    } catch (error) {
      console.error('[ElectronService] Error reading directory:', error);
      throw new Error('Não foi possível ler os arquivos desta pasta.');
    }
  }

  /**
   * Lê arquivo (mantém síncrono via fs direto)
   */
  readFile(filePath: string): Buffer {
    try {
      const fs = this.getFS();
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('[ElectronService] Error reading file:', error);
      throw new Error('Não foi possível ler este arquivo.');
    }
  }

  /**
   * Obtém stats de arquivo (via IPC)
   */
  async getFileStats(filePath: string): Promise<{ size: number }> {
    try {
      const electron = this.getElectron();
      const result = await electron.ipcRenderer.invoke('get-file-stats', filePath);
      
      if (!result.ok) {
        throw new Error(result.error || 'Erro ao obter stats');
      }
      
      return { size: result.size };
    } catch (error) {
      console.error('[ElectronService] Error getting file stats:', error);
      throw new Error('Não foi possível obter informações do arquivo.');
    }
  }

  /**
   * Junta caminhos
   */
  joinPath(...paths: string[]): string {
    const path = this.getPath();
    return path.join(...paths);
  }

  /**
   * Obtém extensão do arquivo
   */
  getExtension(filePath: string): string {
    const path = this.getPath();
    return path.extname(filePath);
  }

  /**
   * Minimiza janela (via IPC)
   */
  minimizeWindow(): void {
    try {
      const electron = this.getElectron();
      electron.ipcRenderer.send('window-minimize');
    } catch (error) {
      console.error('[ElectronService] Erro ao minimizar:', error);
    }
  }

  /**
   * Maximiza/Restaura janela (via IPC)
   */
  toggleMaximizeWindow(): void {
    try {
      const electron = this.getElectron();
      electron.ipcRenderer.send('window-maximize');
    } catch (error) {
      console.error('[ElectronService] Erro ao maximizar:', error);
    }
  }

  /**
   * Fecha janela (via IPC)
   */
  closeWindow(): void {
    try {
      const electron = this.getElectron();
      
      // Tenta IPC primeiro
      if (electron.ipcRenderer) {
        electron.ipcRenderer.send('window-close');
      }
      // Fallback: usa remote
      else if (electron.remote) {
        electron.remote.getCurrentWindow().close();
        electron.remote.app.quit();
      }
      // Último recurso
      else {
        window.close();
      }
    } catch (error) {
      console.error('[ElectronService] Erro ao fechar:', error);
      // Força encerramento
      try {
        window.close();
      } catch {}
    }
  }
}

export const electronService = new ElectronService();
