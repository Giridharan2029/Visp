import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Orb } from './components/Orb';
import { ConversationView } from './components/ConversationView';
import { WorkspaceView } from './components/WorkspaceView';
import { ConfirmationModal } from './components/ConfirmationModal';

export const App: React.FC = () => {
  const {
    windowMode,
    orbState,
    audioLevel,
    init,
    setWindowMode,
    pendingConfirmation,
    respondToConfirmation,
  } = useAppStore();

  useEffect(() => {
    init();

    // Global keyboard hotkey listener
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Space to toggle between compact and workspace
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        const nextMode = windowMode === 'orb' ? 'conversation' : windowMode === 'conversation' ? 'workspace' : 'orb';
        setWindowMode(nextMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [windowMode]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent select-none">
      {/* 1. COMPACT ORB MODE */}
      {windowMode === 'orb' && (
        <div
          data-tauri-drag-region
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2"
          onClick={() => setWindowMode('conversation')}
          title="Click to open VISP (or Ctrl+Space)"
        >
          <Orb state={orbState} audioLevel={audioLevel} size={84} showStatusLabel={true} />
        </div>
      )}

      {/* 2. CONVERSATION MODE */}
      {windowMode === 'conversation' && (
        <div className="w-full h-full p-2">
          <ConversationView />
        </div>
      )}

      {/* 3. WORKSPACE DASHBOARD MODE */}
      {windowMode === 'workspace' && (
        <div className="w-full h-full">
          <WorkspaceView />
        </div>
      )}

      {/* Security Confirmation Modal */}
      <ConfirmationModal
        pending={pendingConfirmation}
        onRespond={respondToConfirmation}
      />
    </div>
  );
};

export default App;
