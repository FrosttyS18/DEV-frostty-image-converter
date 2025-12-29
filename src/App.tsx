import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import BackgroundEffect from './components/BackgroundEffect';
import CustomTitlebar from './components/CustomTitlebar';
import Toast from './components/Toast';
import { useConversion } from './hooks/useConversion';
import { useGlowPointer } from './hooks/useGlowPointer';
import { electronService } from './services/electronService';
import { ConversionType, FileInfo } from './types';

function App() {
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showInfoToast, setShowInfoToast] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [currentConversionType, setCurrentConversionType] = useState<ConversionType | null>(null);
  const [hasLoadedFilesBefore, setHasLoadedFilesBefore] = useState(false);
  
  // Spotlight effect
  useGlowPointer();
  
  // Hook de conversao
  const { 
    isConverting, 
    error: conversionError, 
    successMessage,
    convert 
  } = useConversion();
  
  // Escuta selecao de arquivo da janela de lista
  useEffect(() => {
    const handleFileSelected = (filePath: string) => {
      console.log('[App] Arquivo selecionado:', filePath);
      setCurrentPreview(filePath);
    };
    
    if (window.electronAPI && window.electronAPI.onFileSelected) {
      window.electronAPI.onFileSelected(handleFileSelected);
    }
  }, []);
  
  // Funcao para selecionar pasta (abre janela de lista)
  const selectFolder = async () => {
    const result = await electronService.selectFolder();
    if (!result || result.canceled) return;
    
    // A janela de lista sera aberta automaticamente pelo main.js
    console.log('[App] Pasta selecionada, janela de lista aberta');
    
    // Mostra toast apropriado
    if (hasLoadedFilesBefore) {
      setInfoMessage('Lista atualizada!');
    } else {
      setInfoMessage('Pasta carregada!');
      setHasLoadedFilesBefore(true);
    }
    setShowInfoToast(true);
  };

  const handleConvert = async (type: ConversionType) => {
    if (!currentPreview) {
      setShowErrorToast(true);
      return;
    }
    
    console.log('[App] Iniciando conversao, tipo:', type);
    setCurrentConversionType(type);
    
    // Pergunta onde salvar
    const outputFolder = await electronService.selectOutputFolder();
    
    if (!outputFolder) {
      console.log('[App] Usuario cancelou selecao de pasta');
      setCurrentConversionType(null);
      return;
    }
    
    // Converte o arquivo atual do preview
    const basename = await electronService.getBasename(currentPreview);
    const ext = await electronService.getExtension(currentPreview);
    const stats = await electronService.getFileStats(currentPreview);
    
    const fileToConvert: FileInfo = {
      name: basename,
      path: currentPreview,
      size: stats.size,
      extension: ext
    };
    
    console.log('[App] Convertendo arquivo:', fileToConvert.name);
    await convert(type, [fileToConvert], outputFolder);
    setCurrentConversionType(null);
  };

  // Controla toasts
  useEffect(() => {
    if (successMessage) setShowSuccessToast(true);
  }, [successMessage]);

  useEffect(() => {
    if (conversionError) setShowErrorToast(true);
  }, [conversionError]);

  return (
    <div className="relative w-screen h-screen overflow-hidden rounded-[14px] border border-white/5">
      {/* Barra de título customizada */}
      <CustomTitlebar />
      
      {/* Background com efeito */}
      <BackgroundEffect />
      
      {/* Container principal */}
      <div className="relative z-10 flex h-full pt-12 px-8 pb-8 gap-8">
        {/* Sidebar */}
        <Sidebar 
          onSelectFolder={selectFolder}
          onConvert={handleConvert}
          isConverting={isConverting}
          currentConversionType={currentConversionType}
          hasFiles={currentPreview !== null}
        />
        
        {/* Canvas Visualizador */}
        <Canvas 
          currentPreview={currentPreview}
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
          message={conversionError || (!currentPreview ? 'Selecione um arquivo primeiro' : 'Erro desconhecido')}
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
