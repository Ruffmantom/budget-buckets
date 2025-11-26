import React from 'react'
import PropTypes from 'prop-types'

function FormInput({
    setValue,
    type,
    inputName,
    placeholder,
    value,
    disabled,
    readonly,
    width = 'full',
    extraStyles,
}) {

    const handleInputChange = (e) => {
        setValue(e.target.value)
    }

    return (
        <input
            type={type}
            name={inputName}
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            disabled={disabled}
            readOnly={readonly}
            className={`px-4 py-2 cursor-pointer rounded-sm focus:outline-blue-600 focus:outline-2 bg-stone-50 border-1 border-slate-200 w-${width} ${extraStyles}`}
        />
    )
}


FormInput.propTypes = {
    value: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    inputName: PropTypes.string,
    extraStyles: PropTypes.string,
    width: PropTypes.string,
    type: PropTypes.oneOf(['text', 'password', 'number']).isRequired,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    setValue: PropTypes.func,
}

export default FormInput