import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import HeaderSearch from './HeaderSearch';
import HeaderTags from './HeaderTags';

const CAN_PUBLISH = 1;

export default function Layout() {
  const { user, logout } = useAuth();
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
            {user ? (
              <div className="nav-user-menu" ref={menuRef}>
                <button
                  type="button"
                  className="nav-user-trigger"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {user.username}
                </button>
                {menuOpen && (
                  <div className="nav-user-dropdown" role="menu">
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
                        Создать публикацию
                      </button>
                    )}
                    {canPublish && (
                      <Link
                        to="/drafts"
                        className="nav-user-dropdown-item"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        Мои черновики
                      </Link>
                    )}
                    <button
                      type="button"
                      className="nav-user-dropdown-item"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
