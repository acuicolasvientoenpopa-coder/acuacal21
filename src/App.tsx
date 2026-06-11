import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/store/language";
import { CurrencyProvider } from "@/store/currency";
import { ThemeProvider } from "@/store/theme";
import { AuthProvider, useAuth } from "@/store/auth";
import Layout from "@/components/Layout";
import ToastContainer from "@/components/Toast";
import Login from "@/pages/Login";
import Terminos from "@/pages/Terminos";
import GeoPond from "@/pages/GeoPond";
import {
  Calculator, Bitacora, Especies, Fincas, Parametros, Formulas, Zootecnico,
  VeterinaryReportWizard, Admin, Microbiologia, Finanzas, Dashboard, Inventario, Mapa,
} from "@/pages";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <ThemeProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/terminos" element={<Terminos />} />
                <Route element={<Layout />}>
                  <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="calc" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
                  <Route path="bitacora" element={<ProtectedRoute><Bitacora /></ProtectedRoute>} />
                  <Route path="zootecnico" element={<ProtectedRoute><Zootecnico /></ProtectedRoute>} />
                  <Route path="especies" element={<ProtectedRoute><Especies /></ProtectedRoute>} />
                  <Route path="fincas" element={<ProtectedRoute><Fincas /></ProtectedRoute>} />
                  <Route path="parametros" element={<ProtectedRoute><Parametros /></ProtectedRoute>} />
                  <Route path="formulas" element={<ProtectedRoute><Formulas /></ProtectedRoute>} />
                  <Route path="micro" element={<ProtectedRoute><Microbiologia /></ProtectedRoute>} />
                  <Route path="finanzas" element={<ProtectedRoute><Finanzas /></ProtectedRoute>} />
                  <Route path="vet" element={<ProtectedRoute><VeterinaryReportWizard /></ProtectedRoute>} />
                  <Route path="inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
                  <Route path="admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                  <Route path="mapa" element={<ProtectedRoute><Mapa /></ProtectedRoute>} />
                  <Route path="geo" element={<ProtectedRoute><GeoPond /></ProtectedRoute>} />
                </Route>
              </Routes>
              <ToastContainer />
            </ThemeProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
