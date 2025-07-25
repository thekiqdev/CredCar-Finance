import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import LoginForm from "./auth/LoginForm";
import AdminDashboard from "./dashboard/AdminDashboard";
import RepresentativeDashboard from "./dashboard/RepresentativeDashboard";
import { getCurrentUser, getProfile, signOut } from "@/lib/supabase";

type UserRole = "admin" | "representative" | null;

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const { data: profile } = await getProfile(user.id);
        if (profile) {
          setCurrentUser(user);
          setCurrentProfile(profile);
          setIsAuthenticated(true);
          setUserRole(
            profile.role === "Administrador" || profile.role === "Suporte"
              ? "admin"
              : "representative",
          );
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (user: any, profile: any) => {
    setCurrentUser(user);
    setCurrentProfile(profile);
    setIsAuthenticated(true);
    setUserRole(
      profile.role === "Administrador" || profile.role === "Suporte"
        ? "admin"
        : "representative",
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserRole(null);
      setCurrentUser(null);
      setCurrentProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="h-8 w-8 rounded-md bg-red-600 mx-auto mb-4"></div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">CredCar</h1>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

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
            <AdminDashboard
              onLogout={handleLogout}
              userName={currentProfile?.full_name || "Admin"}
              currentUser={currentUser}
              currentProfile={currentProfile}
            />
          ) : (
            <RepresentativeDashboard
              onLogout={handleLogout}
              representativeName={currentProfile?.full_name || "Representante"}
              currentUser={currentUser}
              currentProfile={currentProfile}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
