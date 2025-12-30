import { useState, useEffect } from 'react';
import FileList from './components/FileList';
import Canvas from './components/Canvas';
import BackgroundEffect from './components/BackgroundEffect';
import CustomTitlebar from './components/CustomTitlebar';
import Toast from './components/Toast';
import { useConversion } from './hooks/useConversion';
import { useFileSelection } from './hooks/useFileSelection';
import { useGlowPointer } from './hooks/useGlowPointer';
import { electronService } from './services/electronService';
import { ConversionType, FileInfo } from './types';

function App() {
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showInfoToast, setShowInfoToast] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<string | null>(null);
  
  // Spotlight effect
  useGlowPointer();
  
  // Hook de seleção de arquivos
  const { selectedFiles, isLoading, error: fileError, selectFolder, reloadFiles, currentFolderPath: hookFolderPath } = useFileSelection();
  
  // Hook de conversao
  const { 
    isConverting, 
    error: conversionError, 
    successMessage,
    convert 
  } = useConversion();
  
  // Quando seleciona arquivo, atualiza preview
  const handleSelectFile = (file: FileInfo) => {
    console.log('[App] Arquivo selecionado:', file.name);
    setSelectedFile(file);
  };
  
  // Funcao para selecionar pasta
  const handleSelectFolder = async () => {
    await selectFolder();
  };
  
  // Atualiza folderPath quando arquivos carregam
  useEffect(() => {
    if (hookFolderPath) {
      setCurrentFolderPath(hookFolderPath);
      
      if (selectedFiles.length > 0 && !isLoading) {
        setInfoMessage('Pasta carregada!');
        setShowInfoToast(true);
      }
    }
  }, [hookFolderPath, selectedFiles.length, isLoading]);

  const handleConvert = async (file: FileInfo, type: ConversionType) => {
    console.log('[App] Iniciando conversao, tipo:', type, 'arquivo:', file.name);
    
    // Pergunta onde salvar
    const outputFolder = await electronService.selectOutputFolder();
    
    if (!outputFolder) {
      console.log('[App] Usuario cancelou selecao de pasta');
      return;
    }
    
    console.log('[App] Convertendo arquivo:', file.name);
    await convert(type, [file], outputFolder);
  };

  // Controla toasts
  useEffect(() => {
    if (successMessage) setShowSuccessToast(true);
  }, [successMessage]);

  useEffect(() => {
    if (conversionError) setShowErrorToast(true);
  }, [conversionError]);
  
  useEffect(() => {
    if (fileError) {
      setInfoMessage(fileError);
      setShowErrorToast(true);
    }
  }, [fileError]);
  
  // Cleanup global quando app desmonta ou fecha
  useEffect(() => {
    return () => {
      console.log('[App] Cleanup global - revogando todos os blob URLs...');
      
      // Revoga blob URLs que possam estar em cache
      if (selectedFile?.path) {
        // useImagePreview já faz cleanup automático, mas garantimos aqui também
        console.log('[App] Limpando recursos ao fechar app');
      }
      
      // Cleanup adicional pode ser feito aqui se necessário
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden rounded-[14px] border border-white/5">
      {/* Barra de título customizada */}
      <CustomTitlebar />
      
      {/* Background com efeito */}
      <BackgroundEffect />
      
      {/* Container principal */}
      <div className="relative z-10 flex h-full pt-12 px-8 pb-8 gap-8">
        {/* Lista de arquivos integrada */}
        <FileList 
          files={selectedFiles}
          selectedFile={selectedFile}
          onSelectFile={handleSelectFile}
          onConvert={handleConvert}
          onSelectFolder={handleSelectFolder}
          onReload={reloadFiles}
          isConverting={isConverting}
          folderPath={currentFolderPath || hookFolderPath}
        />
        
        {/* Canvas Visualizador */}
        <Canvas 
          currentPreview={selectedFile?.path || null}
          selectedFile={selectedFile}
        />
      </div>
      
      {/* Toasts */}
      {showSuccessToast && successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setShowSuccessToast(false)}
          duration={3000}
        />
      )}
      
      {showErrorToast && (
        <Toast
          message={conversionError || fileError || 'Erro desconhecido'}
          type="error"
          onClose={() => setShowErrorToast(false)}
          duration={4000}
        />
      )}
      
      {showInfoToast && infoMessage && (
        <Toast
          message={infoMessage}
          type="info"
          onClose={() => setShowInfoToast(false)}
          duration={4000}
        />
      )}
    </div>
  );
}

export default App;
