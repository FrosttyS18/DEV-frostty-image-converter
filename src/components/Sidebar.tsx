import { useState } from 'react';
import { FileInfo, ConversionType } from '../types';
import Logo from './Logo';
import Button from './Button';
import FileList from './FileList';

interface SidebarProps {
  selectedFiles: FileInfo[];
  setSelectedFiles: (files: FileInfo[]) => void;
  setCurrentPreview: (path: string | null) => void;
  isConverting: boolean;
  setIsConverting: (converting: boolean) => void;
}

const Sidebar = ({ 
  selectedFiles, 
  setSelectedFiles, 
  setCurrentPreview,
  isConverting,
  setIsConverting 
}: SidebarProps) => {
  
  const handleSelectFolder = async () => {
    // @ts-ignore - Electron API
    const result = await window.require('electron').remote.dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const fs = window.require('fs');
      const path = window.require('path');
      const folderPath = result.filePaths[0];
      
      const files = fs.readdirSync(folderPath);
      const supportedExtensions = ['.png', '.tga', '.ozt', '.ozj', '.ozb', '.ozd'];
      
      const fileInfos: FileInfo[] = files
        .filter((file: string) => {
          const ext = path.extname(file).toLowerCase();
          return supportedExtensions.includes(ext);
        })
        .map((file: string) => {
          const filePath = path.join(folderPath, file);
          const stats = fs.statSync(filePath);
          return {
            path: filePath,
            name: file,
            extension: path.extname(file).toLowerCase(),
            size: stats.size
          };
        });
      
      setSelectedFiles(fileInfos);
    }
  };

  const handleConversion = async (type: ConversionType) => {
    setIsConverting(true);
    
    try {
      const { convertFiles } = await import('../utils/converter');
      await convertFiles({
        type,
        files: selectedFiles,
        preserveAlpha: true
      });
      
      // Recarregar lista de arquivos
      // TODO: Implementar recarga
      
    } catch (error) {
      console.error('Erro na conversão:', error);
      alert(`Erro na conversão: ${error}`);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="w-80 glass rounded-2xl p-4 flex flex-col animate-fade-in">
      {/* Logo */}
      <Logo />
      
      {/* Separador sutil */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent my-2" />
      
      {/* Botões de ação */}
      <div className="flex flex-col gap-3">
        <Button 
          onClick={handleSelectFolder}
          disabled={isConverting}
        >
          Selecionar Pasta
        </Button>
        
        <Button 
          onClick={() => handleConversion('PNG_TO_TGA')}
          disabled={isConverting || selectedFiles.length === 0}
        >
          PNG → TGA
        </Button>
        
        <Button 
          onClick={() => handleConversion('TGA_TO_PNG')}
          disabled={isConverting || selectedFiles.length === 0}
        >
          TGA → PNG
        </Button>
        
        <Button 
          onClick={() => handleConversion('PNG_TO_OZT')}
          disabled={isConverting || selectedFiles.length === 0}
        >
          PNG → OZT
        </Button>
        
        <Button 
          onClick={() => handleConversion('OZJ_TO_JPG')}
          disabled={isConverting || selectedFiles.length === 0}
        >
          OZJ → JPG
        </Button>
        
        <Button 
          onClick={() => handleConversion('OZT_TO_TGA')}
          disabled={isConverting || selectedFiles.length === 0}
        >
          OZT → TGA
        </Button>
      </div>
      
      {/* Lista de arquivos */}
      <FileList 
        files={selectedFiles}
        onFileSelect={setCurrentPreview}
      />
    </div>
  );
};

export default Sidebar;
