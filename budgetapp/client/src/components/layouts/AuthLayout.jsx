import React from 'react';
import PropTypes from 'prop-types';


const AuthLayout = ({ children }) => {
    return (
        <div className='flex w-full h-screen flex-col justify-center items-center gap-2.5'>
            <div className="flex grow items-center">
                <div className="flex flex-col p-8 text-center">
                    {children}
                </div>
            </div>

            <div className="flex justify-center items-center py-10 px-6">
                <p className='text-xs'>© Budget buckets - v1.0.0</p>
            </div>
        </div>
    );
};


AuthLayout.propTypes = {
    children: PropTypes.node
};


export default AuthLayout;
