import { createContext, useContext, useEffect, useState } from 'react';

const CONTROLS_POPPED_STORAGE_KEY = 'phoenix-report-controls-popped';
const CARD_LEGIBILITY_STORAGE_KEY = 'phoenix-report-card-legibility';

function loadInitialIsPopped() {
  if (typeof window === 'undefined') return false;

  try {
    return window.sessionStorage.getItem(CONTROLS_POPPED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function loadInitialIsCardLegibilityMode() {
  if (typeof window === 'undefined') return false;

  try {
    return window.sessionStorage.getItem(CARD_LEGIBILITY_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

interface ControlsContextType {
  isPopped: boolean;
  setIsPopped: (v: boolean) => void;
  isCardLegibilityMode: boolean;
  setIsCardLegibilityMode: (v: boolean) => void;
}

const ControlsContext = createContext<ControlsContextType>({
  isPopped: false,
  setIsPopped: () => {},
  isCardLegibilityMode: false,
  setIsCardLegibilityMode: () => {},
});

export function ControlsProvider({ children }: { children: React.ReactNode }) {
  const [isPopped, setIsPopped] = useState(loadInitialIsPopped);
  const [isCardLegibilityMode, setIsCardLegibilityMode] = useState(loadInitialIsCardLegibilityMode);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (isCardLegibilityMode) {
        window.sessionStorage.setItem(CARD_LEGIBILITY_STORAGE_KEY, '1');
      } else {
        window.sessionStorage.removeItem(CARD_LEGIBILITY_STORAGE_KEY);
      }
    } catch {
      // Ignore sessionStorage failures and fall back to in-memory state.
    }
  }, [isCardLegibilityMode]);

  return (
    <ControlsContext.Provider value={{ isPopped, setIsPopped, isCardLegibilityMode, setIsCardLegibilityMode }}>
      {children}
    </ControlsContext.Provider>
  );
}

export function useControls() {
  return useContext(ControlsContext);
}
