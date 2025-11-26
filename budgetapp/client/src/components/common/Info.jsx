import React from "react";
import PropTypes from "prop-types";

function Info({ hover = false }) {
  return (
    <div className={`inline-flex cursor-default ${hover && "hover:border-stone-400"} h-[20px] w-[20px] text-sm block bg-stone-100 border-1 border-stone-200 rounded-xl flex flex-col items-center justify-center relative`}>
      <span className="italic mr-[2px]">i</span>
    </div>
  );
}

Info.propTypes = {
  hover: PropTypes.bool,
};

export default Info;
