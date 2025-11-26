import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

function Tooltip({ label, posX = "left", posY = "center", children }) {
  const [isHovering, setIsHovering] = useState(false);
  const [positionX, setPositionX] = useState(posX);
  const [positionY, setPositionY] = useState(posY);
  const toolTipRef = useRef(null);

  function checkTooltipY(element, currentYpos) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    if (rect.bottom > viewportHeight) return "top";
    if (rect.top < 0) return "bottom";
    return currentYpos;
  }

  function checkTooltipX(element, currentXpos) {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    if (rect.right > viewportWidth) return "left";
    if (rect.left < 0) return "right";
    return currentXpos;
  }

useEffect(() => {
  if (!isHovering) return;

  let corrected = false; // <-- Prevent multiple flips per hover

  const updatePosition = () => {
    if (!toolTipRef.current || corrected) return;

    const newX = checkTooltipX(toolTipRef.current, posX);
    const newY = checkTooltipY(toolTipRef.current, posY);

    // Only update if changed
    if (newX !== positionX || newY !== positionY) {
      setPositionX(newX);
      setPositionY(newY);
      corrected = true; // <-- lock correction for this hover session
    }
  };

  // Run once after tooltip has rendered
  const timeout = setTimeout(updatePosition, 0);

  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);

  return () => {
    clearTimeout(timeout);
    window.removeEventListener("resize", updatePosition);
    window.removeEventListener("scroll", updatePosition, true);
  };
}, [isHovering, posX, posY]);

useEffect(() => {
  if (!isHovering) {
    setPositionX(posX);
    setPositionY(posY);
  }
}, [isHovering, posX, posY]);

  const tooltipClass = `
    text-xs px-1 py-0.5 bg-stone-50 shadow-2xs rounded-sm tool_tip
    ${positionX === "left" ? "ttl" : positionX === "right" ? "ttr" : "ttlc"}
    ${positionY === "top" ? "ttt" : positionY === "bottom" ? "ttb" : "tttc"}
  `;

  return (
    <div
      className={`${isHovering && "active_tooltip"} w-fit`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
      {isHovering && (
        <p ref={toolTipRef} className={tooltipClass}>
          {label}
        </p>
      )}
    </div>
  );
}

Tooltip.propTypes = {
  label: PropTypes.string.isRequired,
  posX: PropTypes.oneOf(["left", "right", "center"]),
  posY: PropTypes.oneOf(["top", "bottom", "center"]),
  children: PropTypes.node.isRequired,
};

export default Tooltip;
