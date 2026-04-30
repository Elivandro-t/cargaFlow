import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from "react";

// Componentes
import Home from "./components/Home";
import LoginPage from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { SLAConfigEditor } from "./components/SLAConfigEditor";
import { PlateSearch } from "./components/PlateSearch";
import AdminPage from "./components/AdminPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {

  function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
  }

  function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'ADMIN') return <Navigate to="/home/dashboard" replace />;
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Rota Pai (Layout Home) */}
            <Route path="/home" element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }>
              {/* Rotas Filhas (Renderizadas dentro do Outlet) */}
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="search" element={<PlateSearch />} />
              <Route path="sla" element={<SLAConfigEditor />} />

              {/* Rotas Admin Protegidas */}
              <Route path="admin-dashboard" element={
                <AdminRoute>
                  <>nada</>
                </AdminRoute>
              } />

              <Route path="admin-users" element={
                <AdminRoute><AdminPage /></AdminRoute>
              } />

            </Route>

            {/* Redirecionamento padrão */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <p className="text-sm text-neutral-400 tracking-widest uppercase">Carregando</p>
      </div>
    </div>
  );
}