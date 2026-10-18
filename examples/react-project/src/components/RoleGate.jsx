import { Result } from 'antd';
import { useAuth } from '../auth/AuthContext.jsx';

/* Otorisasi berbasis peran: bungkus halaman yang hanya untuk peran tertentu.
   Bedanya dengan ProtectedRoute — di sini user sudah login, tetapi
   peran (role) nya belum tentu diizinkan. */
export default function RoleGate({ roles, children }) {
  const { user } = useAuth();

  if (!roles.includes(user.role)) {
    return (
      <Result
        status="403"
        title="403 — Akses Ditolak"
        subTitle={`Halaman ini hanya untuk peran: ${roles.join(', ')}.`}
      />
    );
  }
  return children;
}
