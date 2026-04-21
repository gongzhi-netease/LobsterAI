import React, { useCallback, useEffect,useRef, useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
  delay?: number;
  maxWidth?: string;
  disabled?: boolean;
}

const TOOLTIP_VIEWPORT_MARGIN = 8;
const HIDE_DELAY = 50;

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className = '',
  position = 'bottom',
  delay = 400,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [resolvedPosition, setResolvedPosition] = useState(position);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Keep resolvedPosition in sync when the prop changes while tooltip is hidden
  useEffect(() => {
    if (!isVisible) {
      setResolvedPosition(position);
    }
  }, [position, isVisible]);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    // Cancel any pending hide so rapid leave→enter doesn't flicker
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    showTimeoutRef.current = setTimeout(() => {
      // Detect available space and decide direction before showing
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        // Estimate tooltip height (will be refined after mount, but avoids initial wrong frame)
        const estimatedHeight = 60;
        if (position === 'bottom' && spaceBelow < estimatedHeight + TOOLTIP_VIEWPORT_MARGIN && spaceAbove > spaceBelow) {
          setResolvedPosition('top');
        } else if (position === 'top' && spaceAbove < estimatedHeight + TOOLTIP_VIEWPORT_MARGIN && spaceBelow > spaceAbove) {
          setResolvedPosition('bottom');
        } else {
          setResolvedPosition(position);
        }
      }
      setIsVisible(true);
    }, delay);
  }, [delay, disabled, position]);

  const hideTooltip = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    // Small delay before hiding to prevent flicker from layout reflows
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, HIDE_DELAY);
  }, []);

  // Re-check position after tooltip mounts (accurate measurement)
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (resolvedPosition === 'bottom' && tooltipRect.height + TOOLTIP_VIEWPORT_MARGIN > spaceBelow && spaceAbove > spaceBelow) {
      setResolvedPosition('top');
    } else if (resolvedPosition === 'top' && tooltipRect.height + TOOLTIP_VIEWPORT_MARGIN > spaceAbove && spaceBelow > spaceAbove) {
      setResolvedPosition('bottom');
    }
  }, [isVisible, resolvedPosition]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      className={`relative ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <div
          ref={tooltipRef}
          className={`absolute z-[100] px-2 py-1 text-xs rounded shadow-lg
            bg-gray-800 text-white
            pointer-events-none whitespace-pre-wrap
            left-0 right-0
            ${resolvedPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;