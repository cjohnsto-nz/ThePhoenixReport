import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface WindowPortalProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  width?: number;
  height?: number;
}

/**
 * Opens a new browser window and renders children into it via a React portal.
 * The new window shares the same React tree, so all state/context works normally.
 * Stylesheets are cloned from the parent document so Tailwind classes apply.
 */
export function WindowPortal({
  children,
  onClose,
  title = 'Controls',
  width = 1100,
  height = 160,
}: WindowPortalProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const popupRef = useRef<Window | null>(null);
  const shouldCloseOnUnmountRef = useRef(true);

  useEffect(() => {
    shouldCloseOnUnmountRef.current = true;

    const screenX = window.screenX ?? window.screenLeft ?? 0;
    const screenY = (window.screenY ?? window.screenTop ?? 0) + window.outerHeight - height - 80;

    const popup = window.open(
      '',
      'phoenixControls',
      [
        `width=${width}`,
        `height=${height}`,
        `left=${screenX}`,
        `top=${screenY}`,
        'toolbar=no',
        'menubar=no',
        'location=no',
        'status=no',
        'scrollbars=no',
        'resizable=yes',
      ].join(','),
    );

    if (!popup) {
      // Popup was blocked — notify caller
      onClose();
      return;
    }

    popupRef.current = popup;
    popup.document.title = title;

    const handleParentBeforeUnload = () => {
      // Keep the popup alive across parent-window reloads/HMR cycles.
      shouldCloseOnUnmountRef.current = false;
    };

    window.addEventListener('beforeunload', handleParentBeforeUnload);

    // ── Copy styles from parent so Tailwind classes work ──
    const copyStyles = () => {
      // Link stylesheets
      document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        if (!popup.document.head.contains(popup.document.querySelector(`link[href="${(link as HTMLLinkElement).href}"]`))) {
          popup.document.head.appendChild(link.cloneNode(true));
        }
      });
      // Inline <style> blocks (Vite dev mode injects these)
      document.querySelectorAll('style').forEach((style) => {
        const cloned = style.cloneNode(true) as HTMLStyleElement;
        popup.document.head.appendChild(cloned);
      });
    };

    copyStyles();

    // Watch parent for new style injections (HMR during dev)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (
            (node as HTMLElement).tagName === 'STYLE' ||
            ((node as HTMLElement).tagName === 'LINK' &&
              (node as HTMLLinkElement).rel === 'stylesheet')
          ) {
            popup.document.head.appendChild(node.cloneNode(true));
          }
        });
      });
    });
    observer.observe(document.head, { childList: true });

    // Base styles on the popup body
    popup.document.body.style.margin = '0';
    popup.document.body.style.padding = '0';
    popup.document.body.style.background = '#060912';
    popup.document.body.style.overflow = 'hidden';
    popup.document.body.style.fontFamily = 'Inter, system-ui, sans-serif';

    const existingRoot = popup.document.getElementById('portal-root') as HTMLElement | null;
    const div = existingRoot ?? popup.document.createElement('div');
    div.id = 'portal-root';
    div.replaceChildren();
    if (!existingRoot) {
      popup.document.body.appendChild(div);
    }
    setContainer(div);

    const handleClose = () => {
      observer.disconnect();
      onClose();
    };

    popup.addEventListener('beforeunload', handleClose);

    return () => {
      observer.disconnect();
      popup.removeEventListener('beforeunload', handleClose);
      window.removeEventListener('beforeunload', handleParentBeforeUnload);
      if (shouldCloseOnUnmountRef.current && !popup.closed) popup.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!container) return null;
  return createPortal(children, container);
}
