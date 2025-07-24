import React from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const [contractFilter, setContractFilter] = React.useState("all");
  const [accountStatus, setAccountStatus] = React.useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [isDeleteContractDialogOpen, setIsDeleteContractDialogOpen] =
    React.useState(false);
  const [contractToDelete, setContractToDelete] = React.useState(null);

  // Mock data - in a real app, this would come from an API
  const representatives = [
    {
      id: 1,
      name: "Carlos Oliveira",
      email: "carlos@credicar.com",
      phone: "(11) 99999-1234",
      commissionTable: "A",
      status: "Ativo",
      totalSales: "R$ 425.000",
      contractsCount: 28,
      joinDate: "15/03/2023",
      address: "Rua das Flores, 123 - São Paulo, SP",
      cpf: "123.456.789-00",
      birthDate: "15/08/1985",
      commissionEarned: "R$ 17.000",
      averageTicket: "R$ 15.178",
      conversionRate: "68%",
    },
    {
      id: 2,
      name: "Ana Pereira",
      email: "ana@credicar.com",
      phone: "(11) 99999-5678",
      commissionTable: "B",
      status: "Ativo",
      totalSales: "R$ 360.000",
      contractsCount: 24,
      joinDate: "22/01/2023",
      address: "Av. Paulista, 456 - São Paulo, SP",
      cpf: "987.654.321-00",
      birthDate: "22/03/1990",
      commissionEarned: "R$ 14.400",
      averageTicket: "R$ 15.000",
      conversionRate: "72%",
    },
    {
      id: 3,
      name: "Marcos Souza",
      email: "marcos@credicar.com",
      phone: "(11) 99999-9012",
      commissionTable: "C",
      status: "Ativo",
      totalSales: "R$ 325.000",
      contractsCount: 21,
      joinDate: "08/05/2023",
      address: "Rua Augusta, 789 - São Paulo, SP",
      cpf: "456.789.123-00",
      birthDate: "08/12/1988",
      commissionEarned: "R$ 13.000",
      averageTicket: "R$ 15.476",
      conversionRate: "65%",
    },
    {
      id: 4,
      name: "Juliana Costa",
      email: "juliana@credicar.com",
      phone: "(11) 99999-3456",
      commissionTable: "A",
      status: "Inativo",
      totalSales: "R$ 290.000",
      contractsCount: 19,
      joinDate: "12/02/2023",
      address: "Rua Oscar Freire, 321 - São Paulo, SP",
      cpf: "789.123.456-00",
      birthDate: "12/07/1992",
      commissionEarned: "R$ 11.600",
      averageTicket: "R$ 15.263",
      conversionRate: "58%",
    },
    {
      id: 5,
      name: "Ricardo Gomes",
      email: "ricardo@credicar.com",
      phone: "(11) 99999-7890",
      commissionTable: "D",
      status: "Ativo",
      totalSales: "R$ 225.000",
      contractsCount: 15,
      joinDate: "30/06/2023",
      address: "Rua Consolação, 654 - São Paulo, SP",
      cpf: "321.654.987-00",
      birthDate: "30/11/1987",
      commissionEarned: "R$ 9.000",
      averageTicket: "R$ 15.000",
      conversionRate: "60%",
    },
  ];

  const representative = representatives.find(
    (rep) => rep.id === parseInt(id || "1"),
  );

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

  // Set initial account status if not set
  React.useEffect(() => {
    if (!accountStatus && representative) {
      setAccountStatus(representative.status);
    }
  }, [representative, accountStatus]);

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

  const handleStatusChange = (newStatus) => {
    setAccountStatus(newStatus);
    console.log("Changing account status to:", newStatus);
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
                  ID: {representative.id.toString().padStart(3, "0")} •{" "}
                  {representative.status}
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
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
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
                {representative.totalSales}
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket médio: {representative.averageTicket}
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
                {representative.contractsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de conversão: {representative.conversionRate}
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
                {representative.commissionEarned}
              </div>
              <p className="text-xs text-muted-foreground">
                Tabela {representative.commissionTable}
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
                Desde {representative.joinDate}
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
                    <p className="text-sm text-muted-foreground">
                      {representative.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Telefone</p>
                    <p className="text-sm text-muted-foreground">
                      {representative.phone}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">CPF</p>
                  <p className="text-sm text-muted-foreground">
                    {representative.cpf}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data de Nascimento</p>
                    <p className="text-sm text-muted-foreground">
                      {representative.birthDate}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Data de Cadastro</p>
                  <p className="text-sm text-muted-foreground">
                    {representative.joinDate}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tabela de Comissão</p>
                  <p className="text-sm text-muted-foreground">
                    Tabela {representative.commissionTable}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Endereço</p>
                  <p className="text-sm text-muted-foreground">
                    {representative.address}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Taxa de Conversão</p>
                  <p className="text-sm text-muted-foreground">
                    {representative.conversionRate}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ticket Médio</p>
                  <p className="text-sm text-muted-foreground">
                    {representative.averageTicket}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
            <CardDescription>
              Status dos documentos enviados pelo representante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  name: "Cartão do CNPJ",
                  status: "approved",
                  uploadDate: "15/12/2023",
                },
                {
                  name: "Comprovante de Endereço",
                  status: "approved",
                  uploadDate: "15/12/2023",
                },
                {
                  name: "Certidão de Antecedente Criminal",
                  status: "pending",
                  uploadDate: "16/12/2023",
                },
                {
                  name: "Certidão Negativa Civil",
                  status: "approved",
                  uploadDate: "15/12/2023",
                },
              ].map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Enviado em {doc.uploadDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        doc.status === "approved"
                          ? "default"
                          : doc.status === "pending"
                            ? "outline"
                            : "destructive"
                      }
                    >
                      {doc.status === "approved"
                        ? "Aprovado"
                        : doc.status === "pending"
                          ? "Pendente"
                          : "Rejeitado"}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {doc.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log(`Approving document: ${doc.name}`);
                            // Here you would update the document status
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const reason = prompt("Motivo da rejeição:");
                            if (reason) {
                              console.log(
                                `Rejecting document: ${doc.name}, Reason: ${reason}`,
                              );
                              // Here you would update the document status and add rejection reason
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
