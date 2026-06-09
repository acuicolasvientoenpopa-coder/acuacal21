import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/store/language";
import Layout from "@/components/Layout";
import ToastContainer from "@/components/Toast";
import {
  Calculator, Bitacora, Especies, Fincas, Parametros, Formulas, Zootecnico,
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
          </Route>
        </Routes>
        <ToastContainer />
      </LanguageProvider>
    </BrowserRouter>
  );
}
