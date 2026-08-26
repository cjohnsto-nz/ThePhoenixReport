import { createContext, useContext, useEffect, useState } from 'react';

const CONTROLS_POPPED_STORAGE_KEY = 'ai-offsite-controls-popped';
const EXPORT_ZOOM_STORAGE_KEY = 'ai-offsite-export-zoom-percent';
const EXPORT_ASPECT_RATIO_STORAGE_KEY = 'ai-offsite-export-aspect-ratio';
export const DEFAULT_EXPORT_ZOOM_PERCENT = 100;
export const MIN_EXPORT_ZOOM_PERCENT = 70;
export const MAX_EXPORT_ZOOM_PERCENT = 110;
export const EXPORT_ASPECT_RATIOS = ['16:9', '16:10', '3:2', '4:3'] as const;
export type ExportAspectRatio = typeof EXPORT_ASPECT_RATIOS[number];
export const DEFAULT_EXPORT_ASPECT_RATIO: ExportAspectRatio = '16:9';

function clampExportZoom(value: number) {
  return Math.max(MIN_EXPORT_ZOOM_PERCENT, Math.min(MAX_EXPORT_ZOOM_PERCENT, value));
}

function loadIsPopped() {
  if (typeof window === 'undefined') return false;

  try {
    return window.sessionStorage.getItem(CONTROLS_POPPED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function loadExportZoomPercent() {
  if (typeof window === 'undefined') return DEFAULT_EXPORT_ZOOM_PERCENT;

  try {
    const raw = window.localStorage.getItem(EXPORT_ZOOM_STORAGE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_EXPORT_ZOOM_PERCENT;
    return Number.isFinite(parsed) ? clampExportZoom(parsed) : DEFAULT_EXPORT_ZOOM_PERCENT;
  } catch {
    return DEFAULT_EXPORT_ZOOM_PERCENT;
  }
}

function isExportAspectRatio(value: string | null): value is ExportAspectRatio {
  return EXPORT_ASPECT_RATIOS.includes(value as ExportAspectRatio);
}

function loadExportAspectRatio() {
  if (typeof window === 'undefined') return DEFAULT_EXPORT_ASPECT_RATIO;

  try {
    const raw = window.localStorage.getItem(EXPORT_ASPECT_RATIO_STORAGE_KEY);
    return isExportAspectRatio(raw) ? raw : DEFAULT_EXPORT_ASPECT_RATIO;
  } catch {
    return DEFAULT_EXPORT_ASPECT_RATIO;
  }
}

interface ControlsContextType {
  isPopped: boolean;
  setIsPopped: (value: boolean) => void;
  exportZoomPercent: number;
  setExportZoomPercent: (value: number) => void;
  exportAspectRatio: ExportAspectRatio;
  setExportAspectRatio: (value: ExportAspectRatio) => void;
}

const ControlsContext = createContext<ControlsContextType>({
  isPopped: false,
  setIsPopped: () => {},
  exportZoomPercent: DEFAULT_EXPORT_ZOOM_PERCENT,
  setExportZoomPercent: () => {},
  exportAspectRatio: DEFAULT_EXPORT_ASPECT_RATIO,
  setExportAspectRatio: () => {},
});

export function ControlsProvider({ children }: { children: React.ReactNode }) {
  const [isPopped, setIsPopped] = useState(loadIsPopped);
  const [exportZoomPercent, setExportZoomPercent] = useState(loadExportZoomPercent);
  const [exportAspectRatio, setExportAspectRatio] = useState(loadExportAspectRatio);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(EXPORT_ZOOM_STORAGE_KEY, String(exportZoomPercent));
    } catch {
      // Ignore storage failures and keep in-memory state.
    }
  }, [exportZoomPercent]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(EXPORT_ASPECT_RATIO_STORAGE_KEY, exportAspectRatio);
    } catch {
      // Ignore storage failures and keep in-memory state.
    }
  }, [exportAspectRatio]);

  return (
    <ControlsContext.Provider
      value={{
        isPopped,
        setIsPopped,
        exportZoomPercent,
        setExportZoomPercent: (value) => setExportZoomPercent(clampExportZoom(value)),
        exportAspectRatio,
        setExportAspectRatio,
      }}
    >
      {children}
    </ControlsContext.Provider>
  );
}

export function useControls() {
  return useContext(ControlsContext);
}
