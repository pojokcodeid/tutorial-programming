import { Route, Routes } from 'react-router-dom';
import { Spin } from 'antd';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleGate from './components/RoleGate.jsx';
import { useAuth } from './auth/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Products from './pages/Products.jsx';
import Register from './pages/Register.jsx';
import Users from './pages/Users.jsx';

/* Peta rute seluruh aplikasi:
   /login & /register publik → sisanya wajib login (ProtectedRoute)
   → di dalamnya memakai layout AppShell → /users dibungkus RoleGate admin */
export default function App() {
  const { ready } = useAuth();

  /* tunggu pemulihan sesi selesai agar halaman tidak "loncat" ke /login
     padahal token user masih ada di localStorage */
  if (!ready) {
    return (
      <div className="center-page">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route
            path="users"
            element={
              <RoleGate roles={['admin']}>
                <Users />
              </RoleGate>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
