import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import RepresentativeProfile from "./components/dashboard/RepresentativeProfile";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import RepresentativeDashboard from "./components/dashboard/RepresentativeDashboard";
import PublicRegistration from "./components/auth/PublicRegistration";
import DocumentUpload from "./components/auth/DocumentUpload";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/representante" element={<RepresentativeDashboard />} />
          <Route path="/cadastro" element={<PublicRegistration />} />
          <Route path="/documentos" element={<DocumentUpload />} />
          <Route
            path="/representative/:id"
            element={<RepresentativeProfile />}
          />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
