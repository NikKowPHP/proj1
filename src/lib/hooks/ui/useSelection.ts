import { useState, useEffect, useCallback, RefObject, useRef } from "react";

interface SelectionState {
  isVisible: boolean;
  selectedText: string;
  contextText: string;
  position: { x: number; y: number };
  close: () => void;
}

interface SelectionOptions {
  disableTapToSelect?: boolean;
}

export const useSelection = <T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  options: SelectionOptions = {},
): SelectionState => {
  const { disableTapToSelect = false } = options;
  const [isVisible, setIsVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [contextText, setContextText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  const close = useCallback(() => {
    setIsVisible(false);
    setSelectedText("");
    setContextText("");
    setTimeout(() => {
      window.getSelection()?.removeAllRanges();
    }, 100);
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
      }
    };

    const handleSelect = (event: MouseEvent | TouchEvent) => {
      // Prevent closing when clicking inside the tooltip itself.
      const tooltip = document.querySelector('[role="tooltip"]');
      if (tooltip && event.target && tooltip.contains(event.target as Node)) {
        return;
      }

      const selection = window.getSelection();
      let text = selection?.toString().trim();
      let range: Range | null = null;
      let isTap = false;

      if (
        event.type === "touchend" &&
        "changedTouches" in event &&
        touchStartRef.current
      ) {
        const touchEnd = event.changedTouches[0];
        const touchStart = touchStartRef.current;
        const distance = Math.sqrt(
          Math.pow(touchEnd.clientX - touchStart.x, 2) +
            Math.pow(touchEnd.clientY - touchStart.y, 2),
        );
        const duration = Date.now() - touchStart.time;

        if (duration < 300 && distance < 10) {
          isTap = true;
        }
        touchStartRef.current = null; // Reset for next touch
      }

      // If it's a collapsed selection (a click/tap without selecting text) AND it's not
      // a specific tap gesture intended to select a word, then we should either close
      // an existing tooltip or do nothing.
      if (selection?.isCollapsed && !isTap) {
        if (isVisible) {
          close();
        }
        return; // Prevent tooltip from appearing on simple clicks.
      }

      // If there's no text selection AND it was a tap, create a selection.
      if (
        !disableTapToSelect &&
        !text &&
        isTap &&
        "changedTouches" in event &&
        container.contains(event.target as Node)
      ) {
        const touch = event.changedTouches[0];
        if (document.caretRangeFromPoint) {
          range = document.caretRangeFromPoint(touch.clientX, touch.clientY);
          if (range && selection) {
            selection.removeAllRanges();
            selection.addRange(range);
            // `modify` is non-standard but widely supported on mobile for this purpose
            selection.modify("move", "backward", "word");
            selection.modify("extend", "forward", "word");
            text = selection.toString().trim();
            if (selection.rangeCount > 0) {
              range = selection.getRangeAt(0);
            }
          }
        }
      }

      // Check if the selection is valid and within our target container.
      if (
        text &&
        selection?.rangeCount &&
        selection.anchorNode &&
        container.contains(selection.anchorNode)
      ) {
        // NEW CHECK: Only activate if the selection is inside an element marked as selectable
        let parent = selection.anchorNode.parentElement;
        let isSelectable = false;
        while (parent && container.contains(parent)) {
          if (parent.classList.contains("cursor-help")) {
            isSelectable = true;
            break;
          }
          parent = parent.parentElement;
        }

        if (!isSelectable) {
          if (isVisible) close();
          return;
        }

        // Don't show tooltip for empty or single-character selections from taps
        if (text.length <= 1 && isTap) {
          close();
          return;
        }

        range = range || selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelectedText(text);

        // Get the full text content of the parent element as context
        const anchorNode = selection.anchorNode;
        if (anchorNode && anchorNode.parentElement) {
          setContextText(anchorNode.parentElement.textContent || "");
        } else {
          setContextText(text); // Fallback to just the selected text
        }

        // --- Viewport-aware positioning logic ---
        const viewportWidth = window.innerWidth;
        const tooltipWidth = 256; // w-64 from TailwindCSS
        const padding = 8; // 8px padding from screen edges

        // Desired center position for the tooltip
        let newX = rect.left + rect.width / 2;
        const newY = rect.bottom + 8; // 8px offset below selection

        // Calculate the left and right edges of the tooltip if centered at newX
        const tooltipLeftEdge = newX - tooltipWidth / 2;
        const tooltipRightEdge = newX + tooltipWidth / 2;

        // Adjust X if it overflows the viewport
        if (tooltipLeftEdge < padding) {
          // Overflowing the left side, push it right
          newX = tooltipWidth / 2 + padding;
        } else if (tooltipRightEdge > viewportWidth - padding) {
          // Overflowing the right side, push it left
          newX = viewportWidth - tooltipWidth / 2 - padding;
        }

        setPosition({
          x: newX,
          y: newY,
        });

        setIsVisible(true);
      } else if (isVisible) {
        // If there's no valid selection but the tooltip is visible, close it.
        close();
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      const selection = window.getSelection()?.toString().trim();
      if (selection) {
        event.preventDefault();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mouseup", handleSelect);
    document.addEventListener("touchend", handleSelect);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mouseup", handleSelect);
      document.removeEventListener("touchend", handleSelect);
    };
  }, [containerRef, close, isVisible, containerRef.current, disableTapToSelect]);

  return { isVisible, selectedText, contextText, position, close };
};