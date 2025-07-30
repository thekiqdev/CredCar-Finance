import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  FileUp,
  PenTool,
} from "lucide-react";
import SignatureCanvas from "@/components/ui/signature-canvas";
import { supabase } from "@/lib/supabase";
import { storageService } from "@/lib/storage";

interface ContractData {
  id: number;
  contract_code: string;
  contract_content: string;
  status: string;
  client: {
    full_name: string;
    email: string;
  };
}

interface SignatureData {
  full_name: string;
  cpf: string;
  document_file: File | null;
  signature_data_url: string;
}

const SignaturePage: React.FC = () => {
  const { id: contractId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<ContractData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const [signatureData, setSignatureData] = useState<SignatureData>({
    full_name: "",
    cpf: "",
    document_file: null,
    signature_data_url: "",
  });

  const [validationErrors, setValidationErrors] = useState<{
    full_name?: string;
    cpf?: string;
    document_file?: string;
    signature?: string;
  }>({});

  useEffect(() => {
    if (contractId) {
      loadContractData();
    } else {
      setError("ID do contrato não fornecido");
      setIsLoading(false);
    }
  }, [contractId]);

  const loadContractData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("contracts")
        .select(
          `
          id,
          contract_code,
          contract_content,
          status,
          clients!inner (
            full_name,
            email
          )
        `,
        )
        .eq("id", contractId)
        .single();

      if (fetchError) {
        console.error("Error fetching contract:", fetchError);
        throw new Error(`Erro ao carregar contrato: ${fetchError.message}`);
      }

      if (!data) {
        throw new Error("Contrato não encontrado");
      }

      // Check if contract is in the right status for signing
      if (data.status !== "Aprovado" && data.status !== "Pendente") {
        throw new Error(
          "Este contrato não está disponível para assinatura. Status atual: " +
            data.status,
        );
      }

      setContract({
        id: data.id,
        contract_code: data.contract_code || `CONT-${data.id}`,
        contract_content: data.contract_content || "",
        status: data.status,
        client: {
          full_name: data.clients?.full_name || "Cliente",
          email: data.clients?.email || "",
        },
      });
    } catch (err) {
      console.error("Error loading contract:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, "");

    // Apply CPF mask: 000.000.000-00
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    return value;
  };

  const validateCPF = (cpf: string): boolean => {
    // Remove formatting
    const numbers = cpf.replace(/\D/g, "");

    // Check if has 11 digits
    if (numbers.length !== 11) return false;

    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(numbers)) return false;

    // Validate CPF algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.charAt(10))) return false;

    return true;
  };

  const handleInputChange = (field: keyof SignatureData, value: string) => {
    if (field === "cpf") {
      value = formatCPF(value);
    }

    setSignatureData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSignatureData((prev) => ({ ...prev, document_file: file }));

    // Clear validation error when user selects a file
    if (validationErrors.document_file) {
      setValidationErrors((prev) => ({ ...prev, document_file: undefined }));
    }
  };

  const handleSignatureConfirm = (signatureDataUrl: string) => {
    setSignatureData((prev) => ({
      ...prev,
      signature_data_url: signatureDataUrl,
    }));

    // Clear validation error when user provides signature
    if (validationErrors.signature) {
      setValidationErrors((prev) => ({ ...prev, signature: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!signatureData.full_name.trim()) {
      errors.full_name = "Nome completo é obrigatório";
    }

    if (!signatureData.cpf.trim()) {
      errors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(signatureData.cpf)) {
      errors.cpf = "CPF inválido";
    }

    if (!signatureData.document_file) {
      errors.document_file = "Documento de identificação é obrigatório";
    } else {
      // Validate file type and size
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!allowedTypes.includes(signatureData.document_file.type)) {
        errors.document_file =
          "Formato de arquivo não suportado. Use JPG, PNG ou PDF";
      } else if (signatureData.document_file.size > 5 * 1024 * 1024) {
        // 5MB
        errors.document_file = "Arquivo muito grande. Máximo 5MB";
      }
    }

    if (!signatureData.signature_data_url) {
      errors.signature = "Assinatura é obrigatória";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadSignature = async (
    signatureDataUrl: string,
    contractId: string,
  ): Promise<string> => {
    // Convert data URL to blob
    const blob = await storageService.dataUrlToBlob(signatureDataUrl);
    return await storageService.uploadSignature(contractId, blob);
  };

  const handleSubmit = async () => {
    if (!validateForm() || !contract) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Get client IP (simplified)
      const clientIP = "127.0.0.1"; // In production, get real IP

      // Upload document file
      const documentUrl = await storageService.uploadContractDocument(
        contract.id.toString(),
        signatureData.document_file!,
        "documents",
      );

      // Upload signature
      const signatureUrl = await uploadSignature(
        signatureData.signature_data_url,
        contract.id.toString(),
      );

      // Save signature data to database
      const { error: signatureError } = await supabase
        .from("contract_signatures")
        .insert({
          contract_id: contract.id,
          signer_name: signatureData.full_name,
          signer_cpf: signatureData.cpf.replace(/\D/g, ""), // Store only numbers
          signature_image_url: signatureUrl,
          client_ip: clientIP,
          signed_at: new Date().toISOString(),
        });

      if (signatureError) {
        console.error("Error saving signature:", signatureError);
        throw new Error(`Erro ao salvar assinatura: ${signatureError.message}`);
      }

      // Save document data to database
      const { error: documentError } = await supabase
        .from("contract_documents")
        .insert({
          contract_id: contract.id,
          document_type: "Documento de Identificação",
          document_url: documentUrl,
          uploaded_at: new Date().toISOString(),
        });

      if (documentError) {
        console.error("Error saving document:", documentError);
        throw new Error(`Erro ao salvar documento: ${documentError.message}`);
      }

      // Update contract status to "Em Análise"
      const { error: statusError } = await supabase
        .from("contracts")
        .update({
          status: "Em Análise",
          updated_at: new Date().toISOString(),
        })
        .eq("id", contract.id);

      if (statusError) {
        console.error("Error updating contract status:", statusError);
        throw new Error(
          `Erro ao atualizar status do contrato: ${statusError.message}`,
        );
      }

      // Show success message and redirect
      alert(
        "Contrato assinado com sucesso! O documento foi enviado para análise.",
      );
      navigate("/");
    } catch (err) {
      console.error("Error submitting signature:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContractWithPlaceholders = (content: string) => {
    if (!content) return <p>Conteúdo do contrato não disponível.</p>;

    // Replace placeholders with interactive components
    let processedContent = content;

    // Replace {{nome_completo_cliente}} with input field
    processedContent = processedContent.replace(
      /{{nome_completo_cliente}}/g,
      `<div class="inline-block bg-blue-50 border-2 border-blue-300 rounded p-2 m-1">
        <span class="text-blue-800 font-medium">📝 NOME COMPLETO (preencha abaixo)</span>
      </div>`,
    );

    // Replace {{cpf_cliente}} with input field
    processedContent = processedContent.replace(
      /{{cpf_cliente}}/g,
      `<div class="inline-block bg-green-50 border-2 border-green-300 rounded p-2 m-1">
        <span class="text-green-800 font-medium">🆔 CPF (preencha abaixo)</span>
      </div>`,
    );

    // Replace {{documento_cliente}} with file upload
    processedContent = processedContent.replace(
      /{{documento_cliente}}/g,
      `<div class="inline-block bg-yellow-50 border-2 border-yellow-300 rounded p-2 m-1">
        <span class="text-yellow-800 font-medium">📄 DOCUMENTO (anexe abaixo)</span>
      </div>`,
    );

    // Replace {{assinatura_cliente}} with signature field
    processedContent = processedContent.replace(
      /{{assinatura_cliente}}/g,
      `<div class="inline-block bg-red-50 border-2 border-red-300 rounded p-2 m-1">
        <span class="text-red-800 font-medium">✍️ ASSINATURA (clique abaixo para assinar)</span>
      </div>`,
    );

    return (
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Carregando contrato...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contrato Não Encontrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              O contrato solicitado não foi encontrado ou não está disponível
              para assinatura.
            </p>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFormValid =
    signatureData.full_name.trim() &&
    signatureData.cpf.trim() &&
    validateCPF(signatureData.cpf) &&
    signatureData.document_file &&
    signatureData.signature_data_url;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Assinatura do Contrato {contract.contract_code}
              </h1>
              <p className="text-sm text-gray-600">
                Cliente: {contract.client.full_name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Para finalizar este contrato, você precisa preencher seus dados,
            anexar um documento de identificação e assinar digitalmente. Os
            campos destacados no contrato abaixo devem ser preenchidos nos
            formulários desta página.
          </AlertDescription>
        </Alert>

        {/* Contract Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Conteúdo do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-6">
              {renderContractWithPlaceholders(contract.contract_content)}
            </div>
          </CardContent>
        </Card>

        {/* Form Fields */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={signatureData.full_name}
                  onChange={(e) =>
                    handleInputChange("full_name", e.target.value)
                  }
                  placeholder="Digite seu nome completo"
                  className={validationErrors.full_name ? "border-red-500" : ""}
                />
                {validationErrors.full_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {validationErrors.full_name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  type="text"
                  value={signatureData.cpf}
                  onChange={(e) => handleInputChange("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={validationErrors.cpf ? "border-red-500" : ""}
                />
                {validationErrors.cpf && (
                  <p className="text-sm text-red-600 mt-1">
                    {validationErrors.cpf}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Upload and Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Documento e Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="document">Documento de Identificação *</Label>
                <Input
                  id="document"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className={
                    validationErrors.document_file ? "border-red-500" : ""
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
                </p>
                {validationErrors.document_file && (
                  <p className="text-sm text-red-600 mt-1">
                    {validationErrors.document_file}
                  </p>
                )}
              </div>

              <div>
                <Label>Assinatura Digital *</Label>
                <Button
                  type="button"
                  variant={
                    signatureData.signature_data_url ? "default" : "outline"
                  }
                  onClick={() => setIsSignatureModalOpen(true)}
                  className={`w-full mt-1 ${signatureData.signature_data_url ? "bg-green-600 hover:bg-green-700" : ""} ${validationErrors.signature ? "border-red-500" : ""}`}
                >
                  <PenTool className="mr-2 h-4 w-4" />
                  {signatureData.signature_data_url
                    ? "Assinatura Capturada"
                    : "Clique para Assinar"}
                </Button>
                {validationErrors.signature && (
                  <p className="text-sm text-red-600 mt-1">
                    {validationErrors.signature}
                  </p>
                )}

                {signatureData.signature_data_url && (
                  <div className="mt-2 p-2 border rounded">
                    <img
                      src={signatureData.signature_data_url}
                      alt="Assinatura"
                      className="max-w-full h-20 object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando Assinatura...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Finalizar e Assinar Contrato
                </>
              )}
            </Button>

            {!isFormValid && (
              <p className="text-sm text-gray-500 text-center mt-2">
                Preencha todos os campos obrigatórios para continuar
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Signature Modal */}
      <SignatureCanvas
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onConfirm={handleSignatureConfirm}
        title="Desenhe sua assinatura"
      />
    </div>
  );
};

export default SignaturePage;
