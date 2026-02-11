import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
    { id: 'leads', label: 'Leads', icon: Users, path: '/leads' },
    { id: 'search', label: 'Search', icon: Search, path: '/search' },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 pb-[env(safe-area-inset-bottom)] z-50">
        <div className="flex justify-around items-center h-[50px] pt-1">
          {tabs.map((tab) => {
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center justify-center w-full h-full active:opacity-70 transition-opacity"
              >
                <tab.icon 
                    className={cn(
                        "w-7 h-7 mb-0.5", 
                        isActive ? "text-red-500" : "text-zinc-500"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2} 
                />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-red-500" : "text-zinc-500"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
