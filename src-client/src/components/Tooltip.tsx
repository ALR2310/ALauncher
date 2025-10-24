import { ReactNode, useRef } from 'react';

import { useTooltipContext } from '~/hooks/app/useTooltip';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  placement?: Placement;
  offset?: number;
}

export default function Tooltip({ content, children, className = '', placement = 'top', offset = 6 }: TooltipProps) {
  const { show, hide } = useTooltipContext();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={`inline-block ${className}`}
      onMouseEnter={() => {
        if (ref.current) show({ content, target: ref.current, placement, offset });
      }}
      onMouseLeave={hide}
    >
      {children}
    </div>
  );
}
