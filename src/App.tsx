import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CalendarPage from './pages/CalendarPage';
import LeadsPage from './pages/LeadsPage';
import DojoPage from './pages/DojoPage';
import SettingsPage from './pages/SettingsPage';
import { useStore } from './store/useStore';

function App() {
  const { checkXpReset } = useStore();

  useEffect(() => {
    // Check for XP reset on mount
    checkXpReset();

    // Initialize Telegram Web App
    if (WebApp.initData.length > 0 || import.meta.env.DEV) {
      WebApp.ready();
      WebApp.expand();
      // Set header color to match the dark theme (Zinc 950 - #09090b)
      WebApp.setHeaderColor('#09090b');
      WebApp.setBackgroundColor('#09090b'); // Also set bg color
    }
  }, [checkXpReset]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="dojo" element={<DojoPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
