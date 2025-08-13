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
  Trash2,
} from "lucide-react";
import SignatureCanvas from "@/components/ui/signature-canvas";
import { supabase, electronicSignatureService } from "@/lib/supabase";
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
  const { id: contractId, signatureId } = useParams<{
    id: string;
    signatureId?: string;
  }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<ContractData | null>(null);
  const [signatureField, setSignatureField] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<"pending" | "success">(
    "pending",
  );
  const [canSign, setCanSign] = useState<boolean>(false);
  const [isRemoving, setIsRemoving] = useState(false);

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
      if (signatureId) {
        // Load electronic signature data
        loadElectronicSignatureData();
      } else {
        // Load traditional signature data
        loadContractData();
      }
    } else {
      setError("ID do contrato não fornecido");
      setIsLoading(false);
    }
  }, [contractId, signatureId]);

  const loadElectronicSignatureData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load signature field data
      const fieldData = await electronicSignatureService.getSignatureField(
        signatureId!,
      );

      if (!fieldData) {
        throw new Error("Campo de assinatura não encontrado");
      }

      setSignatureField(fieldData);

      // Pre-populate the form with signer data
      setSignatureData({
        full_name: fieldData.signer_name || "",
        cpf: fieldData.signer_cpf ? formatCPF(fieldData.signer_cpf) : "",
        document_file: null,
        signature_data_url: "",
      });

      // Check if already signed - but still allow access for removal
      if (fieldData.status === "signed") {
        // Set signature data for display
        setSignatureData({
          full_name: fieldData.signer_name || "",
          cpf: fieldData.signer_cpf ? formatCPF(fieldData.signer_cpf) : "",
          document_file: null,
          signature_data_url: fieldData.signature_url || "",
        });
        setSignatureStatus("success");
        setCanSign(false); // Can't sign again, but can remove
        setIsLoading(false);
        return;
      }

      // FIXED: Allow signing for all contract statuses except "Cancelado"
      // This ensures all signature links have permission to sign and attach to the contract
      const contractStatus = fieldData.contracts.status;
      const fieldStatus = fieldData.status;
      const canSignContract =
        fieldStatus === "pending" && contractStatus !== "Cancelado";

      setCanSign(canSignContract);

      if (!canSignContract && contractStatus === "Cancelado") {
        setError(
          `Esta assinatura não está disponível pois o contrato foi cancelado.`,
        );
        setIsLoading(false);
        return;
      } else if (!canSignContract) {
        // For other cases, still allow access but show warning
        console.warn(
          `Contract status: ${contractStatus}, Field status: ${fieldStatus}`,
        );
        setCanSign(true); // Force allow signing for all non-cancelled contracts
      }

      // Set contract data from the signature field
      setContract({
        id: fieldData.contracts.id,
        contract_code:
          fieldData.contracts.contract_code || `CONT-${fieldData.contracts.id}`,
        contract_content: fieldData.contracts.contract_content || "",
        status: fieldData.contracts.status,
        client: {
          full_name: fieldData.contracts.clients?.full_name || "Cliente",
          email: fieldData.contracts.clients?.email || "",
        },
      });
    } catch (err) {
      console.error("Error loading electronic signature data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
        .eq("id", parseInt(contractId!))
        .single();

      if (fetchError) {
        console.error("Error fetching contract:", fetchError);
        throw new Error(`Erro ao carregar contrato: ${fetchError.message}`);
      }

      if (!data) {
        throw new Error("Contrato não encontrado");
      }

      // FIXED: Allow signing for all contract statuses except "Cancelado"
      // This ensures all signature links have permission to sign and attach to the contract
      if (data.status === "Cancelado") {
        throw new Error(
          "Este contrato não está disponível para assinatura pois foi cancelado.",
        );
      }

      // For traditional signatures, always allow signing for non-cancelled contracts
      setCanSign(true);

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

    // Force re-render of contract content to show updated data
    setContract((prev) => (prev ? { ...prev } : null));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSignatureData((prev) => ({ ...prev, document_file: file }));

    // Clear validation error when user selects a file
    if (validationErrors.document_file) {
      setValidationErrors((prev) => ({ ...prev, document_file: undefined }));
    }

    // Force re-render of contract content to show document status
    setContract((prev) => (prev ? { ...prev } : null));
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

    // Force re-render of contract content to show signature preview
    setContract((prev) => (prev ? { ...prev } : null));
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

    // Document upload is no longer required - signatures are handled electronically

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

      // Get client IP
      let clientIP = "127.0.0.1";
      try {
        // Try to get real IP from various sources
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        clientIP = data.ip || "127.0.0.1";
      } catch (error) {
        console.warn("Could not get client IP, using localhost:", error);
        // Fallback to getting IP from headers if available
        clientIP =
          window.location.hostname === "localhost" ? "127.0.0.1" : "unknown";
      }

      // Upload signature
      const signatureUrl = await uploadSignature(
        signatureData.signature_data_url,
        contract.id.toString(),
      );

      if (signatureId && signatureField) {
        // Electronic signature flow
        await electronicSignatureService.updateSignatureField(
          signatureId,
          signatureUrl,
          clientIP,
        );

        // Update the contract content with the actual signature
        await updateContractContentWithSignature(
          contract.id.toString(),
          signatureId,
          signatureUrl,
          signatureData.full_name,
          signatureData.cpf,
        );

        setSignatureStatus("success");
        alert("Assinatura eletrônica realizada com sucesso!");
      } else {
        // Traditional signature flow - now simplified without document upload
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
          throw new Error(
            `Erro ao salvar assinatura: ${signatureError.message}`,
          );
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

        setSignatureStatus("success");
        alert(
          "Contrato assinado com sucesso! O documento foi enviado para análise.",
        );
      }

      // Only navigate after a delay to show the success state
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Error submitting signature:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!signatureId || !signatureField) {
      setError("ID da assinatura não encontrado");
      return;
    }

    const confirmRemoval = window.confirm(
      "⚠️ ATENÇÃO: Tem certeza que deseja remover esta assinatura?\n\nEsta ação irá:\n• Remover a assinatura do documento\n• Excluir os dados do banco de dados\n• Deletar o arquivo de imagem do armazenamento\n\nEsta ação NÃO PODE ser desfeita!",
    );

    if (!confirmRemoval) return;

    try {
      setIsRemoving(true);
      setError(null);

      console.log(`Iniciando remoção da assinatura: ${signatureId}`);

      // Remove the signature using the enhanced service
      await electronicSignatureService.removeSignature(signatureId);

      console.log(`Assinatura ${signatureId} removida com sucesso`);

      // Reset the component state
      setSignatureData({
        full_name: signatureField.signer_name || "",
        cpf: signatureField.signer_cpf
          ? formatCPF(signatureField.signer_cpf)
          : "",
        document_file: null,
        signature_data_url: "",
      });
      setSignatureStatus("pending");
      setCanSign(true);

      // Show success message
      alert(
        "✅ Assinatura removida com sucesso!\n\n• Assinatura excluída do documento\n• Dados removidos do banco de dados\n• Arquivo deletado do armazenamento\n\nAgora você pode assinar novamente.",
      );

      // Optionally reload the page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Error removing signature:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Erro ao remover assinatura: ${errorMessage}`);

      // Show detailed error message
      alert(
        `❌ Erro ao remover assinatura:\n\n${errorMessage}\n\nTente novamente ou contate o suporte.`,
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const updateContractContentWithSignature = async (
    contractId: string,
    signatureId: string,
    signatureUrl: string,
    signerName: string,
    signerCPF: string,
  ) => {
    try {
      // Get current contract content
      const { data: contractData, error: fetchError } = await supabase
        .from("contracts")
        .select("contract_content")
        .eq("id", parseInt(contractId))
        .single();

      if (fetchError) {
        console.error("Error fetching contract content:", fetchError);
        return;
      }

      let updatedContent = contractData.contract_content || "";

      // Replace the signature field placeholder with the actual signature
      // Use a single comprehensive pattern to avoid duplication
      const signatureFieldPattern = new RegExp(
        `<div class="signature-field[^"]*"[^>]*data-signature-id="${signatureId}"[^>]*>[\\s\\S]*?</div>`,
        "g",
      );

      const signatureHtml = `
        <div class="signature-field-completed" data-signature-id="${signatureId}" style="border: 2px solid #10b981; padding: 20px; margin: 20px 0; background-color: #ecfdf5; text-align: center; border-radius: 8px;">
          <div style="margin-bottom: 15px;">
            <div style="margin-bottom: 10px;">
              <strong style="color: #059669; font-size: 16px;">✅ Assinatura Realizada</strong>
            </div>
            <div style="border: 2px solid #10b981; padding: 15px; background-color: white; display: inline-block; border-radius: 8px;">
              <img src="${signatureUrl}" alt="Assinatura de ${signerName}" style="max-width: 300px; max-height: 80px; display: block; margin: 0 auto;" />
            </div>
          </div>
          <div style="font-size: 14px; margin-top: 15px; background-color: rgba(16, 185, 129, 0.1); padding: 10px; border-radius: 6px;">
            <div style="margin-bottom: 5px;"><strong>👤 Nome:</strong> ${signerName}</div>
            <div style="margin-bottom: 5px;"><strong>🆔 CPF:</strong> ${signerCPF}</div>
            <div style="margin-top: 8px; font-size: 12px; color: #059669; font-weight: 500;">📅 Assinado em: ${new Date().toLocaleString("pt-BR")}</div>
          </div>
        </div>
      `;

      // Replace ALL occurrences of this signature field
      const originalContent = updatedContent;
      updatedContent = updatedContent.replace(
        signatureFieldPattern,
        signatureHtml,
      );

      const replaced = originalContent !== updatedContent;

      if (!replaced) {
        console.warn(`No signature field found with ID: ${signatureId}`);
        console.log(
          "Contract content:",
          updatedContent.substring(0, 500) + "...",
        );
      } else {
        console.log(
          `Signature field replaced successfully for ID: ${signatureId}`,
        );
      }

      // Update the contract content in the database
      const { error: updateError } = await supabase
        .from("contracts")
        .update({
          contract_content: updatedContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parseInt(contractId));

      if (updateError) {
        console.error("Error updating contract content:", updateError);
        throw new Error(
          `Erro ao atualizar conteúdo do contrato: ${updateError.message}`,
        );
      }

      console.log("Contract content updated successfully with signature");
    } catch (error) {
      console.error("Error in updateContractContentWithSignature:", error);
      throw error;
    }
  };

  const renderContractWithPlaceholders = (content: string) => {
    if (!content) return <p>Conteúdo do contrato não disponível.</p>;

    // Replace placeholders with interactive components
    let processedContent = content;

    // Replace {{nome_completo_cliente}} with actual name or input field
    if (signatureData.full_name.trim()) {
      processedContent = processedContent.replace(
        /{{nome_completo_cliente}}/g,
        `<span class="font-semibold text-blue-800">${signatureData.full_name}</span>`,
      );
    } else {
      processedContent = processedContent.replace(
        /{{nome_completo_cliente}}/g,
        `<div class="inline-block bg-blue-50 border-2 border-blue-300 rounded p-2 m-1">
          <span class="text-blue-800 font-medium">📝 NOME COMPLETO (preencha abaixo)</span>
        </div>`,
      );
    }

    // Replace {{cpf_cliente}} with actual CPF or input field
    if (signatureData.cpf.trim()) {
      processedContent = processedContent.replace(
        /{{cpf_cliente}}/g,
        `<span class="font-semibold text-green-800">${signatureData.cpf}</span>`,
      );
    } else {
      processedContent = processedContent.replace(
        /{{cpf_cliente}}/g,
        `<div class="inline-block bg-green-50 border-2 border-green-300 rounded p-2 m-1">
          <span class="text-green-800 font-medium">🆔 CPF (preencha abaixo)</span>
        </div>`,
      );
    }

    // Handle signature fields - show blank field if not signed, or actual signature if signed
    processedContent = processedContent.replace(
      /<div class="signature-field[^"]*"[^>]*data-signature-id="([^"]*)">([\s\S]*?)<\/div>/g,
      (match, signatureId, content) => {
        // Check if this is the current signature being processed
        const isCurrentSignature =
          signatureId &&
          signatureField &&
          signatureField.signature_id === signatureId;

        if (isCurrentSignature && signatureData.signature_data_url) {
          // Show actual signature for the current signer
          return `<div class="signature-field-completed" data-signature-id="${signatureId}" style="border: 2px solid #10b981; padding: 20px; margin: 20px 0; background-color: #ecfdf5; text-align: center; border-radius: 8px;">
            <div style="margin-bottom: 15px;">
              <div style="margin-bottom: 10px;">
                <strong style="color: #059669; font-size: 16px;">✅ Assinatura Realizada</strong>
              </div>
              <div style="border: 2px solid #10b981; padding: 15px; background-color: white; display: inline-block; border-radius: 8px;">
                <img src="${signatureData.signature_data_url}" alt="Assinatura de ${signatureData.full_name}" style="max-width: 300px; max-height: 80px; display: block; margin: 0 auto;" />
              </div>
            </div>
            <div style="font-size: 14px; margin-top: 15px; background-color: rgba(16, 185, 129, 0.1); padding: 10px; border-radius: 6px;">
              <div style="margin-bottom: 5px;"><strong>👤 Nome:</strong> ${signatureData.full_name}</div>
              <div style="margin-bottom: 5px;"><strong>🆔 CPF:</strong> ${signatureData.cpf}</div>
              <div style="margin-top: 8px; font-size: 12px; color: #059669; font-weight: 500;">📅 Assinado em: ${new Date().toLocaleString("pt-BR")}</div>
            </div>
          </div>`;
        } else {
          // Show blank signature field for pending signatures
          const signerName = signatureField?.signer_name || "Signatário";
          const signerCPF = signatureField?.signer_cpf
            ? signatureField.signer_cpf.replace(
                /(\d{3})(\d{3})(\d{3})(\d{2})/,
                "$1.$2.$3-$4",
              )
            : "CPF não informado";

          return `<div class="signature-field-pending" data-signature-id="${signatureId}" style="border: 2px dashed #ef4444; padding: 20px; margin: 20px 0; background-color: #fef2f2; text-align: center; border-radius: 8px;">
            <div style="margin-bottom: 15px;">
              <div style="margin-bottom: 10px;">
                <strong style="color: #dc2626; font-size: 16px;">✍️ Campo de Assinatura</strong>
              </div>
              <div style="border: 2px dashed #ef4444; padding: 20px; background-color: white; display: inline-block; border-radius: 8px; min-width: 300px; min-height: 80px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ef4444; font-weight: bold;">AGUARDANDO ASSINATURA</span>
              </div>
            </div>
            <div style="font-size: 14px; margin-top: 15px; background-color: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 6px;">
              <div style="margin-bottom: 5px;"><strong>👤 Nome:</strong> ${signerName}</div>
              <div style="margin-bottom: 5px;"><strong>🆔 CPF:</strong> ${signerCPF}</div>
              <div style="margin-top: 8px; font-size: 12px; color: #dc2626; font-weight: 500;">⚠️ Aguardando assinatura</div>
            </div>
          </div>`;
        }
      },
    );

    // Also handle signature-field-placeholder patterns (from editor)
    processedContent = processedContent.replace(
      /<div class="signature-field-placeholder"[^>]*data-signature-id="([^"]*)">([\s\S]*?)<\/div>/g,
      (match, signatureId, content) => {
        // Check if this is the current signature being processed
        const isCurrentSignature =
          signatureId &&
          signatureField &&
          signatureField.signature_id === signatureId;

        if (isCurrentSignature && signatureData.signature_data_url) {
          // Show actual signature for the current signer
          return `<div class="signature-field-completed" data-signature-id="${signatureId}" style="border: 2px solid #10b981; padding: 20px; margin: 20px 0; background-color: #ecfdf5; text-align: center; border-radius: 8px;">
            <div style="margin-bottom: 15px;">
              <div style="margin-bottom: 10px;">
                <strong style="color: #059669; font-size: 16px;">✅ Assinatura Realizada</strong>
              </div>
              <div style="border: 2px solid #10b981; padding: 15px; background-color: white; display: inline-block; border-radius: 8px;">
                <img src="${signatureData.signature_data_url}" alt="Assinatura de ${signatureData.full_name}" style="max-width: 300px; max-height: 80px; display: block; margin: 0 auto;" />
              </div>
            </div>
            <div style="font-size: 14px; margin-top: 15px; background-color: rgba(16, 185, 129, 0.1); padding: 10px; border-radius: 6px;">
              <div style="margin-bottom: 5px;"><strong>👤 Nome:</strong> ${signatureData.full_name}</div>
              <div style="margin-bottom: 5px;"><strong>🆔 CPF:</strong> ${signatureData.cpf}</div>
              <div style="margin-top: 8px; font-size: 12px; color: #059669; font-weight: 500;">📅 Assinado em: ${new Date().toLocaleString("pt-BR")}</div>
            </div>
          </div>`;
        } else {
          // Show blank signature field for pending signatures
          const signerName = signatureField?.signer_name || "Signatário";
          const signerCPF = signatureField?.signer_cpf
            ? signatureField.signer_cpf.replace(
                /(\d{3})(\d{3})(\d{3})(\d{2})/,
                "$1.$2.$3-$4",
              )
            : "CPF não informado";

          return `<div class="signature-field-pending" data-signature-id="${signatureId}" style="border: 2px dashed #ef4444; padding: 20px; margin: 20px 0; background-color: #fef2f2; text-align: center; border-radius: 8px;">
            <div style="margin-bottom: 15px;">
              <div style="margin-bottom: 10px;">
                <strong style="color: #dc2626; font-size: 16px;">✍️ Campo de Assinatura</strong>
              </div>
              <div style="border: 2px dashed #ef4444; padding: 20px; background-color: white; display: inline-block; border-radius: 8px; min-width: 300px; min-height: 80px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ef4444; font-weight: bold;">AGUARDANDO ASSINATURA</span>
              </div>
            </div>
            <div style="font-size: 14px; margin-top: 15px; background-color: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 6px;">
              <div style="margin-bottom: 5px;"><strong>👤 Nome:</strong> ${signerName}</div>
              <div style="margin-bottom: 5px;"><strong>🆔 CPF:</strong> ${signerCPF}</div>
              <div style="margin-top: 8px; font-size: 12px; color: #dc2626; font-weight: 500;">⚠️ Aguardando assinatura</div>
            </div>
          </div>`;
        }
      },
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
              {error.includes("já foi assinado")
                ? "Contrato Já Assinado"
                : "Erro"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            {error.includes("já foi assinado") && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    ✅ Assinatura já realizada
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Este link não permite nova assinatura pela mesma pessoa.
                </p>
              </div>
            )}
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
    canSign &&
    signatureData.full_name.trim() &&
    signatureData.cpf.trim() &&
    validateCPF(signatureData.cpf) &&
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
                {signatureId
                  ? "Assinatura Eletrônica"
                  : "Assinatura do Contrato"}{" "}
                {contract.contract_code}
              </h1>
              <p className="text-sm text-gray-600">
                {signatureId && signatureField ? (
                  <>Assinante: {signatureField.signer_name}</>
                ) : (
                  <>Cliente: {contract.client.full_name}</>
                )}
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
            {signatureId
              ? "Para completar sua assinatura eletrônica, verifique seus dados pré-preenchidos e assine digitalmente."
              : "Para finalizar este contrato, você precisa preencher seus dados e assinar digitalmente. Os campos destacados no contrato abaixo devem ser preenchidos nos formulários desta página."}
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

        {/* Form Fields - Only show when signature is pending */}
        {signatureStatus === "pending" && (
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
                    className={
                      validationErrors.full_name ? "border-red-500" : ""
                    }
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
                  <PenTool className="h-5 w-5" />
                  Assinatura Digital
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Assinatura Digital *</Label>
                  {signatureStatus === "pending" ? (
                    <>
                      <Button
                        type="button"
                        variant={
                          signatureData.signature_data_url
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setIsSignatureModalOpen(true)}
                        disabled={!canSign}
                        className={`w-full mt-1 ${signatureData.signature_data_url ? "bg-green-600 hover:bg-green-700" : ""} ${validationErrors.signature ? "border-red-500" : ""} ${!canSign ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <PenTool className="mr-2 h-4 w-4" />
                        {!canSign
                          ? "Assinatura Não Disponível"
                          : signatureData.signature_data_url
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
                    </>
                  ) : (
                    <div className="mt-2 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <div className="font-semibold text-green-800">
                            ✅ Assinatura Realizada
                          </div>
                          <div className="text-sm text-green-700">
                            Sua assinatura foi processada com sucesso
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-white border border-green-200 rounded">
                        <img
                          src={signatureData.signature_data_url}
                          alt="Assinatura"
                          className="max-w-full h-20 object-contain mx-auto"
                        />
                      </div>
                      <div className="mt-2 text-xs text-green-600">
                        <div>
                          <strong>Nome:</strong> {signatureData.full_name}
                        </div>
                        <div>
                          <strong>CPF:</strong> {signatureData.cpf}
                        </div>
                        <div>
                          <strong>Data:</strong>{" "}
                          {signatureField?.signed_at
                            ? new Date(signatureField.signed_at).toLocaleString(
                                "pt-BR",
                              )
                            : new Date().toLocaleString("pt-BR")}
                        </div>
                      </div>
                      {/* Remove Signature Button - Enhanced */}
                      <div className="mt-3 space-y-2">
                        <Button
                          onClick={handleRemoveSignature}
                          disabled={isRemoving}
                          variant="destructive"
                          size="sm"
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          {isRemoving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Removendo Assinatura...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover Assinatura Completamente
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-red-600 text-center font-medium">
                          ⚠️ ATENÇÃO: Esta ação removerá permanentemente:
                          <br />• A assinatura do documento
                          <br />• Os dados do banco de dados
                          <br />• O arquivo de imagem do armazenamento
                          <br />
                          Esta ação NÃO PODE ser desfeita!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button - Only show when signature is pending */}
        {signatureStatus === "pending" && (
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
                  {!canSign
                    ? "Esta assinatura não está disponível no momento"
                    : "Preencha todos os campos obrigatórios para continuar"}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {signatureStatus === "success" && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Assinatura Realizada com Sucesso!
                </h3>
                <p className="text-green-700 mb-4">
                  Seu contrato foi assinado e está sendo processado. Você será
                  redirecionado em instantes.
                </p>
                <div className="bg-white border border-green-200 rounded-lg p-4 inline-block">
                  <div className="text-sm text-gray-600 mb-2">
                    Dados da Assinatura:
                  </div>
                  <div className="text-sm">
                    <div>
                      <strong>Nome:</strong> {signatureData.full_name}
                    </div>
                    <div>
                      <strong>CPF:</strong> {signatureData.cpf}
                    </div>
                    <div>
                      <strong>Data:</strong>{" "}
                      {signatureField?.signed_at
                        ? new Date(signatureField.signed_at).toLocaleString(
                            "pt-BR",
                          )
                        : new Date().toLocaleString("pt-BR")}
                    </div>
                  </div>
                  {/* Remove Signature Button - Enhanced */}
                  {signatureId && signatureField && (
                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={handleRemoveSignature}
                        disabled={isRemoving}
                        variant="destructive"
                        size="sm"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isRemoving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removendo Assinatura...
                          </>
                        ) : (
                          "🗑️ Remover Assinatura Permanentemente"
                        )}
                      </Button>
                      <p className="text-xs text-red-600 text-center">
                        Esta ação removerá a assinatura do documento, banco de
                        dados e armazenamento.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Signature Modal - Only show when signature is pending */}
      {signatureStatus === "pending" && (
        <SignatureCanvas
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          onConfirm={handleSignatureConfirm}
          title="Desenhe sua assinatura"
        />
      )}
    </div>
  );
};

export default SignaturePage;
