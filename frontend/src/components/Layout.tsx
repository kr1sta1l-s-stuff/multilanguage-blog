import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import HeaderSearch from './HeaderSearch';
import HeaderTags from './HeaderTags';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import { useT } from '../hooks/useT';

const CAN_PUBLISH = 1;

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IncognitoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11h18" />
      <path d="M6 11l1.5-4.5A2 2 0 0 1 9.4 5h5.2a2 2 0 0 1 1.9 1.5L18 11" />
      <circle cx="7" cy="15.5" r="2.5" />
      <circle cx="17" cy="15.5" r="2.5" />
      <path d="M9.5 15.5c.8-.7 4.2-.7 5 0" />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const canPublish = !!user && (user.rights & CAN_PUBLISH) !== 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="header">
        <nav className="nav">
          <Link to="/publications" className="nav-brand">
            <img src="/favicon.svg" alt="" className="nav-brand-icon" />
            safespace
          </Link>
          <HeaderSearch />
          <HeaderTags />
          <div className="nav-links">
            <div className="nav-user-menu" ref={menuRef}>
              <button
                type="button"
                className="nav-user-trigger"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t('nav.userMenu')}
              >
                {user ? <UserIcon /> : <IncognitoIcon />}
              </button>
              {menuOpen && (
                <div className="nav-user-dropdown" role="menu">
                  {user && (
                    <div className="nav-user-dropdown-username">{user.username}</div>
                  )}
                  <ThemeSwitcher />
                  <LanguageSwitcher />
                  <div className="nav-user-dropdown-divider" />
                  {user ? (
                    <>
                      {canPublish && (
                        <button
                          type="button"
                          className="nav-user-dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false);
                            navigate('/publications?create=1');
                          }}
                        >
                          {t('nav.createPublication')}
                        </button>
                      )}
                      {canPublish && (
                        <Link
                          to="/drafts"
                          className="nav-user-dropdown-item"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          {t('nav.myDrafts')}
                        </Link>
                      )}
                      <button
                        type="button"
                        className="nav-user-dropdown-item"
                        onClick={handleLogout}
                        role="menuitem"
                      >
                        {t('nav.logout')}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="nav-user-dropdown-item"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t('nav.login')}
                      </Link>
                      <Link
                        to="/register"
                        className="nav-user-dropdown-item"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t('nav.register')}
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
