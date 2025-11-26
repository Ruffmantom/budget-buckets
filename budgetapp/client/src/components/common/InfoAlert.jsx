import React from "react";
import PropTypes from "prop-types";

function InfoAlert({ message }) {
  return (
    <div className="mt-2 p-4 bg-blue-200 border-1 border-blue-600 rounded-md max-w-xl">
      <div
        className={`inline-flex cursor-default h-[20px] w-[20px] text-sm bg-blue-200 border-1 border-blue-600 rounded-xl flex flex-col items-center justify-center relative`}
      >
        <span className="italic mr-[2px] text-blue-600">i</span>
      </div>
      <span className="text-blue-600 ml-2">{message}</span>
    </div>
  );
}

InfoAlert.propTypes = {
  message: PropTypes.string.isRequired,
};

export default InfoAlert;
