import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ tabs, activeTab, onTab }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">Farm<span>Connect</span> 🌾</div>
      <div className="nav-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => onTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="nav-right">
        <span className="nav-user">👤 {user?.name}</span>
        <button className="nav-logout" onClick={handleLogout}>Sign Out</button>
      </div>
    </nav>
  );
}
