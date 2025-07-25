import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    nomeCompleto: "",
    email: "",
    telefone: "",
    cnpj: "",
    razaoSocial: "",
    pontoVenda: "",
    senha: "",
    confirmarSenha: "",
  });
  const [errors, setErrors] = useState({});
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
    const newErrors = {};

    if (!formData.nomeCompleto.trim()) {
      newErrors.nomeCompleto = "Nome completo é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = "Telefone é obrigatório";
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = "CNPJ é obrigatório";
    } else if (formData.cnpj.replace(/\D/g, "").length !== 14) {
      newErrors.cnpj = "CNPJ deve ter 14 dígitos";
    }

    if (!formData.razaoSocial.trim()) {
      newErrors.razaoSocial = "Razão social é obrigatória";
    }

    if (!formData.pontoVenda.trim()) {
      newErrors.pontoVenda = "Ponto de venda é obrigatório";
    }

    if (!formData.senha.trim()) {
      newErrors.senha = "Senha é obrigatória";
    } else if (formData.senha.length < 6) {
      newErrors.senha = "Senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmarSenha.trim()) {
      newErrors.confirmarSenha = "Confirmação de senha é obrigatória";
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "Senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === "cnpj") {
      formattedValue = formatCnpj(value);
    } else if (field === "telefone") {
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
      // Import Supabase functions
      const { signUp, createProfile } = await import("@/lib/supabase");

      // Create user in auth.users
      const { data: authData, error: authError } = await signUp(
        formData.email,
        formData.senha,
      );

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Falha ao criar usuário");
      }

      // Create profile in public.profiles
      const { error: profileError } = await createProfile({
        id: authData.user.id,
        full_name: formData.nomeCompleto,
        email: formData.email,
        phone: formData.telefone,
        role: "Representante",
        status: "Pendente de Aprovação",
        cnpj: formData.cnpj,
        company_name: formData.razaoSocial,
        point_of_sale: formData.pontoVenda,
        commission_code: null, // Will be generated when approved
      });

      if (profileError) {
        throw new Error(profileError.message);
      }

      console.log("Registration successful:", {
        userId: authData.user.id,
        email: formData.email,
        name: formData.nomeCompleto,
      });

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Registration error:", error);
      setErrors({
        submit: error.message || "Erro ao processar cadastro. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Cadastro Realizado!
            </h2>
            <p className="text-gray-600 mb-4">
              Sua solicitação foi enviada com sucesso. Você receberá um email
              quando sua conta for aprovada pelo administrador.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Após a aprovação, você poderá fazer login no sistema.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-red-600 hover:bg-red-700"
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                <Input
                  id="nomeCompleto"
                  type="text"
                  value={formData.nomeCompleto}
                  onChange={(e) =>
                    handleInputChange("nomeCompleto", e.target.value)
                  }
                  placeholder="Seu nome completo"
                  className={errors.nomeCompleto ? "border-red-500" : ""}
                />
                {errors.nomeCompleto && (
                  <p className="text-sm text-red-500">{errors.nomeCompleto}</p>
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
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  type="text"
                  value={formData.telefone}
                  onChange={(e) =>
                    handleInputChange("telefone", e.target.value)
                  }
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className={errors.telefone ? "border-red-500" : ""}
                />
                {errors.telefone && (
                  <p className="text-sm text-red-500">{errors.telefone}</p>
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
                  className={errors.cnpj ? "border-red-500" : ""}
                />
                {errors.cnpj && (
                  <p className="text-sm text-red-500">{errors.cnpj}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="razaoSocial">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  type="text"
                  value={formData.razaoSocial}
                  onChange={(e) =>
                    handleInputChange("razaoSocial", e.target.value)
                  }
                  placeholder="Nome da empresa"
                  className={errors.razaoSocial ? "border-red-500" : ""}
                />
                {errors.razaoSocial && (
                  <p className="text-sm text-red-500">{errors.razaoSocial}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pontoVenda">Ponto de Venda *</Label>
                <Input
                  id="pontoVenda"
                  type="text"
                  value={formData.pontoVenda}
                  onChange={(e) =>
                    handleInputChange("pontoVenda", e.target.value)
                  }
                  placeholder="Localização do ponto de venda"
                  className={errors.pontoVenda ? "border-red-500" : ""}
                />
                {errors.pontoVenda && (
                  <p className="text-sm text-red-500">{errors.pontoVenda}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha *</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => handleInputChange("senha", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={errors.senha ? "border-red-500" : ""}
                />
                {errors.senha && (
                  <p className="text-sm text-red-500">{errors.senha}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  value={formData.confirmarSenha}
                  onChange={(e) =>
                    handleInputChange("confirmarSenha", e.target.value)
                  }
                  placeholder="Confirme sua senha"
                  className={errors.confirmarSenha ? "border-red-500" : ""}
                />
                {errors.confirmarSenha && (
                  <p className="text-sm text-red-500">
                    {errors.confirmarSenha}
                  </p>
                )}
              </div>
            </div>

            {errors.submit && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

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
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicRegistration;
