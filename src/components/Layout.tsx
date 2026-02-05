import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
    { id: 'leads', label: 'Leads', icon: Users, path: '/leads' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full transition-colors active:scale-95",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
