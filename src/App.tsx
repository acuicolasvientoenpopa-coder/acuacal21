import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/store/language";
import Layout from "@/components/Layout";
import ToastContainer from "@/components/Toast";
import {
  Calculator, Bitacora, Especies, Fincas, Parametros, Formulas, Zootecnico,
  VeterinaryReportWizard, MasterPage,
} from "@/pages";

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Calculator />} />
            <Route path="bitacora" element={<Bitacora />} />
            <Route path="zootecnico" element={<Zootecnico />} />
            <Route path="especies" element={<Especies />} />
            <Route path="fincas" element={<Fincas />} />
            <Route path="parametros" element={<Parametros />} />
            <Route path="formulas" element={<Formulas />} />
            <Route path="vet" element={<VeterinaryReportWizard />} />
            <Route path="master" element={<MasterPage />} />
          </Route>
        </Routes>
        <ToastContainer />
      </LanguageProvider>
    </BrowserRouter>
  );
}
