import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

/* Komponen penjaga rute: hanya user login yang boleh masuk.
   Dipakai sebagai layout route sehingga semua rute anak di dalamnya
   otomatis terlindungi tanpa mengulang kode. */
export default function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    /* simpan tujuan awal agar bisa dikembalikan setelah login */
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
