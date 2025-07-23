import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import LoginForm from "./auth/LoginForm";
import AdminDashboard from "./dashboard/AdminDashboard";
import RepresentativeDashboard from "./dashboard/RepresentativeDashboard";

type UserRole = "admin" | "representative" | null;

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const handleLogin = (role: UserRole) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {!isAuthenticated ? (
        <Card className="w-full max-w-md bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-red-600">CredCar</h1>
              <p className="text-gray-600 mt-2">
                Sistema de Gestão de Vendas e Comissões
              </p>
            </div>
            <LoginForm onLogin={handleLogin} />
          </CardContent>
        </Card>
      ) : (
        <div className="w-full">
          {userRole === "admin" ? (
            <AdminDashboard onLogout={handleLogout} />
          ) : (
            <RepresentativeDashboard onLogout={handleLogout} />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
