import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
    { id: 'leads', label: 'Leads', icon: Users, path: '/leads' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
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

      <nav className="fixed bottom-0 left-0 right-0 glass pb-safe z-50">
        <div className="flex justify-around items-center h-[88px] pb-4">
          {tabs.map((tab) => {
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={cn(
                  "relative p-1.5 rounded-xl transition-all duration-300",
                  isActive ? "bg-white/10 text-white" : "text-zinc-500 group-active:scale-95"
                )}>
                  <tab.icon className={cn("w-6 h-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 bg-white/5 rounded-xl blur-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium mt-1 transition-colors duration-300",
                  isActive ? "text-white" : "text-zinc-500"
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
