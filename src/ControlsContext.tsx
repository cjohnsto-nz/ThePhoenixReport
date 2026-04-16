import { createContext, useContext, useState } from 'react';

interface ControlsContextType {
  isPopped: boolean;
  setIsPopped: (v: boolean) => void;
}

const ControlsContext = createContext<ControlsContextType>({
  isPopped: false,
  setIsPopped: () => {},
});

export function ControlsProvider({ children }: { children: React.ReactNode }) {
  const [isPopped, setIsPopped] = useState(false);
  return (
    <ControlsContext.Provider value={{ isPopped, setIsPopped }}>
      {children}
    </ControlsContext.Provider>
  );
}

export function useControls() {
  return useContext(ControlsContext);
}
