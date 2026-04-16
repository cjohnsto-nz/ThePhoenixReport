import { createContext, useContext, useEffect, useState } from 'react';

const CONTROLS_POPPED_STORAGE_KEY = 'phoenix-report-controls-popped';

function loadInitialIsPopped() {
  if (typeof window === 'undefined') return false;

  try {
    return window.sessionStorage.getItem(CONTROLS_POPPED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

interface ControlsContextType {
  isPopped: boolean;
  setIsPopped: (v: boolean) => void;
}

const ControlsContext = createContext<ControlsContextType>({
  isPopped: false,
  setIsPopped: () => {},
});

export function ControlsProvider({ children }: { children: React.ReactNode }) {
  const [isPopped, setIsPopped] = useState(loadInitialIsPopped);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (isPopped) {
        window.sessionStorage.setItem(CONTROLS_POPPED_STORAGE_KEY, '1');
      } else {
        window.sessionStorage.removeItem(CONTROLS_POPPED_STORAGE_KEY);
      }
    } catch {
      // Ignore sessionStorage failures and fall back to in-memory state.
    }
  }, [isPopped]);

  return (
    <ControlsContext.Provider value={{ isPopped, setIsPopped }}>
      {children}
    </ControlsContext.Provider>
  );
}

export function useControls() {
  return useContext(ControlsContext);
}
