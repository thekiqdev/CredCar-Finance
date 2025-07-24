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

interface LoginFormProps {
  onLogin?: (email: string, password: string, role: string) => void;
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
      // In a real implementation, this would call an authentication API
      await onLogin(email, password, role);

      // Check if representative account is pending approval
      if (role === "representative") {
        // Simulate checking account status
        const accountStatus = "active"; // This would come from the API
        const documentsUploaded = false; // This would come from the API

        if (accountStatus === "pending") {
          setError("Sua conta está pendente de aprovação pelo administrador.");
          setIsLoading(false);
          return;
        }

        if (accountStatus === "active" && !documentsUploaded) {
          // First login after approval - redirect to document upload
          navigate("/documentos");
          return;
        }

        navigate("/representante");
      } else {
        navigate("/admindashboard");
      }
    } catch (err) {
      setError("Credenciais inválidas. Por favor, tente novamente.");
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
