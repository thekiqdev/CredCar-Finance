import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  User,
  FileText,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Eye,
  AlertCircle,
  Edit3,
  Trash2,
  Edit,
  PenTool,
  ExternalLink,
} from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import {
  supabase,
  authService,
  contractService,
  contractTemplateService,
} from "@/lib/supabase";
import { Database } from "@/types/supabase";

type ContractStatus = Database["public"]["Enums"]["contract_status"];

interface ContractData {
  id: number;
  contract_code: string;
  total_value: number;
  remaining_value: number;
  total_installments: number;
  paid_installments: number;
  status: ContractStatus;
  created_at: string;
  contract_content: string | null;
  client: {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
    cpf_cnpj: string | null;
    address: string | null;
  };
  commission_table: {
    id: number;
    name: string;
    commission_percentage: number;
    payment_details: string | null;
    payment_installments: number;
  };
  representative: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    commission_code: string | null;
  };
  quota: {
    id: number;
    quota_number: number;
    group: {
      id: number;
      name: string;
      description: string | null;
    };
  } | null;
  invoices: {
    id: number;
    invoice_code: string;
    value: number;
    due_date: string;
    status: string;
    paid_at: string | null;
    payment_link_pix: string | null;
    payment_link_boleto: string | null;
  }[];
}

interface ContractDetailsProps {
  contractId?: string;
  onBack?: () => void;
}

