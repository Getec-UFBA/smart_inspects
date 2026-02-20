import React, { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import './style.css';

const ThemeToggleSwitch: React.FC = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <label className="switch">
      <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
      <span className="slider round"></span>
    </label>
  );
};

export default ThemeToggleSwitch;
