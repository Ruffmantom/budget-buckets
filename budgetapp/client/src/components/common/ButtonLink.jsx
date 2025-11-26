import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";

function ButtonLink({
  to,
  label,
  cta,
  width = "full",
  textAlign = "center",
  extraStyles,
}) {
  return (
    <Link
      to={to}
      className={`px-4 py-2 cursor-pointer rounded-sm w-3xs outline-0 ${textAlign === "center" ? "text-center" : textAlign === "right" ? "text-right" : "text-justify"} w-${width} ${cta ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-stone-100 hover:bg-stone-200 text-stone-800"} ${extraStyles ? extraStyles : ""}`}
    >
      {label}
    </Link>
  );
}

ButtonLink.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  extraStyles: PropTypes.string,
  cta: PropTypes.bool,
  width: PropTypes.string,
  textAlign: PropTypes.oneOf(["center", "right", "justify"]),
};

export default ButtonLink;
