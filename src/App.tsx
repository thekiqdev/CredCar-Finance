import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import RepresentativeProfile from "./components/dashboard/RepresentativeProfile";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import RepresentativeDashboard from "./components/dashboard/RepresentativeDashboard";
import PublicRegistration from "./components/auth/PublicRegistration";
import DocumentUpload from "./components/auth/DocumentUpload";
import SalesSimulator from "./components/sales/SalesSimulator";
import ContractDetails from "./components/sales/ContractDetails";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/representante" element={<RepresentativeDashboard />} />
        <Route path="/simulador" element={<SalesSimulator />} />
        <Route path="/cadastro" element={<PublicRegistration />} />
        <Route
          path="/status-cadastro"
          element={<DocumentUpload isStatusPage={true} />}
        />
        <Route path="/documentos" element={<DocumentUpload />} />
        <Route path="/representative/:id" element={<RepresentativeProfile />} />
        <Route path="/contract/:id" element={<ContractDetails />} />
      </Routes>
    </Suspense>
  );
}

export default App;
