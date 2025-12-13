import React from 'react';
import PropTypes from 'prop-types';
import AuthLayout from '../../components/layouts/AuthLayout';
import Button from '../../components/common/Button';


const WelcomePage = () => {
    return (
        <AuthLayout>
            <p className='text-2xl'>Welcome!</p>
            <p>Please sign in or register to access this app.</p>
            <Button buttonLabel='Hello' style='normal' size='lg'/>
        </AuthLayout>
    );
};


WelcomePage.propTypes = {

};


export default WelcomePage;
