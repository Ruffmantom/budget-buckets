import React from "react";
import PropTypes from "prop-types";

function ButtonAction({
  label,
  extraStyles,
  width = "full",
  textAlign = "center",
  cta,
  action,
  children,
}) {
  return (
    <button
      onClick={action}
      className={`px-4 py-2 cursor-pointer rounded-sm outline-0 w-${width} text-${textAlign} ${cta ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-stone-100 hover:bg-stone-200 text-stone-800"} ${extraStyles?  extraStyles:""}`}
    >
      {label ? label : children}
    </button>
  );
}

ButtonAction.propTypes = {
  label: PropTypes.string.isRequired,
  extraStyles: PropTypes.string,
  width: PropTypes.string,
  textAlign: PropTypes.oneOf(["center", "right", "justify"]),
  cta: PropTypes.bool,
  action: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default ButtonAction;
