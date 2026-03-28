import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const nav = useNavigate();
  return (
    <div className="landing">
      <div className="landing-content">
        <div className="logo-badge">🌾 FarmConnect</div>
        <h1 className="landing-title">From <span>Field</span><br />to Table</h1>
        <p className="landing-sub">
          Connecting local farmers directly with their neighbours.<br />
          Fresh, honest, and community-driven.
        </p>
        <div className="role-cards">
          <div className="role-card">
            <div className="role-icon">👨‍🌾</div>
            <h2>I'm a Farmer</h2>
            <p>Sell your produce & share with the community</p>
            <button className="btn-join" onClick={() => nav('/register?role=farmer')}>
              Get Started →
            </button>
            <button className="btn-join-outline" onClick={() => nav('/login?role=farmer')}>
              Sign In
            </button>
          </div>
          <div className="role-card">
            <div className="role-icon">🛒</div>
            <h2>I'm a Customer</h2>
            <p>Buy fresh produce directly from local farmers</p>
            <button className="btn-join" onClick={() => nav('/register?role=customer')}>
              Get Started →
            </button>
            <button className="btn-join-outline" onClick={() => nav('/login?role=customer')}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
