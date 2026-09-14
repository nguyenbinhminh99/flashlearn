import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `px-3 py-2 rounded-md text-sm font-medium transition ${
    isActive
      ? 'bg-teal-700 text-white'
      : 'text-slate-700 hover:bg-teal-50 hover:text-teal-800'
  }`;

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="text-xl font-bold tracking-tight text-teal-800">
            FlashLearn
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/explore" className={linkClass}>
              Khám phá
            </NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard" className={linkClass}>
                  Bộ thẻ của tôi
                </NavLink>
                <NavLink to="/study-sets/new" className={linkClass}>
                  Tạo bộ thẻ
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  Hồ sơ
                </NavLink>
                {user.role === 'ADMIN' ? (
                  <NavLink to="/admin" className={linkClass}>
                    Admin
                  </NavLink>
                ) : null}
                <button
                  type="button"
                  onClick={logout}
                  className="ml-2 px-3 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Đăng nhập
                </NavLink>
                <NavLink
                  to="/register"
                  className="ml-1 px-3 py-2 rounded-md text-sm font-medium bg-teal-600 text-white hover:bg-teal-700"
                >
                  Đăng ký
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-sm text-slate-500">
        FlashLearn · Lập trình Web
      </footer>
    </div>
  );
}
