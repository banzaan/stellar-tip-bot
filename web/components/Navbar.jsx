// components/Navbar.jsx
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);


  const navListStyle = {
    display: 'flex',
    listStyle: 'none',
    gap: '30px',
    margin: 0,
    padding: 0,
    alignItems: 'center',
    '@media (max-width: 991px)': {
      display: isOpen ? 'flex' : 'none',
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
        
        .modern-navbar *, .modern-navbar {
          font-family: 'Poppins', sans-serif !important;
        }

        @media (max-width: 991px) {
          .desktop-nav {
            display: ${isOpen ? 'flex' : 'none'} !important;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background-color: rgba(111, 89, 194, 0.98);
            padding: 24px 0;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            text-align: center;
            gap: 20px !important;
          }
          .mobile-toggle-btn {
            display: block !important;
          }
        }
      `}</style>

      <header className="modern-navbar" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        backgroundColor: 'rgba(111, 89, 194, 0.95)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px'
        }}>
          
          <a href="#home" style={{ color: '#fff', textDecoration: 'none', fontWeight: '700', fontSize: '20px', lineHeight: '1.2' }}>
            STELLAR <br />
            <span style={{ fontSize: '10px', letterSpacing: '3px', opacity: 0.8, fontWeight: '500' }}>TIP BOT</span>
          </a>

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="mobile-toggle-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'none'
            }}
          >
            &#9776;
          </button>

          <ul className="desktop-nav" style={navListStyle}>
            {['Home', 'Activate Tipping', 'Analytics', 'Feedback', 'Connect'].map((item, index) => {
              const links = ['#home', '#about', '#feature', '#team', '#contact'];
              return (
                <li key={index}>
                  <a 
                    href={links[index]} 
                    onClick={() => setIsOpen(false)}
                    style={{
                      color: '#fff',
                      textDecoration: 'none',
                      fontWeight: '500',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {item}
                  </a>
                </li>
              );
            })}
          </ul>

        </div>
      </header>
    </>
  );
}