import { createContext, useContext, useEffect, useState } from 'react';

const CONTROLS_POPPED_STORAGE_KEY = 'ai-offsite-controls-popped';

function loadIsPopped() {
  if (typeof window === 'undefined') return false;

  try {
    return window.sessionStorage.getItem(CONTROLS_POPPED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

interface ControlsContextType {
  isPopped: boolean;
  setIsPopped: (value: boolean) => void;
}

const ControlsContext = createContext<ControlsContextType>({
  isPopped: false,
  setIsPopped: () => {},
});

export function ControlsProvider({ children }: { children: React.ReactNode }) {
  const [isPopped, setIsPopped] = useState(loadIsPopped);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (isPopped) {
        window.sessionStorage.setItem(CONTROLS_POPPED_STORAGE_KEY, '1');
      } else {
        window.sessionStorage.removeItem(CONTROLS_POPPED_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures and keep in-memory state.
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
