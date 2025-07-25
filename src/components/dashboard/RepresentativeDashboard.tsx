import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronRight,
  BarChart3,
  Users,
  FileText,
  Calculator,
  DollarSign,
  TrendingUp,
  Clock,
  Wallet,
  Bell,
  Calendar,
  Eye,
  Download,
  Filter,
  Upload,
  PieChart,
  Receipt,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  FastForward,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RepresentativeDashboardProps {
  representativeName?: string;
  onLogout?: () => void;
  currentUser?: any;
  currentProfile?: any;
  performanceData?: {
    totalSales: number;
    targetSales: number;
    activeContracts: number;
    completedContracts: number;
    pendingCommission: number;
    nextCommissionDate: string;
    nextCommissionValue: number;
  };
  myContracts?: {
    id: string;
    contractNumber: string;
    clientName: string;
    date: string;
    value: number;
    status: "active" | "completed" | "pending" | "cancelled";
    commission: number;
  }[];
  commissionHistory?: {
    id: string;
    contract: string;
    date: string;
    value: number;
    status: "pending" | "paid";
    dueDate?: string;
  }[];
}

const RepresentativeDashboard: React.FC<RepresentativeDashboardProps> = ({
  representativeName = "João Silva",
  onLogout = () => {},
  currentUser,
  currentProfile,
  performanceData = {
    totalSales: 320000,
    targetSales: 500000,
    activeContracts: 8,
    completedContracts: 15,
    pendingCommission: 12800,
    nextCommissionDate: "15/07/2023",
    nextCommissionValue: 3200,
  },
  myContracts = myContracts.length > 0
    ? myContracts
    : [
        {
          id: "1",
          contractNumber: "CT-2023-015",
          clientName: "Carlos Oliveira",
          date: "10/07/2023",
          value: 45000,
          status: "active",
          commission: 1800,
        },
        {
          id: "2",
          contractNumber: "CT-2023-014",
          clientName: "Maria Santos",
          date: "08/07/2023",
          value: 52000,
          status: "completed",
          commission: 2080,
        },
        {
          id: "3",
          contractNumber: "CT-2023-013",
          clientName: "Pedro Costa",
          date: "05/07/2023",
          value: 38500,
          status: "pending",
          commission: 1540,
        },
        {
          id: "4",
          contractNumber: "CT-2023-012",
          clientName: "Ana Pereira",
          date: "02/07/2023",
          value: 41000,
          status: "active",
          commission: 1640,
        },
        {
          id: "5",
          contractNumber: "CT-2023-011",
          clientName: "Roberto Silva",
          date: "28/06/2023",
          value: 29000,
          status: "cancelled",
          commission: 0,
        },
      ],
  commissionHistory = [
    {
      id: "1",
      contract: "CT-2023-010",
      date: "25/06/2023",
      value: 2100,
      status: "paid",
    },
    {
      id: "2",
      contract: "CT-2023-009",
      date: "20/06/2023",
      value: 1850,
      status: "paid",
    },
    {
      id: "3",
      contract: "CT-2023-014",
      date: "08/07/2023",
      value: 2080,
      status: "pending",
      dueDate: "15/07/2023",
    },
    {
      id: "4",
      contract: "CT-2023-015",
      date: "10/07/2023",
      value: 1800,
      status: "pending",
      dueDate: "20/07/2023",
    },
    {
      id: "5",
      contract: "CT-2023-013",
      date: "05/07/2023",
      value: 1540,
      status: "pending",
      dueDate: "18/07/2023",
    },
  ],
}) => {
  const salesProgress =
    (performanceData.totalSales / performanceData.targetSales) * 100;
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] =
    React.useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any>(null);
  const [isEarlyPaymentRequestOpen, setIsEarlyPaymentRequestOpen] =
    React.useState(false);
  const [selectedContract, setSelectedContract] = React.useState<any>(null);
  const [earlyPaymentInstallments, setEarlyPaymentInstallments] =
    React.useState("");
  const [chartFilter, setChartFilter] = React.useState("active");

  const [isDataLoading, setIsDataLoading] = React.useState(true);
  const availableBalance = performanceData.pendingCommission;

  // Load representative's contracts from Supabase
  React.useEffect(() => {
    if (currentUser) {
      loadRepresentativeData();
    }
  }, [currentUser]);

  const loadRepresentativeData = async () => {
    try {
      const { getContracts } = await import("@/lib/supabase");

      const { data: contractsData } = await getContracts(currentUser.id);

      if (contractsData) {
        // Transform Supabase data to component format
        const transformedContracts = contractsData.map((contract) => ({
          id: contract.id.toString(),
          contractNumber: contract.contract_code,
          clientName: contract.clients?.full_name || "Cliente",
          date: new Date(contract.created_at).toLocaleDateString("pt-BR"),
          value: contract.total_value,
          status: contract.status.toLowerCase().replace(" ", "_"),
          commission:
            (contract.total_value *
              (contract.commission_tables?.commission_percentage || 4)) /
            100,
        }));
        setMyContracts(transformedContracts);
      }
    } catch (error) {
      console.error("Error loading representative data:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleWithdrawalRequest = () => {
    const amount = parseFloat(withdrawalAmount);
    if (amount > 0 && amount <= availableBalance && uploadedFile) {
      console.log(
        `Withdrawal request: R$ ${amount.toLocaleString("pt-BR")}`,
        uploadedFile,
      );
      setIsWithdrawalDialogOpen(false);
      setWithdrawalAmount("");
      setUploadedFile(null);
      alert(
        `Solicitação de retirada de R$ ${amount.toLocaleString("pt-BR")} enviada com sucesso!`,
      );
    } else {
      if (!uploadedFile) {
        alert("É obrigatório anexar a Nota Fiscal para solicitar a retirada");
      } else {
        alert("Valor inválido para retirada");
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (validTypes.includes(file.type)) {
        setUploadedFile(file);
      } else {
        alert("Por favor, selecione um arquivo PDF ou imagem (JPG, PNG)");
      }
    }
  };

  const handleEarlyPaymentRequest = () => {
    if (!selectedContract || !earlyPaymentInstallments) return;

    const installmentsCount = parseInt(earlyPaymentInstallments);
    const remainingInstallments =
      selectedContract.installments - selectedContract.paidInstallments;

    if (installmentsCount <= 0 || installmentsCount > remainingInstallments) {
      alert("Número de parcelas inválido");
      return;
    }

    console.log("Early payment request:", {
      contract: selectedContract.contractNumber,
      installments: installmentsCount,
      client: selectedContract.clientName,
    });

    setIsEarlyPaymentRequestOpen(false);
    setSelectedContract(null);
    setEarlyPaymentInstallments("");
    alert("Solicitação de antecipação enviada para aprovação do administrador");
  };

  // Mock data for client payment status chart
  const getClientStatusData = () => {
    const activeContracts = myContracts.filter((c) =>
      chartFilter === "active"
        ? ["active", "pending"].includes(c.status)
        : ["completed", "cancelled"].includes(c.status),
    );

    const onTime = activeContracts.filter(
      (c) => c.status === "active" || c.status === "completed",
    ).length;
    const late = activeContracts.filter(
      (c) => c.status === "pending" || c.status === "cancelled",
    ).length;

    return {
      onTime,
      late,
      total: activeContracts.length,
    };
  };

  const clientStatusData = getClientStatusData();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard do Representante
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </Button>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${representativeName}`}
                  alt={representativeName}
                />
                <AvatarFallback>
                  {representativeName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{representativeName}</p>
                <p className="text-xs text-muted-foreground">Representante</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="ml-2"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-background p-4">
          <nav className="space-y-2">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "simulator" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("simulator")}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Simulador de Vendas
            </Button>
            <Button
              variant={activeTab === "contracts" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("contracts")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Meus Contratos
            </Button>
            <Button
              variant={activeTab === "commission" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("commission")}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Área de Comissão
            </Button>
          </nav>
        </aside>

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "dashboard" && (
            <>
              {/* Client Status Chart */}
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Status dos Clientes</CardTitle>
                        <CardDescription>
                          Análise de adimplência da sua carteira
                        </CardDescription>
                      </div>
                      <Select
                        value={chartFilter}
                        onValueChange={setChartFilter}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            Contratos Ativos
                          </SelectItem>
                          <SelectItem value="inactive">
                            Contratos Inativos
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center space-x-8">
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32">
                          <svg
                            className="w-32 h-32 transform -rotate-90"
                            viewBox="0 0 36 36"
                          >
                            <path
                              className="text-gray-200"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-green-500"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeDasharray={`${clientStatusData.total > 0 ? (clientStatusData.onTime / clientStatusData.total) * 100 : 0}, 100`}
                              strokeLinecap="round"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">
                              {clientStatusData.total > 0
                                ? Math.round(
                                    (clientStatusData.onTime /
                                      clientStatusData.total) *
                                      100,
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Adimplentes
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium">Adimplentes</p>
                            <p className="text-xs text-muted-foreground">
                              {clientStatusData.onTime} clientes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium">Inadimplentes</p>
                            <p className="text-xs text-muted-foreground">
                              {clientStatusData.late} clientes
                            </p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium">
                            Total: {clientStatusData.total} contratos
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Overview Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Vendas
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      R$ {performanceData.totalSales.toLocaleString("pt-BR")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Meta: R${" "}
                      {performanceData.targetSales.toLocaleString("pt-BR")}
                    </p>
                    <Progress className="mt-2" value={salesProgress} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {salesProgress.toFixed(0)}% da meta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Contratos Ativos
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {performanceData.activeContracts}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {performanceData.completedContracts} concluídos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Comissão Pendente
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      R${" "}
                      {performanceData.pendingCommission.toLocaleString(
                        "pt-BR",
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      A receber
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Próxima Comissão
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      R${" "}
                      {performanceData.nextCommissionValue.toLocaleString(
                        "pt-BR",
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {performanceData.nextCommissionDate}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
                <div className="grid gap-4 md:grid-cols-4">
                  <Button
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
                    onClick={() => setActiveTab("simulator")}
                  >
                    <Calculator className="h-6 w-6" />
                    <span>Nova Simulação</span>
                  </Button>
                  <Button
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                    onClick={() => setActiveTab("contracts")}
                  >
                    <FileText className="h-6 w-6" />
                    <span>Meus Contratos</span>
                  </Button>
                  <Button
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                    onClick={() => setActiveTab("commission")}
                  >
                    <DollarSign className="h-6 w-6" />
                    <span>Área de Comissão</span>
                  </Button>
                  <Button
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                  >
                    <Users className="h-6 w-6" />
                    <span>Cadastrar Cliente</span>
                  </Button>
                </div>
              </div>
            </>
          )}

          {activeTab === "simulator" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Simulador de Vendas</h2>
                <Button variant="outline" size="sm">
                  <Calculator className="mr-2 h-4 w-4" />
                  Nova Simulação
                </Button>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Acesso ao Simulador</CardTitle>
                  <CardDescription>
                    Use o simulador para criar propostas e iniciar novos
                    contratos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <Calculator className="h-16 w-16 mx-auto mb-4 text-red-600" />
                  <p className="text-lg mb-4">
                    Clique no botão abaixo para acessar o simulador completo
                  </p>
                  <Button className="bg-red-600 hover:bg-red-700" size="lg">
                    Abrir Simulador de Vendas
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "contracts" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Meus Contratos</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Contratos</CardTitle>
                  <CardDescription>
                    Todos os contratos que você vendeu.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contrato</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Comissão</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">
                            {contract.contractNumber}
                          </TableCell>
                          <TableCell>{contract.clientName}</TableCell>
                          <TableCell>{contract.date}</TableCell>
                          <TableCell>
                            R$ {contract.value.toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            {contract.status === "active" && (
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                              >
                                Ativo
                              </Badge>
                            )}
                            {contract.status === "completed" && (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 hover:bg-green-100"
                              >
                                Concluído
                              </Badge>
                            )}
                            {contract.status === "pending" && (
                              <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                              >
                                Pendente
                              </Badge>
                            )}
                            {contract.status === "cancelled" && (
                              <Badge
                                variant="outline"
                                className="bg-red-100 text-red-800 hover:bg-red-100"
                              >
                                Cancelado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            R$ {contract.commission.toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedInvoice({
                                    ...contract,
                                    invoiceDetails: {
                                      totalCredit: contract.value,
                                      totalPaid:
                                        contract.value - contract.value * 0.7, // Mock calculation
                                      remainingBalance: contract.value * 0.7,
                                      dueDate: "2023-08-15",
                                      paymentMethod: "Boleto",
                                      barCode:
                                        "23791.23456 78901.234567 89012.345678 9 12340000012345",
                                      pixCode: "PIX123456789",
                                    },
                                  });
                                  setIsInvoiceDetailsOpen(true);
                                }}
                              >
                                <Receipt className="h-4 w-4" />
                              </Button>
                              {contract.status === "active" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedContract(contract);
                                    setIsEarlyPaymentRequestOpen(true);
                                  }}
                                >
                                  <FastForward className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "commission" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Área de Comissão</h2>
                <Dialog
                  open={isWithdrawalDialogOpen}
                  onOpenChange={setIsWithdrawalDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Wallet className="mr-2 h-4 w-4" />
                      Solicitar Retirada
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Solicitar Retirada</DialogTitle>
                      <DialogDescription>
                        Solicite o saque do seu saldo de comissão disponível.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Saldo Disponível</h4>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {availableBalance.toLocaleString("pt-BR")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Valor disponível para saque
                        </p>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                          Valor
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          className="col-span-3"
                          placeholder="0,00"
                          min="0"
                          max={availableBalance}
                          step="0.01"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="invoice" className="text-right">
                          Nota Fiscal *
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="invoice"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="mb-2"
                          />
                          {uploadedFile && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>{uploadedFile.name}</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Formatos aceitos: PDF, JPG, PNG
                          </p>
                        </div>
                      </div>
                      {withdrawalAmount && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">
                            Valor da solicitação:
                          </p>
                          <p className="text-lg font-bold text-blue-900">
                            R${" "}
                            {parseFloat(withdrawalAmount || "0").toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                              },
                            )}
                          </p>
                          <p className="text-xs text-blue-700">
                            Processamento em até 2 dias úteis
                          </p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsWithdrawalDialogOpen(false);
                          setUploadedFile(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleWithdrawalRequest}
                        disabled={!uploadedFile || !withdrawalAmount}
                      >
                        Solicitar Retirada
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Commission Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Saldo Disponível
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      R${" "}
                      {performanceData.pendingCommission.toLocaleString(
                        "pt-BR",
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pronto para saque
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Próximo Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      R${" "}
                      {performanceData.nextCommissionValue.toLocaleString(
                        "pt-BR",
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {performanceData.nextCommissionDate}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total do Mês
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      R${" "}
                      {(
                        performanceData.pendingCommission +
                        performanceData.nextCommissionValue
                      ).toLocaleString("pt-BR")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Julho 2023
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Extrato de Comissões</CardTitle>
                  <CardDescription>
                    Histórico detalhado das suas comissões.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contrato</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionHistory.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">
                            {commission.contract}
                          </TableCell>
                          <TableCell>{commission.date}</TableCell>
                          <TableCell>
                            R$ {commission.value.toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>{commission.dueDate || "-"}</TableCell>
                          <TableCell>
                            {commission.status === "paid" && (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 hover:bg-green-100"
                              >
                                Pago
                              </Badge>
                            )}
                            {commission.status === "pending" && (
                              <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                              >
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Extrato
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Invoice Details Dialog */}
      <Dialog
        open={isInvoiceDetailsOpen}
        onOpenChange={setIsInvoiceDetailsOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Fatura</DialogTitle>
            <DialogDescription>
              Informações de pagamento para o cliente
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">
                    Valor Total do Crédito
                  </h4>
                  <p className="text-2xl font-bold text-blue-900">
                    R$ {selectedInvoice.value.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">
                    Valor Total Pago
                  </h4>
                  <p className="text-2xl font-bold text-green-900">
                    R${" "}
                    {selectedInvoice.invoiceDetails.totalPaid.toLocaleString(
                      "pt-BR",
                    )}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <h4 className="font-medium text-amber-800">Saldo Restante</h4>
                <p className="text-2xl font-bold text-amber-900">
                  R${" "}
                  {selectedInvoice.invoiceDetails.remainingBalance.toLocaleString(
                    "pt-BR",
                  )}
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Vencimento</Label>
                  <p className="text-sm">
                    {selectedInvoice.invoiceDetails.dueDate}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Código de Barras
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={selectedInvoice.invoiceDetails.barCode}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedInvoice.invoiceDetails.barCode,
                        )
                      }
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Código PIX</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={selectedInvoice.invoiceDetails.pixCode}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedInvoice.invoiceDetails.pixCode,
                        )
                      }
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsInvoiceDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Early Payment Request Dialog */}
      <Dialog
        open={isEarlyPaymentRequestOpen}
        onOpenChange={setIsEarlyPaymentRequestOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Solicitar Antecipação de Parcelas</DialogTitle>
            <DialogDescription>
              Solicite a antecipação de parcelas em nome do cliente
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedContract.clientName}</h4>
                <p className="text-sm text-muted-foreground">
                  Contrato: {selectedContract.contractNumber}
                </p>
                <p className="text-sm">
                  Parcelas restantes:{" "}
                  {selectedContract.installments -
                    selectedContract.paidInstallments}
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="installments" className="text-right">
                  Parcelas
                </Label>
                <Select
                  value={earlyPaymentInstallments}
                  onValueChange={setEarlyPaymentInstallments}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o número de parcelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      {
                        length:
                          selectedContract.installments -
                          selectedContract.paidInstallments,
                      },
                      (_, i) => i + 1,
                    ).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} parcela{num > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {earlyPaymentInstallments && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Solicitação de antecipação:
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {earlyPaymentInstallments} parcela
                    {parseInt(earlyPaymentInstallments) > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-blue-700">
                    Aguardará aprovação do administrador
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEarlyPaymentRequestOpen(false);
                setSelectedContract(null);
                setEarlyPaymentInstallments("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEarlyPaymentRequest}
              disabled={!earlyPaymentInstallments}
            >
              Solicitar Antecipação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepresentativeDashboard;
