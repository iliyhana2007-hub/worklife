import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CalendarPage from './pages/CalendarPage';
import LeadsPage from './pages/LeadsPage';
import SearchPage from './pages/SearchPage';

function App() {
  useEffect(() => {
    // Initialize Telegram Web App
    if (WebApp.initData.length > 0 || import.meta.env.DEV) {
      WebApp.ready();
      WebApp.expand();
      // Set header color to match the dark theme (Zinc 950 - #09090b)
      WebApp.setHeaderColor('#09090b');
      WebApp.setBackgroundColor('#09090b'); // Also set bg color
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="search" element={<SearchPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
