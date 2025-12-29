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
   * Abre o diálogo de seleção de pasta
   */
  async selectFolder(): Promise<string | null> {
    try {
      const electron = this.getElectron();
      const result = await electron.remote.dialog.showOpenDialog({
        properties: ['openDirectory'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    } catch (error) {
      console.error('[ElectronService] Error selecting folder:', error);
      throw error;
    }
  }

  /**
   * Lista arquivos de uma pasta
   */
  readDirectory(folderPath: string): string[] {
    try {
      const fs = this.getFS();
      return fs.readdirSync(folderPath);
    } catch (error) {
      console.error('[ElectronService] Error reading directory:', error);
      throw error;
    }
  }

  /**
   * Lê arquivo
   */
  readFile(filePath: string): Buffer {
    try {
      const fs = this.getFS();
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('[ElectronService] Error reading file:', error);
      throw error;
    }
  }

  /**
   * Obtém stats de arquivo
   */
  getFileStats(filePath: string) {
    try {
      const fs = this.getFS();
      return fs.statSync(filePath);
    } catch (error) {
      console.error('[ElectronService] Error getting file stats:', error);
      throw error;
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
   * Minimiza janela
   */
  minimizeWindow(): void {
    try {
      const electron = this.getElectron();
      electron.remote.getCurrentWindow().minimize();
    } catch (error) {
      console.error('[ElectronService] Error minimizing window:', error);
    }
  }

  /**
   * Maximiza/Restaura janela
   */
  toggleMaximizeWindow(): void {
    try {
      const electron = this.getElectron();
      const win = electron.remote.getCurrentWindow();
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    } catch (error) {
      console.error('[ElectronService] Error toggling maximize:', error);
    }
  }

  /**
   * Fecha janela
   */
  closeWindow(): void {
    try {
      const electron = this.getElectron();
      electron.remote.getCurrentWindow().close();
    } catch (error) {
      console.error('[ElectronService] Error closing window:', error);
    }
  }
}

export const electronService = new ElectronService();
