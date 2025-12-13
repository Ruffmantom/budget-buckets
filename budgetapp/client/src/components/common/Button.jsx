import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import * as Icons from "../../assets/icons/icons.js";

/** Icon name union derived from your exports */
/// <reference types="react" />
/** @typedef {keyof typeof Icons} IconName */

/** String-literal unions for specific props */
/// @typedef {"left" | "right"} HelperSide
/// @typedef {"sm" | "lg"} ButtonSize

/**
 * Props for ADIconButton.
 * @typedef {Object} ButtonProps
* @property {string} [type] - If true, clicking toggles active outline.
* @property {string} [buttonLabel] - If true, clicking toggles active outline.
* @property {string} [size] - If true, clicking toggles active outline.
* @property {string} [style] - If true, clicking toggles active outline.
* @property {() => void} [action] - If true, clicking toggles active outline.
* @property {boolean} [showStartIcon] - If true, clicking toggles active outline.
* @property {boolean} [showEndIcon] - If true, clicking toggles active outline.
* @property {string} [startIcon] - If true, clicking toggles active outline.
* @property {string} [endIcon] - If true, clicking toggles active outline.
 */

/** Simple icon renderer */
const ReturnIcon = ({ icon, className }) => {
    const Icon = Icons[icon];
    return Icon ? <Icon className={className} /> : null;
};

/**
 * Icon button (props are fully typed for VS Code IntelliSense).
 * @param {ButtonProps} props
 */
const Button = ({
    type = "btn",
    buttonLabel = "Click Me",
    size = "sm",
    style = "normal",
    action = () => null,
    showStartIcon = true,
    startIcon = "",
    showEndIcon = true,
    endIcon = "",
}) => {
    const buttonSizes = {
        sm: {
            parent: "gap-1 p-1 border border-zinc-200 text-sm",
            icons: "",
            label: "",
        },
        md: {
            parent: "gap-2 px-3 py-2 text-base",
            icons: "",
            label: "",
        },
        lg: {
            parent: "gap-3 px-4 py-3 text-lg",
            icons: "",
            label: "",
        },
    };
    const buttonStyles = {
        danger: {
            parent: "text-white bg-red-500 hover:bg-red-600",
            label: "",
        },
        normal: {
            parent: "text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200",
            label: "",
        },
        primary: {
            parent: "text-white bg-blue-600 hover:bg-blue-700",
            label: "",
        },
    };

    const handleClick = (e) => {
        e.preventDefault();
        action();
    };

    const sizeStyles = buttonSizes[size] || buttonSizes.sm;
    const styleStyles = buttonStyles[style] || buttonStyles.normal;

    const parentClasses = `flex items-center justify-center ${sizeStyles.parent} ${styleStyles.parent}`;
    const iconClasses = `${sizeStyles.icons}`;
    const labelClasses = `${sizeStyles.label} ${styleStyles.label}`;

    return (
        type === "btn" ? (
            <div onClick={(e) => handleClick(e)} className={parentClasses}>
                {showStartIcon && <ReturnIcon icon={startIcon} className={iconClasses} />}
                <p className={labelClasses}>{buttonLabel}</p>
                {showEndIcon && <ReturnIcon icon={endIcon} className={iconClasses} />}
            </div>
        ) : (
            <Link className={parentClasses}>
                {showStartIcon && <ReturnIcon icon={startIcon} className={iconClasses} />}
                <span className={labelClasses}>{buttonLabel}</span>
                {showEndIcon && <ReturnIcon icon={endIcon} className={iconClasses} />}
            </Link>
        )
    );
};

ReturnIcon.propTypes = {
    icon: PropTypes.string.isRequired,
    className: PropTypes.string,
};


Button.propTypes = {
    type: PropTypes.oneOf(["btn", "link"]),
    buttonLabel: PropTypes.string,
    size: PropTypes.oneOf(["sm", "md", "lg"]),
    style: PropTypes.oneOf(["normal", "primary", "danger"]),
    action: PropTypes.func,
    showStartIcon: PropTypes.bool,
    showEndIcon: PropTypes.bool,
    startIcon: PropTypes.string,
    endIcon: PropTypes.string,
};


export default Button;
