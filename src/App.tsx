import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/store/language";
import { CurrencyProvider } from "@/store/currency";
import { ThemeProvider } from "@/store/theme";
import { AuthProvider, useAuth } from "@/store/auth";
import Layout from "@/components/Layout";
import ToastContainer from "@/components/Toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import FeedbackWidget from "@/components/FeedbackWidget";

const Login = lazy(() => import("@/pages/Login"));
const Terminos = lazy(() => import("@/pages/Terminos"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Calculator = lazy(() => import("@/pages/Calculator"));
const Bitacora = lazy(() => import("@/pages/Bitacora"));
const Zootecnico = lazy(() => import("@/pages/Zootecnico"));
const Especies = lazy(() => import("@/pages/Especies"));
const Fincas = lazy(() => import("@/pages/Fincas"));
const Parametros = lazy(() => import("@/pages/Parametros"));
const Formulas = lazy(() => import("@/pages/Formulas"));
const Microbiologia = lazy(() => import("@/pages/Microbiologia"));
const Finanzas = lazy(() => import("@/pages/Finanzas"));
const Inventario = lazy(() => import("@/pages/Inventario"));
const VeterinaryReportWizard = lazy(() => import("@/pages/veterinary/VeterinaryReportWizard"));
const Admin = lazy(() => import("@/pages/Admin"));
const Mapa = lazy(() => import("@/pages/Mapa"));
const GeoPond = lazy(() => import("@/pages/GeoPond"));
const MedirEstanque = lazy(() => import("@/pages/MedirEstanque"));
const Planes = lazy(() => import("@/pages/Planes"));

const PUBLIC_PATHS = ["/calc", "/formulas", "/geo", "/medir-estanque"];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="loading-spinner" /></div>;
  if (!user && !PUBLIC_PATHS.includes(window.location.pathname)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="loading-overlay"><div className="loading-spinner" /></div>}>
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <ThemeProvider>
                <Routes>
                  <Route path="/login" element={<SuspenseWrapper><Login /></SuspenseWrapper>} />
                  <Route path="/terminos" element={<SuspenseWrapper><Terminos /></SuspenseWrapper>} />
                  <Route element={<Layout />}>
                    <Route index element={<ProtectedRoute><SuspenseWrapper><Dashboard /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="calc" element={<ProtectedRoute><SuspenseWrapper><Calculator /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="bitacora" element={<ProtectedRoute><SuspenseWrapper><Bitacora /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="zootecnico" element={<ProtectedRoute><SuspenseWrapper><Zootecnico /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="especies" element={<ProtectedRoute><SuspenseWrapper><Especies /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="fincas" element={<ProtectedRoute><SuspenseWrapper><Fincas /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="parametros" element={<ProtectedRoute><SuspenseWrapper><Parametros /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="formulas" element={<ProtectedRoute><SuspenseWrapper><Formulas /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="micro" element={<ProtectedRoute><SuspenseWrapper><Microbiologia /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="finanzas" element={<ProtectedRoute><SuspenseWrapper><Finanzas /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="vet" element={<ProtectedRoute><SuspenseWrapper><VeterinaryReportWizard /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="inventario" element={<ProtectedRoute><SuspenseWrapper><Inventario /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="admin" element={<ProtectedRoute><SuspenseWrapper><Admin /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="mapa" element={<ProtectedRoute><SuspenseWrapper><Mapa /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="geo" element={<ProtectedRoute><SuspenseWrapper><GeoPond /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="medir-estanque" element={<ProtectedRoute><SuspenseWrapper><MedirEstanque /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="planes" element={<ProtectedRoute><SuspenseWrapper><Planes /></SuspenseWrapper></ProtectedRoute>} />
                  </Route>
                </Routes>
                <ToastContainer />
                <FeedbackWidget />
              </ThemeProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
