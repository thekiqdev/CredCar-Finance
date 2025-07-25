import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn, getProfile } from "@/lib/supabase";

interface LoginFormProps {
  onLogin?: (user: any, profile: any) => void;
}

const LoginForm = ({ onLogin = () => {} }: LoginFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("representative");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await signIn(
        email,
        password,
      );

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Falha na autenticação");
      }

      // Get user profile
      const { data: profile, error: profileError } = await getProfile(
        authData.user.id,
      );

      if (profileError || !profile) {
        throw new Error("Perfil não encontrado");
      }

      // Check if the role matches what user selected
      const userRole =
        profile.role === "Administrador" || profile.role === "Suporte"
          ? "administrator"
          : "representative";

      if (userRole !== role) {
        throw new Error("Tipo de acesso incorreto para este usuário");
      }

      // Call the onLogin callback
      await onLogin(authData.user, profile);

      // Handle different user statuses and roles
      if (profile.role === "Representante") {
        if (profile.status === "Pendente de Aprovação") {
          setError("Sua conta está pendente de aprovação pelo administrador.");
          setIsLoading(false);
          return;
        }

        if (profile.status === "Documentos Pendentes") {
          // First login after approval - redirect to document upload
          navigate("/documentos");
          return;
        }

        if (profile.status === "Ativo") {
          navigate("/representante");
        } else {
          setError(
            `Conta ${profile.status.toLowerCase()}. Entre em contato com o administrador.`,
          );
          setIsLoading(false);
          return;
        }
      } else {
        // Administrator or Support
        navigate("/admindashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.message || "Credenciais inválidas. Por favor, tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          CredCar
        </CardTitle>
        <CardDescription className="text-center">
          Entre com suas credenciais para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Novo representante?</strong>{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                onClick={() => navigate("/cadastro")}
                type="button"
              >
                Clique aqui para se cadastrar
              </Button>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Acesso</Label>
            <RadioGroup
              value={role}
              onValueChange={setRole}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="representative" id="representative" />
                <Label htmlFor="representative">Representante</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="administrator" id="administrator" />
                <Label htmlFor="administrator">Administrador</Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" className="text-sm text-gray-500">
          Esqueceu sua senha?
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
