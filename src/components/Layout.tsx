import { Outlet, Link, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { FlaskConical, Microscope, LogOut, LayoutDashboard, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Productos Químicos', path: '/chemicals', icon: FlaskConical },
    { name: 'Equipos', path: '/equipment', icon: Microscope },
    { name: 'Extracción IA', path: '/ai-extract', icon: FileText },
  ];

  // Logic for Alumno vs Profe:
  // For example, Alumnos might not see Equipment or AI Extract if needed, 
  // but for now let's just show the role in the profile.
  const role = profile?.role || 'alumno';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <FlaskConical className="w-6 h-6 text-blue-600 mr-2" />
          <span className="font-bold text-lg">ChemStock FP</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center mb-4 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
              role === 'profe' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {profile?.full_name || 'Usuario'}
              </p>
              <p className="text-xs text-slate-500 truncate capitalize">
                {role} • {user?.email}
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
