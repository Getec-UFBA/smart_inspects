import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './style.css'; 

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ label, id, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="input-group password-input-group">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrapper">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          {...props}
        />
        <span className="password-toggle" onClick={togglePasswordVisibility}>
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>
    </div>
  );
};

export default PasswordInput;
