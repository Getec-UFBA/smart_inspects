import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { FaHome, FaFolder, FaUserPlus } from 'react-icons/fa';
import './style.css';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, isAdmin }) => {
  const handleNavLinkClick = () => {
    if (isOpen) {
      toggleSidebar();
      
    }
  };
  
  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <Nav className="flex-column">
        <Nav.Link as={NavLink} to="/" end onClick={handleNavLinkClick}>
          <FaHome />
          <span>Home</span>
        </Nav.Link>
        <Nav.Link as={NavLink} to="/projetos" onClick={handleNavLinkClick}>
          <FaFolder />
          <span>Projetos</span>
        </Nav.Link>
        {isAdmin && (
          <Nav.Link as={NavLink} to="/register-user" onClick={handleNavLinkClick}>
            <FaUserPlus />
            <span>Pré-cadastrar Usuário</span>
          </Nav.Link>
        )}
      </Nav>
    </div>
  );
};

export default Sidebar;
