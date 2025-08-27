import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  representativeService,
  Representative,
  documentService,
} from "../../lib/supabase";
import { Database } from "../../types/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Edit,
  Key,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RepresentativeProfileProps {
  representativeId?: string;
}

const RepresentativeProfile: React.FC<RepresentativeProfileProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [representative, setRepresentative] = useState<Representative | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Representative>>({});
  const [contractFilter, setContractFilter] = React.useState("all");
  const [accountStatus, setAccountStatus] = React.useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [isDeleteContractDialogOpen, setIsDeleteContractDialogOpen] =
    React.useState(false);
  const [contractToDelete, setContractToDelete] = React.useState(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  // Load representative data
  useEffect(() => {
    const loadRepresentative = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await representativeService.getById(id);
        setRepresentative(data);
        if (data) {
          setAccountStatus(data.status);
          setEditData(data);
          // Load documents
          await loadDocuments(id);
        }
      } catch (error) {
        console.error("Error loading representative:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRepresentative();
  }, [id]);

  // Load documents for representative
  const loadDocuments = async (representativeId: string) => {
    try {
      setIsLoadingDocuments(true);
      // First, ensure required documents exist
      await documentService.createRequiredDocuments(representativeId);
      // Then load all documents
      const docs =
        await documentService.getRepresentativeDocuments(representativeId);
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
        </div>
      </div>
    );
  }

  if (!representative) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Representante não encontrado
          </h1>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!representative) return;

    try {
      await representativeService.update(representative.id, editData);
      setRepresentative({ ...representative, ...editData });
      setIsEditing(false);
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating representative:", error);
      alert("Erro ao atualizar perfil. Tente novamente.");
    }
  };

  const handleCancelEdit = () => {
    setEditData(representative);
    setIsEditing(false);
  };

  // Mock all contracts for this representative
  const allContracts = [
    {
      id: "PV-2023-001",
      client: "João Silva",
      value: "R$ 45.000",
      status: "Aprovado",
      date: "15/12/2023",
    },
    {
      id: "PV-2023-002",
      client: "Maria Santos",
      value: "R$ 38.500",
      status: "Em Avaliação",
      date: "12/12/2023",
    },
    {
      id: "PV-2023-003",
      client: "Pedro Costa",
      value: "R$ 52.000",
      status: "Aprovado",
      date: "10/12/2023",
    },
    {
      id: "PV-2023-004",
      client: "Lucia Ferreira",
      value: "R$ 41.200",
      status: "Em Avaliação",
      date: "08/12/2023",
    },
    {
      id: "PV-2023-005",
      client: "Roberto Alves",
      value: "R$ 36.800",
      status: "Aprovado",
      date: "05/12/2023",
    },
    {
      id: "PV-2023-006",
      client: "Ana Costa",
      value: "R$ 28.900",
      status: "Reprovado",
      date: "03/12/2023",
    },
    {
      id: "PV-2023-007",
      client: "Carlos Lima",
      value: "R$ 67.500",
      status: "Aprovado",
      date: "01/12/2023",
    },
    {
      id: "PV-2023-008",
      client: "Fernanda Silva",
      value: "R$ 33.200",
      status: "Reprovado",
      date: "28/11/2023",
    },
  ];

  const filteredContracts =
    contractFilter === "all"
      ? allContracts
      : allContracts.filter((contract) => {
          if (contractFilter === "approved")
            return contract.status === "Aprovado";
          if (contractFilter === "rejected")
            return contract.status === "Reprovado";
          if (contractFilter === "evaluation")
            return contract.status === "Em Avaliação";
          return true;
        });

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const handlePasswordChange = () => {
    console.log(
      "Changing password for representative:",
      representative?.name,
      "New password:",
      newPassword,
    );
    setIsPasswordDialogOpen(false);
    setNewPassword("");
  };

  const handleStatusChange = async (newStatus) => {
    if (!representative) return;

    try {
      await representativeService.update(representative.id, {
        status: newStatus,
      });
      setAccountStatus(newStatus);
      setRepresentative({ ...representative, status: newStatus });
      console.log("Account status changed to:", newStatus);
    } catch (error) {
      console.error("Error changing status:", error);
      alert("Erro ao alterar status. Tente novamente.");
    }
  };

  const handleViewContract = (contractId: string) => {
    console.log("Viewing contract:", contractId);
    // Navigate to contract details page
    navigate(`/contract/${contractId}`);
  };

  const handleEditContract = (contractId: string) => {
    console.log("Editing contract:", contractId);
    // Navigate to contract edit page or open edit modal
    navigate(`/contract/${contractId}/edit`);
  };

  const handleDeleteContract = (contract) => {
    setContractToDelete(contract);
    setIsDeleteContractDialogOpen(true);
  };

  const confirmDeleteContract = () => {
    if (contractToDelete) {
      console.log("Deleting contract:", contractToDelete.id);
      // Here you would make the API call to delete the contract
      setIsDeleteContractDialogOpen(false);
      setContractToDelete(null);
    }
  };

  // Handle document approval
  const handleApproveDocument = async (documentId: number) => {
    try {
      await documentService.updateDocumentStatus(documentId, "Aprovado");
      // Reload documents
      if (id) {
        await loadDocuments(id);
      }
      alert("Documento aprovado com sucesso!");
    } catch (error) {
      console.error("Error approving document:", error);
      alert("Erro ao aprovar documento. Tente novamente.");
    }
  };

  // Handle document rejection
  const handleRejectDocument = async (documentId: number) => {
    const reason = prompt("Motivo da rejeição:");
    if (reason) {
      try {
        await documentService.updateDocumentStatus(documentId, "Reprovado");
        // Reload documents
        if (id) {
          await loadDocuments(id);
        }
        alert("Documento rejeitado com sucesso!");
      } catch (error) {
        console.error("Error rejecting document:", error);
        alert("Erro ao rejeitar documento. Tente novamente.");
      }
    }
  };

  // Handle approve all documents and grant dashboard access
  const handleApproveAllDocuments = async () => {
    if (!representative || !id) return;

    const confirmApproval = confirm(
      "Tem certeza que deseja aprovar todos os documentos e conceder acesso ao dashboard para este representante?",
    );

    if (confirmApproval) {
      try {
        // Use a mock admin ID for now - in production this would come from the current user
        const adminId = "admin-user-id";
        await documentService.approveAllDocuments(id, adminId);

        // Reload representative data and documents
        const updatedRep = await representativeService.getById(id);
        setRepresentative(updatedRep);
        if (updatedRep) {
          setAccountStatus(updatedRep.status);
        }
        await loadDocuments(id);

        alert(
          "Todos os documentos foram aprovados e o representante agora tem acesso ao dashboard!",
        );
      } catch (error) {
        console.error("Error approving all documents:", error);
        alert("Erro ao aprovar documentos. Tente novamente.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Header */}
      <div className="bg-card border-b p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${representative.name}`}
                />
                <AvatarFallback>
                  {representative.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{representative.name}</h1>
                <p className="text-muted-foreground">
                  ID:{" "}
                  {representative.commission_code ||
                    representative.id.substring(0, 8)}{" "}
                  • {representative.status}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={accountStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status da conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativa</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
                <SelectItem value="Pausada">Pausada</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(true)}
            >
              <Key className="h-4 w-4 mr-2" />
              Alterar Senha
            </Button>
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveProfile}>Salvar</Button>
              </div>
            ) : (
              <Button onClick={handleEditProfile}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Vendas Totais
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {(representative.total_sales || 0).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket médio: R${" "}
                {representative.contracts_count > 0
                  ? (
                      representative.total_sales /
                      representative.contracts_count
                    ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                  : "0,00"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Contratos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {representative.contracts_count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de conversão: 68%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comissões</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {((representative.total_sales || 0) * 0.04).toLocaleString(
                  "pt-BR",
                  {
                    minimumFractionDigits: 2,
                  },
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Tabela {representative.commission_code || "N/A"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge
                  variant={
                    representative.status === "Ativo" ? "default" : "secondary"
                  }
                >
                  {representative.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Desde{" "}
                {new Date(representative.created_at).toLocaleDateString(
                  "pt-BR",
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais e Cadastrais</CardTitle>
            <CardDescription>Dados completos do representante</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    {isEditing ? (
                      <Input
                        value={editData.email || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, email: e.target.value })
                        }
                        className="text-sm"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {representative.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Telefone</p>
                    {isEditing ? (
                      <Input
                        value={editData.phone || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, phone: e.target.value })
                        }
                        className="text-sm"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {representative.phone || "N/A"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">CNPJ</p>
                  <p className="text-sm text-muted-foreground">
                    {representative.cnpj || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Razão Social</p>
                  {isEditing ? (
                    <Input
                      value={editData.razao_social || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          razao_social: e.target.value,
                        })
                      }
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {representative.razao_social || "N/A"}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Data de Cadastro</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(representative.created_at).toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tabela de Comissão</p>
                  <p className="text-sm text-muted-foreground">
                    Tabela {representative.commission_code || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ponto de Venda</p>
                  {isEditing ? (
                    <Input
                      value={editData.ponto_venda || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          ponto_venda: e.target.value,
                        })
                      }
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {representative.ponto_venda || "N/A"}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Taxa de Conversão</p>
                  <p className="text-sm text-muted-foreground">68%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ticket Médio</p>
                  <p className="text-sm text-muted-foreground">
                    R${" "}
                    {(representative.contracts_count || 0) > 0
                      ? (
                          (representative.total_sales || 0) /
                          (representative.contracts_count || 1)
                        ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                      : "0,00"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documentos</CardTitle>
                <CardDescription>
                  Status dos documentos enviados pelo representante
                </CardDescription>
              </div>
              {documents.some((doc) => doc.status === "Pendente") && (
                <Button
                  onClick={handleApproveAllDocuments}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar Todos
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingDocuments ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Carregando documentos...
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {documents.map((doc) => {
                  const uploadDate = doc.uploaded_at
                    ? new Date(doc.uploaded_at).toLocaleDateString("pt-BR")
                    : "Não enviado";

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {doc.document_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.uploaded_at
                              ? `Enviado em ${uploadDate}`
                              : "Documento não enviado"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            doc.status === "Aprovado"
                              ? "default"
                              : doc.status === "Pendente"
                                ? "outline"
                                : "destructive"
                          }
                        >
                          {doc.status}
                        </Badge>
                        {doc.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.file_url, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {doc.status === "Pendente" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveDocument(doc.id)}
                              className="text-green-600 hover:text-green-700"
                              title="Aprovar documento"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectDocument(doc.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Rejeitar documento"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {documents.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    Nenhum documento encontrado.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Contracts - Full Width */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contratos</CardTitle>
                <CardDescription>
                  Todos os contratos deste representante ({allContracts.length}{" "}
                  total)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1">
                  <Button
                    variant={contractFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setContractFilter("all")}
                  >
                    Todos ({allContracts.length})
                  </Button>
                  <Button
                    variant={
                      contractFilter === "approved" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setContractFilter("approved")}
                  >
                    Aprovados (
                    {allContracts.filter((c) => c.status === "Aprovado").length}
                    )
                  </Button>
                  <Button
                    variant={
                      contractFilter === "rejected" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setContractFilter("rejected")}
                  >
                    Reprovados (
                    {
                      allContracts.filter((c) => c.status === "Reprovado")
                        .length
                    }
                    )
                  </Button>
                  <Button
                    variant={
                      contractFilter === "evaluation" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setContractFilter("evaluation")}
                  >
                    Em Avaliação (
                    {
                      allContracts.filter((c) => c.status === "Em Avaliação")
                        .length
                    }
                    )
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.id}</TableCell>
                    <TableCell>{contract.client}</TableCell>
                    <TableCell>{contract.value}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          contract.status === "Aprovado"
                            ? "default"
                            : contract.status === "Reprovado"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contract.date}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewContract(contract.id)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditContract(contract.id)}
                          title="Editar contrato"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContract(contract)}
                          title="Excluir contrato"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredContracts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum contrato encontrado para o filtro selecionado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Password Change Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Senha do Representante</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {representative.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newPassword" className="text-right">
                Nova Senha
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="newPassword"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1"
                  placeholder="Digite ou gere uma nova senha"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                >
                  Gerar
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setNewPassword("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handlePasswordChange} disabled={!newPassword}>
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contract Confirmation Dialog */}
      <AlertDialog
        open={isDeleteContractDialogOpen}
        onOpenChange={setIsDeleteContractDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contrato{" "}
              <strong>{contractToDelete?.id}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteContractDialogOpen(false);
                setContractToDelete(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteContract}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Contrato
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RepresentativeProfile;
