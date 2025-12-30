/**
 * Service para centralizar todas as chamadas da API do Electron
 */

declare global {
  interface Window {
    electronAPI: {
      // Dialogs
      selectFolder: () => Promise<{ canceled: boolean; filePath?: string; error?: string }>;
      selectOutputFolder: () => Promise<{ canceled: boolean; folderPath?: string; error?: string }>;
      
      // File operations
      readFile: (filePath: string) => Promise<{ ok: boolean; data?: number[]; error?: string }>;
      writeFile: (filePath: string, data: number[]) => Promise<{ ok: boolean; error?: string }>;
      readDirectory: (folderPath: string) => Promise<{ ok: boolean; files?: string[]; error?: string }>;
      getFileStats: (filePath: string) => Promise<{ ok: boolean; size?: number; mtime?: number; error?: string }>;
      
      // Converters
      // convertOzdToDds - removido (não implementado)
      
      // Path utilities
      pathJoin: (...paths: string[]) => Promise<string>;
      pathExtname: (filePath: string) => Promise<string>;
      pathDirname: (filePath: string) => Promise<string>;
      pathBasename: (filePath: string) => Promise<string>;
      
      // Window controls
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      toggleMaximizeWindow: () => void;
      closeWindow: () => void;
    };
  }
}

class ElectronService {
  private getAPI() {
    if (!window.electronAPI) {
      console.error('[ElectronService] window.electronAPI não está disponível!');
      console.error('[ElectronService] Verifique se o preload.cjs foi carregado corretamente.');
      throw new Error('API do Electron não disponível. Reinicie o aplicativo.');
    }
    return window.electronAPI;
  }

  /**
   * Abre o diálogo de seleção de pasta de origem
   */
  async selectFolder(): Promise<string | null> {
    try {
      const api = this.getAPI();
      const result = await api.selectFolder();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.canceled) {
        return null;
      }

      return result.filePath || null;
    } catch (error) {
      console.error('[ElectronService] Erro ao selecionar pasta:', error);
      throw new Error('Não foi possível abrir o seletor de pastas.');
    }
  }

  /**
   * Abre o diálogo de seleção de pasta de destino (para salvar conversões)
   */
  async selectOutputFolder(): Promise<string | null> {
    try {
      const api = this.getAPI();
      const result = await api.selectOutputFolder();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.canceled) {
        return null;
      }

      return result.folderPath || null;
    } catch (error) {
      console.error('[ElectronService] Erro ao selecionar pasta destino:', error);
      throw new Error('Não foi possível abrir o seletor de pasta.');
    }
  }

  /**
   * Lista arquivos de uma pasta
   */
  async readDirectory(folderPath: string): Promise<string[]> {
    try {
      const api = this.getAPI();
      const result = await api.readDirectory(folderPath);

      if (!result.ok || result.error) {
        throw new Error(result.error || 'Erro ao ler pasta');
      }

      return result.files || [];
    } catch (error) {
      console.error('[ElectronService] Erro ao ler pasta:', error);
      throw new Error('Não foi possível ler os arquivos desta pasta.');
    }
  }

  /**
   * Lê arquivo (via IPC)
   */
  async readFile(filePath: string): Promise<Uint8Array> {
    try {
      const api = this.getAPI();
      const result = await api.readFile(filePath);

      if (!result.ok || result.error) {
        throw new Error(result.error || 'Erro ao ler arquivo');
      }

      return new Uint8Array(result.data || []);
    } catch (error) {
      console.error('[ElectronService] Erro ao ler arquivo:', error);
      throw new Error('Não foi possível ler este arquivo.');
    }
  }

  /**
   * Escreve arquivo (via IPC)
   */
  async writeFile(filePath: string, data: Uint8Array | Buffer): Promise<void> {
    try {
      console.log('[ElectronService] Escrevendo arquivo:', filePath);
      console.log('[ElectronService] Tamanho dos dados:', data.length, 'bytes');
      
      const api = this.getAPI();
      const dataArray = data instanceof Uint8Array ? Array.from(data) : Array.from(new Uint8Array(data));
      
      console.log('[ElectronService] Array convertido, tamanho:', dataArray.length);
      
      const result = await api.writeFile(filePath, dataArray);

      console.log('[ElectronService] Resultado do IPC:', result);

      if (!result.ok || result.error) {
        throw new Error(result.error || 'Erro ao escrever arquivo');
      }
      
      console.log('[ElectronService] Arquivo escrito com sucesso!');
    } catch (error) {
      console.error('[ElectronService] Erro ao escrever arquivo:', error);
      throw new Error('Não foi possível salvar este arquivo.');
    }
  }

  /**
   * Obtém stats de arquivo
   */
  async getFileStats(filePath: string): Promise<{ size: number; mtime: number }> {
    try {
      const api = this.getAPI();
      const result = await api.getFileStats(filePath);

      if (!result.ok || result.error) {
        throw new Error(result.error || 'Erro ao obter stats');
      }

      return { size: result.size || 0, mtime: result.mtime || 0 };
    } catch (error) {
      console.error('[ElectronService] Erro ao obter stats:', error);
      throw new Error('Não foi possível obter informações do arquivo.');
    }
  }

  // convertOzdToDds removido - conversão não implementada

  /**
   * Junta caminhos (via IPC)
   */
  async joinPath(...paths: string[]): Promise<string> {
    const api = this.getAPI();
    return api.pathJoin(...paths);
  }

  /**
   * Obtém extensão do arquivo (via IPC)
   */
  async getExtension(filePath: string): Promise<string> {
    const api = this.getAPI();
    return api.pathExtname(filePath);
  }

  /**
   * Obtém nome do arquivo (via IPC)
   */
  async getBasename(filePath: string): Promise<string> {
    const api = this.getAPI();
    return api.pathBasename(filePath);
  }

  /**
   * Obtém diretório do arquivo (via IPC)
   */
  async getDirname(filePath: string): Promise<string> {
    const api = this.getAPI();
    return api.pathDirname(filePath);
  }

  /**
   * Minimiza janela
   */
  minimizeWindow(): void {
    try {
      const api = this.getAPI();
      api.minimizeWindow();
    } catch (error) {
      console.error('[ElectronService] Erro ao minimizar:', error);
    }
  }

  /**
   * Maximiza/Restaura janela
   */
  toggleMaximizeWindow(): void {
    try {
      const api = this.getAPI();
      api.maximizeWindow();
    } catch (error) {
      console.error('[ElectronService] Erro ao maximizar:', error);
    }
  }

  /**
   * Fecha janela
   */
  closeWindow(): void {
    try {
      const api = this.getAPI();
      api.closeWindow();
    } catch (error) {
      console.error('[ElectronService] Erro ao fechar:', error);
    }
  }
}

export const electronService = new ElectronService();
