import { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useRealtimeSync } from '../../lib/realtime';
import {
  LayoutDashboard,
  ListOrdered,
  Crown,
  Settings,
  Users,
  Download,
  LogOut,
  Menu,
  X,
  Lock,
  List
} from 'lucide-react';
import { ToastProvider } from '../../components/ToastContext';

export const AdminLayout = () => {
  const [admin, setAdmin] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshAdmin = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: adminData, error } = await supabase
      .from('admins')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (adminData && !error) {
      setAdmin({ ...session.user, role: adminData.role });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/admin/login', { replace: true });
        return;
      }

      const { data: adminData, error } = await supabase
        .from('admins')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!adminData || error) {
        await supabase.auth.signOut();
        navigate('/admin/login', { replace: true });
        return;
      }

      if (mounted) {
        setAdmin({ ...session.user, role: adminData.role });
      }
    };

    checkAuth();
    return () => { mounted = false; };
  }, [navigate]);

  useRealtimeSync('admin-layout', ['admins', 'app_settings'], refreshAdmin);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!admin) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Overview', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Votes & Trans.', path: '/admin/transactions', icon: <ListOrdered size={18} /> },
    { name: 'Leaderboard', path: '/admin/leaderboard', icon: <Crown size={18} /> },
    { name: 'Categories', path: '/admin/categories', icon: <List size={18} />, superAdminOnly: true },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={18} />, superAdminOnly: true },
    { name: 'Admin Users', path: '/admin/users', icon: <Users size={18} />, superAdminOnly: true },
    { name: 'Export', path: '/admin/export', icon: <Download size={18} /> },
    { name: 'Action Log', path: '/admin/action-log', icon: <ListOrdered size={18} /> },
  ];

  // Removed duplicate useEffect

  return (
    <ToastProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-base)' }}>

        {/* Mobile Top Bar */}
        <div className="md:hidden" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: 'var(--color-text)' }}>
            Control Panel
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: 'var(--color-text-muted)', padding: '4px' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1 }}>
          {/* Mobile Backdrop */}
          {mobileMenuOpen && (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 45 }}
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`admin-sidebar-mobile ${mobileMenuOpen ? 'admin-sidebar-open' : 'admin-sidebar-closed'}`} style={{
            display: 'flex',
            flexDirection: 'column',
            width: '240px',
            flexShrink: 0,
            background: 'var(--color-surface)',
            borderRight: '1px solid var(--color-border)',
            height: '100vh',
            position: 'sticky',
            top: 0,
            overflowY: 'auto',
            zIndex: 46,
          }}>
            {/* Desktop Header */}
            <div className="md:flex" style={{
              display: 'none',
              flexDirection: 'column',
              padding: '20px',
              borderBottom: '1px solid var(--color-border)',
              gap: '6px',
            }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--color-text)' }}>
                Control Panel
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                  {admin.email}
                </span>
                <span style={{
                  fontSize: '9px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  background: admin.role === 'super_admin' ? 'rgba(212,175,55,0.15)' : 'var(--color-surface-raised)',
                  color: admin.role === 'super_admin' ? 'var(--color-gold)' : 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>

            {/* Nav Links */}
            <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const isLocked = item.superAdminOnly && admin.role !== 'super_admin';

                if (isLocked) {
                  return (
                    <div key={item.path} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      opacity: 0.35,
                      cursor: 'not-allowed',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      color: 'var(--color-text-muted)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                      <Lock size={12} />
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                      background: isActive ? 'var(--color-surface-raised)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--color-gold)' : '3px solid transparent',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <span style={{ color: isActive ? 'var(--color-gold)' : 'inherit' }}>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div style={{ padding: '12px 8px', borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  width: '100%',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                }}
              >
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 60px', minHeight: '100vh' }}>
            <Outlet context={{ admin }} />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};