const ContractDetails: React.FC<ContractDetailsProps> = ({
  contractId: propContractId,
  onBack,
}) => {
  const { id: paramContractId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contractId = propContractId || paramContractId;

  const [contract, setContract] = useState<ContractData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const editorRef = useRef<any>(null);

  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === "Administrador";
  const isRepresentative = currentUser?.role === "Representante";
  const canEditOrDelete =
    contract &&
    isRepresentative &&
    (contract.status === "Pendente" || contract.status === "Reprovado") &&
    contract.representative.id === currentUser?.id;

  useEffect(() => {
    if (!contractId) {
      setError("ID do contrato não fornecido");
      setIsLoading(false);
      return;
    }

    loadContractDetails();
    loadAvailableTemplates();
  }, [contractId]);

  // Check if edit mode should be enabled after contract is loaded
  useEffect(() => {
    if (contract && canEditOrDelete) {
      // Check if edit mode is requested via URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const editParam = urlParams.get("edit");
      if (editParam === "true") {
        setIsEditMode(true);
      }
    }
  }, [contract, canEditOrDelete]);

  const loadAvailableTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const templates = await contractTemplateService.getAll(isAdmin);
      setAvailableTemplates(templates);
    } catch (error) {
      console.error("Error loading templates:", error);
      // Don't show error for templates, it's not critical
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadContractDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("contracts")
        .select(
          `
          *,
          clients!inner (
            id,
            full_name,
            email,
            phone,
            cpf_cnpj,
            address
          ),
          commission_tables!inner (
            id,
            name,
            commission_percentage,
            payment_details,
            payment_installments
          ),
          profiles!inner (
            id,
            full_name,
            email,
            phone,
            commission_code
          ),
          quotas (
            id,
            quota_number,
            groups (
              id,
              name,
              description
            )
          ),
          invoices (
            id,
            invoice_code,
            value,
            due_date,
            status,
            paid_at,
            payment_link_pix,
            payment_link_boleto
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

      // Transform the data to match our interface
      const contractData: ContractData = {
        id: data.id,
        contract_code:
          data.contract_code || data.contract_number || `CONT-${data.id}`,
        total_value: parseFloat(data.total_value || data.credit_amount || "0"),
        remaining_value: parseFloat(
          data.remaining_value ||
            data.remaining_payments ||
            data.credit_amount ||
            "0",
        ),
        total_installments: data.total_installments || 0,
        paid_installments: data.paid_installments || 0,
        status: data.status,
        created_at: data.created_at || new Date().toISOString(),
        contract_content: data.contract_content,
        client: {
          id: data.clients?.id || 0,
          full_name:
            data.clients?.full_name ||
            data.clients?.name ||
            "Cliente não encontrado",
          email: data.clients?.email,
          phone: data.clients?.phone,
          cpf_cnpj: data.clients?.cpf_cnpj,
          address: data.clients?.address,
        },
        commission_table: {
          id: data.commission_tables?.id || 0,
          name: data.commission_tables?.name || "Tabela não encontrada",
          commission_percentage:
            data.commission_tables?.commission_percentage || 0,
          payment_details: data.commission_tables?.payment_details,
          payment_installments:
            data.commission_tables?.payment_installments || 1,
        },
        representative: {
          id: data.profiles?.id || "",
          full_name: data.profiles?.full_name || "Representante não encontrado",
          email: data.profiles?.email || "",
          phone: data.profiles?.phone,
          commission_code: data.profiles?.commission_code,
        },
        quota: data.quotas
          ? {
              id: data.quotas.id,
              quota_number: data.quotas.quota_number,
              group: {
                id: data.quotas.groups?.id || 0,
                name: data.quotas.groups?.name || "Grupo não encontrado",
                description: data.quotas.groups?.description,
              },
            }
          : null,
        invoices: data.invoices || [],
      };

      setContract(contractData);
    } catch (err) {
      console.error("Error loading contract details:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveContent = async () => {
    if (!contract || !currentUser) return;

    try {
      setIsProcessing(true);

      const content = editorRef.current
        ? editorRef.current.getContent()
        : editedContent;

      console.log("Saving contract content:", {
        contractId: contract.id,
        userId: currentUser.id,
        isAdmin,
        contentLength: content.length,
      });

      // Direct database update instead of using the service to avoid permission issues
      const { data, error } = await supabase
        .from("contracts")
        .update({
          contract_content: content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contract.id)
        .select()
        .single();

      if (error) {
        console.error("Database error saving contract content:", error);
        throw new Error(`Erro do banco de dados: ${error.message}`);
      }

      console.log("Contract content saved successfully:", data);

      // Update the contract state with the new content
      setContract({ ...contract, contract_content: content });
      setIsEditingContent(false);
      setIsEditMode(false); // Exit edit mode after saving
      alert("Conteúdo do contrato salvo com sucesso!");
    } catch (err) {
      console.error("Error saving contract content:", err);

      // Preserve the editor content on error
      const currentContent = editorRef.current
        ? editorRef.current.getContent()
        : editedContent;
      setEditedContent(currentContent);

      // Provide more detailed error messages
      let errorMessage = "Erro desconhecido";

      if (err instanceof Error) {
        errorMessage = err.message;

        // Handle specific error cases
        if (
          err.message.includes("permission") ||
          err.message.includes("permissão")
        ) {
          errorMessage = "Você não tem permissão para editar este contrato";
        } else if (
          err.message.includes("not found") ||
          err.message.includes("não encontrado")
        ) {
          errorMessage = "Contrato não encontrado";
        } else if (
          err.message.includes("network") ||
          err.message.includes("fetch")
        ) {
          errorMessage =
            "Erro de conexão. Verifique sua internet e tente novamente";
        } else if (
          err.message.includes("Database") ||
          err.message.includes("banco de dados")
        ) {
          errorMessage = `Erro no banco de dados: ${err.message.replace("Erro do banco de dados: ", "")}`;
        }
      }

      alert(`Erro ao salvar conteúdo: ${errorMessage}`);

      // Don't exit edit mode on error to preserve user's work
      console.log("Preserving edit mode due to error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditContent = () => {
    const currentContent = contract?.contract_content || "";
    console.log(
      "Starting content edit with content length:",
      currentContent.length,
    );
    setEditedContent(currentContent);
    setIsEditingContent(true);
  };

  const handleInsertTemplate = async () => {
    if (!selectedTemplateId || !editorRef.current) {
      alert("Por favor, selecione um modelo primeiro");
      return;
    }

    try {
      const template = availableTemplates.find(
        (t) => t.id.toString() === selectedTemplateId,
      );
      if (!template) {
        alert("Modelo não encontrado");
        return;
      }

      // Get current content from editor
      const currentContent = editorRef.current.getContent();

      // Insert template content at cursor position or append if no cursor
      const templateContent = template.content;

      // If there's existing content, add a separator
      const separator = currentContent.trim() ? "<br><br><hr><br><br>" : "";
      const newContent = currentContent + separator + templateContent;

      // Set the new content in the editor
      editorRef.current.setContent(newContent);
      setEditedContent(newContent);

      // Reset template selection
      setSelectedTemplateId("");

      alert(`Modelo "${template.name}" inserido com sucesso!`);
    } catch (error) {
      console.error("Error inserting template:", error);
      alert("Erro ao inserir modelo");
    }
  };

  const handleApproveContract = async () => {
    if (!contract) return;

    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from("contracts")
        .update({ status: "Aprovado" as ContractStatus })
        .eq("id", contract.id);

      if (error) {
        throw new Error(`Erro ao aprovar contrato: ${error.message}`);
      }

      setContract({ ...contract, status: "Aprovado" });
      setIsApprovalDialogOpen(false);
      alert("Contrato aprovado com sucesso!");
    } catch (err) {
      console.error("Error approving contract:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      alert(`Erro ao aprovar contrato: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectContract = async () => {
    if (!contract || !rejectionReason.trim()) {
      alert("Por favor, forneça um motivo para a rejeição");
      return;
    }

    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from("contracts")
        .update({ status: "Reprovado" as ContractStatus })
        .eq("id", contract.id);

      if (error) {
        throw new Error(`Erro ao reprovar contrato: ${error.message}`);
      }

      setContract({ ...contract, status: "Reprovado" });
      setIsRejectionDialogOpen(false);
      setRejectionReason("");
      alert("Contrato reprovado com sucesso!");
    } catch (err) {
      console.error("Error rejecting contract:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      alert(`Erro ao reprovar contrato: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!contract || !currentUser) return;

    try {
      setIsProcessing(true);

      await contractService.delete(
        contract.id.toString(),
        currentUser.id,
        isAdmin,
      );

      alert("Contrato excluído com sucesso!");
      handleBack();
    } catch (err) {
      console.error("Error deleting contract:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      alert(`Erro ao excluir contrato: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: ContractStatus) => {
    const statusConfig = {
      Pendente: {
        variant: "outline" as const,
        className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      },
      "Em Análise": {
        variant: "outline" as const,
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      },
      Aprovado: {
        variant: "outline" as const,
        className: "bg-green-100 text-green-800 hover:bg-green-100",
      },
      Reprovado: {
        variant: "outline" as const,
        className: "bg-red-100 text-red-800 hover:bg-red-100",
      },
      Ativo: {
        variant: "outline" as const,
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      },
      Concluído: {
        variant: "outline" as const,
        className: "bg-green-100 text-green-800 hover:bg-green-100",
      },
      Faturado: {
        variant: "outline" as const,
        className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      },
      Cancelado: {
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
      },
      "Em Atraso": {
        variant: "outline" as const,
        className: "bg-red-100 text-red-800 hover:bg-red-100",
      },
    };

    const config = statusConfig[status] || statusConfig["Pendente"];
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Carregando detalhes do contrato...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">
            Erro ao Carregar Contrato
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">
            Contrato Não Encontrado
          </h2>
          <p className="text-muted-foreground mb-4">
            O contrato solicitado não foi encontrado no sistema.
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const commissionValue =
    contract.total_value *
    (contract.commission_table.commission_percentage / 100);

  return (
    <div className="bg-background">
      {/* Header */}
      <header className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Contrato {contract.contract_code}
              </h1>
              <p className="text-sm text-muted-foreground">
                Criado em {formatDate(contract.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(contract.status)}

            {/* Public Signature Link - Show for Pendente status */}
            {contract.status === "Pendente" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const signatureUrl = `${window.location.origin}/sign/${contract.id}`;
                  navigator.clipboard.writeText(signatureUrl);
                  alert(
                    "Link de assinatura copiado para a área de transferência!",
                  );
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PenTool className="mr-2 h-4 w-4" />
                Enviar para Assinatura
              </Button>
            )}

            {/* Show signature link for approved contracts too */}
            {contract.status === "Aprovado" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const signatureUrl = `${window.location.origin}/sign/${contract.id}`;
                  navigator.clipboard.writeText(signatureUrl);
                  alert(
                    "Link de assinatura copiado para a área de transferência!",
                  );
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <PenTool className="mr-2 h-4 w-4" />
                Copiar Link de Assinatura
              </Button>
            )}

            {/* Admin Actions */}
            {isAdmin &&
              (contract.status === "Pendente" ||
                contract.status === "Em Análise") && (
                <div className="flex gap-2">
                  <Dialog
                    open={isApprovalDialogOpen}
                    onOpenChange={setIsApprovalDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Aprovar Contrato</DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja aprovar o contrato{" "}
                          {contract.contract_code}? Esta ação não pode ser
                          desfeita.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsApprovalDialogOpen(false)}
                          disabled={isProcessing}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleApproveContract}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing ? "Processando..." : "Aprovar Contrato"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={isRejectionDialogOpen}
                    onOpenChange={setIsRejectionDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <XCircle className="mr-2 h-4 w-4" />
                        Reprovar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reprovar Contrato</DialogTitle>
                        <DialogDescription>
                          Forneça um motivo para a reprovação do contrato{" "}
                          {contract.contract_code}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="rejection-reason">
                            Motivo da Reprovação
                          </Label>
                          <Textarea
                            id="rejection-reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Descreva o motivo da reprovação..."
                            className="mt-1"
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsRejectionDialogOpen(false);
                            setRejectionReason("");
                          }}
                          disabled={isProcessing}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleRejectContract}
                          disabled={isProcessing || !rejectionReason.trim()}
                        >
                          {isProcessing
                            ? "Processando..."
                            : "Reprovar Contrato"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

            {/* Admin Delete Action */}
            {isAdmin && (
              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Excluir Contrato</DialogTitle>
                    <DialogDescription>
                      Tem certeza que deseja excluir o contrato{" "}
                      {contract.contract_code}? Esta ação não pode ser desfeita.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteDialogOpen(false)}
                      disabled={isProcessing}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteContract}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Excluindo..." : "Excluir Contrato"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Representative Actions */}
            {canEditOrDelete && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditMode(!isEditMode);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {isEditMode ? "Cancelar Edição" : "Editar"}
                </Button>

                <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Excluir Contrato</DialogTitle>
                      <DialogDescription>
                        Tem certeza que deseja excluir o contrato{" "}
                        {contract.contract_code}? Esta ação não pode ser
                        desfeita.
                        <br />
                        <br />
                        <strong>Nota:</strong> Você só pode excluir contratos
                        com status Pendente ou Reprovado.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                        disabled={isProcessing}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteContract}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Excluindo..." : "Excluir Contrato"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="client">Cliente</TabsTrigger>
            <TabsTrigger value="payment">Pagamentos</TabsTrigger>
            <TabsTrigger value="commission">Comissão</TabsTrigger>
            <TabsTrigger value="content">Conteúdo do Contrato</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Contract Information Edit Form */}
            {isEditMode && canEditOrDelete && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Editar Informações do Contrato
                  </CardTitle>
                  <CardDescription>
                    Edite as informações básicas do contrato. Apenas campos
                    editáveis são mostrados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="edit-client-name">Nome do Cliente</Label>
                      <Input
                        id="edit-client-name"
                        value={contract.client.full_name}
                        onChange={(e) => {
                          setContract({
                            ...contract,
                            client: {
                              ...contract.client,
                              full_name: e.target.value,
                            },
                          });
                        }}
                        placeholder="Nome completo do cliente"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-client-email">
                        Email do Cliente
                      </Label>
                      <Input
                        id="edit-client-email"
                        type="email"
                        value={contract.client.email || ""}
                        onChange={(e) => {
                          setContract({
                            ...contract,
                            client: {
                              ...contract.client,
                              email: e.target.value,
                            },
                          });
                        }}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-client-phone">
                        Telefone do Cliente
                      </Label>
                      <Input
                        id="edit-client-phone"
                        value={contract.client.phone || ""}
                        onChange={(e) => {
                          setContract({
                            ...contract,
                            client: {
                              ...contract.client,
                              phone: e.target.value,
                            },
                          });
                        }}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-client-cpf">
                        CPF/CNPJ do Cliente
                      </Label>
                      <Input
                        id="edit-client-cpf"
                        value={contract.client.cpf_cnpj || ""}
                        onChange={(e) => {
                          setContract({
                            ...contract,
                            client: {
                              ...contract.client,
                              cpf_cnpj: e.target.value,
                            },
                          });
                        }}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-client-address">
                      Endereço do Cliente
                    </Label>
                    <Textarea
                      id="edit-client-address"
                      value={contract.client.address || ""}
                      onChange={(e) => {
                        setContract({
                          ...contract,
                          client: {
                            ...contract.client,
                            address: e.target.value,
                          },
                        });
                      }}
                      placeholder="Endereço completo do cliente"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={async () => {
                        try {
                          setIsProcessing(true);
                          // Save client information changes
                          const { error } = await supabase
                            .from("clients")
                            .update({
                              full_name: contract.client.full_name,
                              email: contract.client.email,
                              phone: contract.client.phone,
                              cpf_cnpj: contract.client.cpf_cnpj,
                              address: contract.client.address,
                            })
                            .eq("id", contract.client.id);

                          if (error) {
                            throw new Error(
                              `Erro ao salvar informações: ${error.message}`,
                            );
                          }

                          alert("Informações do contrato salvas com sucesso!");
                        } catch (err) {
                          console.error("Error saving contract info:", err);
                          const errorMessage =
                            err instanceof Error
                              ? err.message
                              : "Erro desconhecido";
                          alert(`Erro ao salvar informações: ${errorMessage}`);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? "Salvando..." : "Salvar Informações"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Reload contract details to reset changes
                        loadContractDetails();
                      }}
                      disabled={isProcessing}
                    >
                      Cancelar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Edit Mode Notice */}
            {isEditMode && canEditOrDelete && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Edit className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Modo de Edição Ativo
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Você pode editar as informações do contrato e o conteúdo
                        na aba "Conteúdo do Contrato".
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(false)}
                    className="text-blue-800 border-blue-300 hover:bg-blue-100"
                  >
                    Sair do Modo de Edição
                  </Button>
                </div>
              </div>
            )}

            {/* Contract Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Valor Total
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(contract.total_value)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Valor Restante
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(contract.remaining_value)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Parcelas
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {contract.paid_installments}/{contract.total_installments}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(
                      (contract.paid_installments /
                        contract.total_installments) *
                      100
                    ).toFixed(0)}
                    % pago
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Comissão
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(commissionValue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {contract.commission_table.commission_percentage}% do valor
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contract Details */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Nome Completo</Label>
                    <p className="text-sm text-muted-foreground">
                      {contract.client.full_name}
                    </p>
                  </div>
                  {contract.client.email && (
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">
                        {contract.client.email}
                      </p>
                    </div>
                  )}
                  {contract.client.phone && (
                    <div>
                      <Label className="text-sm font-medium">Telefone</Label>
                      <p className="text-sm text-muted-foreground">
                        {contract.client.phone}
                      </p>
                    </div>
                  )}
                  {contract.client.cpf_cnpj && (
                    <div>
                      <Label className="text-sm font-medium">CPF/CNPJ</Label>
                      <p className="text-sm text-muted-foreground">
                        {contract.client.cpf_cnpj}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Representante
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Nome</Label>
                    <p className="text-sm text-muted-foreground">
                      {contract.representative.full_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">
                      {contract.representative.email}
                    </p>
                  </div>
                  {contract.representative.phone && (
                    <div>
                      <Label className="text-sm font-medium">Telefone</Label>
                      <p className="text-sm text-muted-foreground">
                        {contract.representative.phone}
                      </p>
                    </div>
                  )}
                  {contract.representative.commission_code && (
                    <div>
                      <Label className="text-sm font-medium">
                        Código de Comissão
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {contract.representative.commission_code}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quota Information */}
            {contract.quota && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações da Cota
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium">Grupo</Label>
                      <p className="text-sm text-muted-foreground">
                        {contract.quota.group.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Número da Cota
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {contract.quota.quota_number}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Descrição do Grupo
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {contract.quota.group.description || "Sem descrição"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="client" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados Completos do Cliente
                </CardTitle>
                <CardDescription>
                  Informações detalhadas do cliente associado ao contrato.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Nome Completo</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {contract.client.full_name}
                    </p>
                  </div>
                  {contract.client.email && (
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {contract.client.email}
                      </p>
                    </div>
                  )}
                  {contract.client.phone && (
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {contract.client.phone}
                      </p>
                    </div>
                  )}
                  {contract.client.cpf_cnpj && (
                    <div>
                      <Label className="text-sm font-medium">CPF/CNPJ</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {contract.client.cpf_cnpj}
                      </p>
                    </div>
                  )}
                </div>

                {contract.client.address && <Separator />}

                {contract.client.address && (
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {contract.client.address}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Cronograma de Pagamentos
                </CardTitle>
                <CardDescription>
                  Histórico e status dos pagamentos do contrato.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contract.invoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fatura</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pago em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contract.invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoice_code}
                          </TableCell>
                          <TableCell>{formatCurrency(invoice.value)}</TableCell>
                          <TableCell>{formatDate(invoice.due_date)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                invoice.status === "Pago"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : invoice.status === "Vencido"
                                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                                    : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              }
                            >
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invoice.paid_at
                              ? formatDate(invoice.paid_at)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {invoice.payment_link_pix && (
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">
                      Nenhuma fatura encontrada
                    </p>
                    <p className="text-muted-foreground">
                      As faturas serão geradas automaticamente conforme o
                      cronograma de pagamento.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commission" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Informações de Comissão
                </CardTitle>
                <CardDescription>
                  Detalhes sobre a comissão do representante para este contrato.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">
                      Tabela de Comissão
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {contract.commission_table.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Percentual</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {contract.commission_table.commission_percentage}%
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Valor da Comissão
                    </Label>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      {formatCurrency(commissionValue)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Parcelas de Comissão
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {contract.commission_table.payment_installments}x
                    </p>
                  </div>
                </div>

                {contract.commission_table.payment_details && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium">
                        Detalhes do Pagamento
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {contract.commission_table.payment_details}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Conteúdo do Contrato
                  </div>
                  {(contract.contract_content || isEditMode) &&
                    (isAdmin || canEditOrDelete) && (
                      <Button
                        onClick={handleEditContent}
                        variant="outline"
                        size="sm"
                        disabled={isEditingContent}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        {isEditingContent ? "Editando..." : "Editar Conteúdo"}
                      </Button>
                    )}
                </CardTitle>
                <CardDescription>
                  Visualize e edite o conteúdo HTML do contrato.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingContent ? (
                  <div className="space-y-4">
                    {/* Template Selection */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-3">
                        Inserir Modelo de Contrato
                      </h4>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <Label htmlFor="template-select" className="text-sm">
                            Selecionar Modelo
                          </Label>
                          <select
                            id="template-select"
                            value={selectedTemplateId}
                            onChange={(e) =>
                              setSelectedTemplateId(e.target.value)
                            }
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isLoadingTemplates}
                          >
                            <option value="">
                              {isLoadingTemplates
                                ? "Carregando modelos..."
                                : "Selecione um modelo"}
                            </option>
                            {availableTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                                {template.description
                                  ? ` - ${template.description}`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          onClick={handleInsertTemplate}
                          disabled={
                            !selectedTemplateId ||
                            isLoadingTemplates ||
                            isProcessing
                          }
                          variant="outline"
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Inserir Modelo
                        </Button>
                      </div>
                      {availableTemplates.length === 0 &&
                        !isLoadingTemplates && (
                          <p className="text-sm text-blue-600 mt-2">
                            Nenhum modelo disponível. Crie modelos na seção de
                            administração.
                          </p>
                        )}
                    </div>
                    <Editor
                      apiKey="8b0xydth3kx0va6g1ekaakj4p0snbelodd1df6m9ps5u6rnn"
                      onInit={(evt, editor) => {
                        editorRef.current = editor;
                        console.log("TinyMCE editor initialized");
                        // Set content after initialization to prevent direction issues
                        setTimeout(() => {
                          if (editedContent && editor) {
                            editor.setContent(editedContent);
                          }
                        }, 100);
                      }}
                      initialValue=""
                      init={{
                        height: 500,
                        menubar: true,
                        directionality: "ltr",
                        plugins: [
                          "advlist",
                          "autolink",
                          "lists",
                          "link",
                          "image",
                          "charmap",
                          "preview",
                          "anchor",
                          "searchreplace",
                          "visualblocks",
                          "code",
                          "fullscreen",
                          "insertdatetime",
                          "media",
                          "table",
                          "help",
                          "wordcount",
                          "emoticons",
                          "template",
                          "codesample",
                        ],
                        toolbar:
                          "undo redo | blocks | bold italic underline strikethrough | " +
                          "alignleft aligncenter alignright alignjustify | " +
                          "bullist numlist outdent indent | removeformat | help | " +
                          "table tabledelete | tableprops tablerowprops tablecellprops | " +
                          "tableinsertrowbefore tableinsertrowafter tabledeleterow | " +
                          "tableinsertcolbefore tableinsertcolafter tabledeletecol | " +
                          "link image media | signature | code preview fullscreen",
                        content_style:
                          "body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; line-height: 1.4; direction: ltr; }",
                        language: "pt_BR",
                        branding: false,
                        resize: false,
                        statusbar: true,
                        elementpath: false,
                        // Prevent content loss on errors
                        auto_save: {
                          enabled: false, // Disable auto-save to prevent conflicts
                        },
                        setup: (editor) => {
                          // Set initial content after editor is ready
                          editor.on("init", () => {
                            if (editedContent) {
                              editor.setContent(editedContent);
                            }
                          });

                          // Track content changes more reliably
                          editor.on("change keyup paste input", () => {
                            const content = editor.getContent();
                            setEditedContent(content);
                            console.log(
                              "Editor content updated, length:",
                              content.length,
                            );
                          });

                          // Add custom signature button
                          editor.ui.registry.addButton("signature", {
                            text: "Assinatura",
                            tooltip: "Inserir campo de assinatura",
                            onAction: () => {
                              const signerName = prompt("Nome do signatário:");
                              if (!signerName) return;

                              const signerCPF = prompt("CPF do signatário:");
                              if (!signerCPF) return;

                              const signatureId = "signature_" + Date.now();
                              const signatureHtml = `
                                <div class="signature-field" data-signature-id="${signatureId}" style="border: 2px dashed #ccc; padding: 20px; margin: 20px 0; background-color: #f9f9f9; text-align: center;">
                                  <div style="margin-bottom: 10px;">
                                    <strong>Campo de Assinatura</strong>
                                  </div>
                                  <div style="margin-bottom: 15px;">
                                    <div style="border-bottom: 1px solid #000; width: 300px; height: 40px; margin: 0 auto; display: inline-block;"></div>
                                  </div>
                                  <div style="font-size: 12px; color: #666;">
                                    <div><strong>Nome:</strong> ${signerName}</div>
                                    <div><strong>CPF:</strong> ${signerCPF}</div>
                                  </div>
                                </div>
                              `;

                              editor.insertContent(signatureHtml);
                            },
                          });

                          // Add context menu for editing signature fields
                          editor.ui.registry.addContextMenu("signature", {
                            update: (element) => {
                              const signatureField =
                                element.closest(".signature-field");
                              if (signatureField) {
                                return "editsignature";
                              }
                              return "";
                            },
                          });

                          // Add edit signature menu item
                          editor.ui.registry.addMenuItem("editsignature", {
                            text: "Editar Assinatura",
                            onAction: () => {
                              const selectedElement =
                                editor.selection.getNode();
                              const signatureField =
                                selectedElement.closest(".signature-field");

                              if (signatureField) {
                                const currentName = signatureField
                                  .querySelector(
                                    "div:last-child div:first-child",
                                  )
                                  .textContent.replace("Nome: ", "");
                                const currentCPF = signatureField
                                  .querySelector(
                                    "div:last-child div:last-child",
                                  )
                                  .textContent.replace("CPF: ", "");

                                const newName = prompt(
                                  "Nome do signatário:",
                                  currentName,
                                );
                                if (newName === null) return;

                                const newCPF = prompt(
                                  "CPF do signatário:",
                                  currentCPF,
                                );
                                if (newCPF === null) return;

                                signatureField.querySelector(
                                  "div:last-child div:first-child",
                                ).innerHTML =
                                  `<strong>Nome:</strong> ${newName}`;
                                signatureField.querySelector(
                                  "div:last-child div:last-child",
                                ).innerHTML = `<strong>CPF:</strong> ${newCPF}`;
                              }
                            },
                          });
                        },
                      }}
                      onEditorChange={(content) => {
                        setEditedContent(content);
                        console.log(
                          "Editor change event, content length:",
                          content.length,
                        );
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveContent}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button
                        onClick={() => {
                          // Preserve content when canceling
                          const currentContent = editorRef.current
                            ? editorRef.current.getContent()
                            : editedContent;
                          console.log(
                            "Canceling edit, preserving content length:",
                            currentContent.length,
                          );
                          setEditedContent(currentContent);
                          setIsEditingContent(false);
                        }}
                        variant="outline"
                        disabled={isProcessing}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : contract.contract_content ? (
                  <div
                    className="prose max-w-none p-4 border rounded-md bg-white"
                    dangerouslySetInnerHTML={{
                      __html: contract.contract_content,
                    }}
                    style={
                      {
                        "& .signature-field": {
                          border: "2px dashed #ccc",
                          padding: "20px",
                          margin: "20px 0",
                          backgroundColor: "#f9f9f9",
                          textAlign: "center",
                        },
                      } as any
                    }
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">
                      Nenhum conteúdo encontrado
                    </p>
                    <p className="text-muted-foreground mb-4">
                      O conteúdo do contrato não foi definido.
                    </p>
                    {(isAdmin || canEditOrDelete) && (
                      <Button onClick={handleEditContent} variant="outline">
                        <Edit3 className="mr-2 h-4 w-4" />
                        Adicionar Conteúdo
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos do Contrato
                </CardTitle>
                <CardDescription>
                  Documentos anexados e relacionados ao contrato.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Nenhum documento anexado
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Os documentos relacionados ao contrato aparecerão aqui.
                  </p>
                  {isAdmin && (
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Anexar Documento
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContractDetails;
