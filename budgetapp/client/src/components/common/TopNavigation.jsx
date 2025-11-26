import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Tooltip from "./Tooltip";
import TooltipV2 from "./TooltipV2";

function TopNavigation({}) {
  return (
    <div className="flex justify-between items-center p-4 sticky top-0 left-0 w-full bg-white">
      <ul id="left-side-nav" className=" flex gap-2">
        <li className="">
          <TooltipV2 label={"Link One"}>
            <Link className="p-2 py-1 text-zinc-500 hover:text-zinc-950 transition">
              Link One
            </Link>
          </TooltipV2>
        </li>
        <li className="">
          <Link className="p-2 py-1 text-zinc-500 hover:text-zinc-950 transition">
            Link Two
          </Link>
        </li>
        <li className="">
          <Link className="p-2 py-1 text-zinc-500 hover:text-zinc-950 transition">
            Link Three
          </Link>
        </li>
      </ul>
      <ul id="right-side-nav" className=" flex gap-2">
        <li className="">
          <TooltipV2 label={"Link One"}>
            <Link className="p-2 py-1 text-zinc-500 hover:text-zinc-950 transition">
              Sign In
            </Link>
          </TooltipV2>
        </li>
      </ul>
    </div>
  );
}

TopNavigation.propTypes = {};

export default TopNavigation;
