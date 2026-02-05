import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CalendarPage from './pages/CalendarPage';
import LeadsPage from './pages/LeadsPage';

function App() {
  useEffect(() => {
    // Initialize Telegram Web App
    if (WebApp.initData.length > 0 || import.meta.env.DEV) {
      WebApp.ready();
      WebApp.expand();
      // Set header color to match the dark theme
      WebApp.setHeaderColor('#0a0a0a'); // matches zinc-950/background
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="leads" element={<LeadsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
