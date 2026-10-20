import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Orders from './pages/Orders.jsx';
import Notifications from './pages/Notifications.jsx';
import NotFound from './pages/NotFound.jsx';

/* Peta rute seluruh aplikasi. Semua halaman berada di dalam AppShell
   agar layout sidebar + header konsisten. */
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
