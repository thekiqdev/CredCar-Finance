import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { representativeService, authService } from "../../lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PublicRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cnpj: "",
    razao_social: "",
    ponto_venda: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors["name"] = "Nome completo é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors["email"] = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors["email"] = "Email inválido";
    }

    if (!formData.phone.trim()) {
      newErrors["phone"] = "Telefone é obrigatório";
    }

    if (!formData.cnpj.trim()) {
      newErrors["cnpj"] = "CNPJ é obrigatório";
    } else if (formData.cnpj.replace(/\D/g, "").length !== 14) {
      newErrors["cnpj"] = "CNPJ deve ter 14 dígitos";
    }

    if (!formData.razao_social.trim()) {
      newErrors["razao_social"] = "Razão social é obrigatória";
    }

    if (!formData.ponto_venda.trim()) {
      newErrors["ponto_venda"] = "Ponto de venda é obrigatório";
    }

    if (!formData.password.trim()) {
      newErrors["password"] = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors["password"] = "Senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors["confirmPassword"] = "Confirmação de senha é obrigatória";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors["confirmPassword"] = "Senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === "cnpj") {
      formattedValue = formatCnpj(value);
    } else if (field === "phone") {
      formattedValue = formatPhone(value);
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log("Submitting public registration with data:", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cnpj: formData.cnpj,
        razao_social: formData.razao_social,
        ponto_venda: formData.ponto_venda,
      });

      // Create public registration in database
      const newUser = await representativeService.createPublicRegistration({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cnpj: formData.cnpj,
        razao_social: formData.razao_social,
        ponto_venda: formData.ponto_venda,
        password: formData.password,
      });

      console.log("Registration submitted successfully:", newUser);

      if (!newUser) {
        throw new Error("Falha ao criar usuário - nenhum dado retornado");
      }

      // Set the user in localStorage so DocumentUpload can access it
      authService.setCurrentUser(newUser);

      // Show success message
      setIsSuccess(true);

      // Redirect to status page after a short delay
      setTimeout(() => {
        navigate("/status-cadastro");
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";

      if (errorMessage.includes("Email já está em uso")) {
        setErrors({ email: "Este email já está cadastrado no sistema." });
      } else if (errorMessage.includes("duplicate key value")) {
        setErrors({ email: "Este email já está cadastrado no sistema." });
      } else if (errorMessage.includes("violates foreign key constraint")) {
        setErrors({
          submit:
            "Erro de configuração do sistema. Entre em contato com o suporte.",
        });
      } else {
        setErrors({ submit: `Erro ao enviar cadastro: ${errorMessage}` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-8 w-8 rounded-md bg-red-600 mr-2"></div>
            <h1 className="text-3xl font-bold text-red-600">CredCar</h1>
          </div>
          <CardTitle className="text-2xl font-bold">
            Cadastro de Representante
          </CardTitle>
          <CardDescription>
            Preencha os dados abaixo para solicitar seu cadastro como
            representante
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                Cadastro enviado com sucesso!
              </h3>
              <p className="text-gray-600 mb-4">
                Seu cadastro foi enviado para análise. Você será redirecionado
                para acompanhar o status.
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent mx-auto"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors["submit"] && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors["submit"]}</AlertDescription>
                </Alert>
              )}
              {errors["email"] && !errors["submit"] && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors["email"]}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Seu nome completo"
                    className={errors["name"] ? "border-red-500" : ""}
                  />
                  {errors["name"] && (
                    <p className="text-sm text-red-500">{errors["name"]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className={errors["email"] ? "border-red-500" : ""}
                  />
                  {errors["email"] && (
                    <p className="text-sm text-red-500">{errors["email"]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className={errors["phone"] ? "border-red-500" : ""}
                  />
                  {errors["phone"] && (
                    <p className="text-sm text-red-500">{errors["phone"]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className={errors["cnpj"] ? "border-red-500" : ""}
                  />
                  {errors["cnpj"] && (
                    <p className="text-sm text-red-500">{errors["cnpj"]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social *</Label>
                  <Input
                    id="razao_social"
                    type="text"
                    value={formData.razao_social}
                    onChange={(e) =>
                      handleInputChange("razao_social", e.target.value)
                    }
                    placeholder="Nome da empresa"
                    className={errors["razao_social"] ? "border-red-500" : ""}
                  />
                  {errors["razao_social"] && (
                    <p className="text-sm text-red-500">
                      {errors["razao_social"]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ponto_venda">Ponto de Venda *</Label>
                  <Input
                    id="ponto_venda"
                    type="text"
                    value={formData.ponto_venda}
                    onChange={(e) =>
                      handleInputChange("ponto_venda", e.target.value)
                    }
                    placeholder="Localização do ponto de venda"
                    className={errors["ponto_venda"] ? "border-red-500" : ""}
                  />
                  {errors["ponto_venda"] && (
                    <p className="text-sm text-red-500">
                      {errors["ponto_venda"]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    placeholder="Mínimo 6 caracteres"
                    className={errors["password"] ? "border-red-500" : ""}
                  />
                  {errors["password"] && (
                    <p className="text-sm text-red-500">{errors["password"]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirme sua senha"
                    className={
                      errors["confirmPassword"] ? "border-red-500" : ""
                    }
                  />
                  {errors["confirmPassword"] && (
                    <p className="text-sm text-red-500">
                      {errors["confirmPassword"]}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Solicitar Cadastro"}
                </Button>
              </div>

              <div className="text-center pt-4">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate("/")}
                  className="text-gray-500"
                >
                  Já tem uma conta? Fazer login
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicRegistration;
