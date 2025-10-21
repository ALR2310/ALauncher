import React, { createContext, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipData {
  content: React.ReactNode;
  x: number;
  y: number;
  visible: boolean;
}

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipContextValue {
  show: (opts: { content: React.ReactNode; target: HTMLElement; placement?: Placement; offset?: number }) => void;
  hide: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [tooltip, setTooltip] = useState<TooltipData>({
    content: null,
    x: 0,
    y: 0,
    visible: false,
  });

  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((target: HTMLElement, placement: Placement = 'top', offset = 6) => {
    const rect = target.getBoundingClientRect();
    const tt = tooltipRef.current;
    if (!tt) return;

    const ttRect = tt.getBoundingClientRect();
    let x = 0,
      y = 0;

    switch (placement) {
      case 'top':
        x = rect.left + rect.width / 2 - ttRect.width / 2;
        y = rect.top - ttRect.height - offset;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2 - ttRect.width / 2;
        y = rect.bottom + offset;
        break;
      case 'left':
        x = rect.left - ttRect.width - offset;
        y = rect.top + rect.height / 2 - ttRect.height / 2;
        break;
      case 'right':
        x = rect.right + offset;
        y = rect.top + rect.height / 2 - ttRect.height / 2;
        break;
    }

    const pad = 8;
    x = Math.max(pad, Math.min(x, window.innerWidth - ttRect.width - pad));
    y = Math.max(pad, Math.min(y, window.innerHeight - ttRect.height - pad));

    setTooltip((prev) => ({ ...prev, x, y }));
  }, []);

  const show = useCallback(
    ({ content, target, placement, offset }: Parameters<TooltipContextValue['show']>[0]) => {
      setTooltip({ content, x: 0, y: 0, visible: true });
      requestAnimationFrame(() => {
        updatePosition(target, placement, offset);
        requestAnimationFrame(() => updatePosition(target, placement, offset));
      });
    },
    [updatePosition],
  );

  const hide = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  // Update position on scroll/resize
  useLayoutEffect(() => {
    const handle = () => {
      if (tooltip.visible && tooltipRef.current) {
        const el = document.elementFromPoint(tooltip.x, tooltip.y);
        if (el instanceof HTMLElement) updatePosition(el);
      }
    };
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [tooltip.visible, tooltip.x, tooltip.y, updatePosition]);

  return (
    <TooltipContext.Provider value={{ show, hide }}>
      {children}

      {createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-9999 pointer-events-none transition-all duration-150"
          style={{
            top: tooltip.y,
            left: tooltip.x,
            opacity: tooltip.visible ? 1 : 0,
            transform: tooltip.visible ? 'scale(1)' : 'scale(0.95)',
            visibility: tooltip.visible ? 'visible' : 'hidden',
          }}
        >
          <div className="tooltip-content bg-base-300 text-sm px-2 py-1 rounded shadow">{tooltip.content}</div>
        </div>,
        document.body,
      )}
    </TooltipContext.Provider>
  );
}

export { TooltipContext, TooltipProvider };
