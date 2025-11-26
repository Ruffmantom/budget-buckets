import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const TooltipV2 = ({ label, children, offset = 8 }) => {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState({});
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const calculatePosition = () => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default to top
    let top = triggerRect.top - tooltipRect.height - offset;
    let left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
    let placement = "top";

    // Check overflow and adjust
    if (top < 0) {
      top = triggerRect.bottom + offset;
      placement = "bottom";
    }
    if (left < 0) {
      left = offset;
      placement = "right";
    } else if (left + tooltipRect.width > vw) {
      left = vw - tooltipRect.width - offset;
      placement = "left";
    }

    setStyle({
      top: `${top + window.scrollY}px`,
      left: `${left + window.scrollX}px`,
      opacity: 1,
      transform:
        placement === "top"
          ? "translateY(-4px)"
          : placement === "bottom"
          ? "translateY(4px)"
          : "translateX(4px)",
    });
  };

  useEffect(() => {
    if (!visible) return;
    calculatePosition();
    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition, true);
    return () => {
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition, true);
    };
  }, [visible]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{ display: "inline-block" }}
      >
        {children}
      </span>

      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            className="text-xs px-1 py-0.5 bg-stone-50 shadow-2xs rounded-sm absolute whitespace-nowrap"
            style={{
              pointerEvents: "none",
              transition: "opacity 0.15s ease, transform 0.15s ease",
              opacity: 0,
              zIndex: 9999,
              ...style,
            }}
          >
            {label}
          </div>,
          document.body
        )}
    </>
  );
};

export default TooltipV2;
