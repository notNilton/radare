import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/AuthStore";
import "./NavbarComponent.scss";
import AboutModal from "../About/AboutModal";

interface NavbarComponentProps {
  version?: string;
}

const NavbarComponent: React.FC<NavbarComponentProps> = () => {
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const toggleAboutPopup = () => {
    setShowAbout(!showAbout);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="header">
        <nav className="navbar">
          <div className="navbar-logo">
            <Link to="/" className="logo-link">RADARE</Link>
          </div>
          <ul className="navbar-menu">
            <li className="navbar-item">
              <Link to="/" className="nav-link">Grafo</Link>
            </li>
            <li className="navbar-item">
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            </li>
            <li className="navbar-item">
              <Link to="/history" className="nav-link">Histórico</Link>
            </li>
            <li className="navbar-item">
              <Link to="/tags" className="nav-link">Tags</Link>
            </li>
            <li className="navbar-item">
              <Link to="/profile" className="nav-link">Perfil</Link>
            </li>
            <li className="navbar-item">
              <button className="link-button" onClick={toggleAboutPopup}>
                Sobre
              </button>
            </li>
            <li className="navbar-item">
              <button className="logout-button" onClick={handleLogout}>
                Sair
              </button>
            </li>
          </ul>
        </nav>
      </header>
      <AboutModal showAbout={showAbout} toggleAboutPopup={toggleAboutPopup} />
    </>
  );
};

export default NavbarComponent;
