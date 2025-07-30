import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Edit,
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
import { dashboardService, authService } from "@/lib/supabase";
import ContractCreationFlow from "@/components/sales/ContractCreationFlow";
import ContractDetails from "@/components/sales/ContractDetails";

interface RepresentativeDashboardProps {
  representativeName?: string;
  onLogout?: () => void;
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
  representativeName,
  onLogout = () => {},
  performanceData: propPerformanceData,
  myContracts: propMyContracts,
  commissionHistory: propCommissionHistory,
}) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [performanceData, setPerformanceData] = useState(
    propPerformanceData || {
      totalSales: 0,
      targetSales: 500000,
      activeContracts: 0,
      completedContracts: 0,
      pendingCommission: 0,
      nextCommissionDate: "15/08/2025",
      nextCommissionValue: 0,
    },
  );
  const [myContracts, setMyContracts] = useState(propMyContracts || []);
  const [commissionHistory, setCommissionHistory] = useState(
    propCommissionHistory || [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] =
    React.useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [showContractFlow, setShowContractFlow] = React.useState(false);
  const [selectedContractId, setSelectedContractId] = React.useState<
    string | null
  >(null);
  const [isContractModalOpen, setIsContractModalOpen] = React.useState(false);

  const displayName =
    representativeName || currentUser?.name || "Representante";

  // Load dashboard data on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser?.id) {
        console.warn("No current user found");
        setError("Usuário não encontrado. Faça login novamente.");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Loading dashboard data for user:", currentUser.id);
        setIsLoading(true);
        setError(null);

        const dashboardData =
          await dashboardService.getRepresentativeDashboardData(currentUser.id);

        console.log("Dashboard data loaded successfully:", dashboardData);

        if (dashboardData) {
          setPerformanceData(
            dashboardData.performanceData || {
              totalSales: 0,
              targetSales: 500000,
              activeContracts: 0,
              completedContracts: 0,
              pendingCommission: 0,
              nextCommissionDate: "15/08/2025",
              nextCommissionValue: 0,
            },
          );
          setMyContracts(dashboardData.myContracts || []);
          setCommissionHistory(dashboardData.commissionHistory || []);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(`Erro ao carregar dados: ${errorMessage}`);

        // Set default data even on error
        setPerformanceData({
          totalSales: 0,
          targetSales: 500000,
          activeContracts: 0,
          completedContracts: 0,
          pendingCommission: 0,
          nextCommissionDate: "15/08/2025",
          nextCommissionValue: 0,
        });
        setMyContracts([]);
        setCommissionHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser?.id, showContractFlow]); // Add showContractFlow as dependency to reload when contract is created

  const salesProgress =
    (performanceData.totalSales / performanceData.targetSales) * 100;
  const availableBalance = performanceData.pendingCommission;

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const handleWithdrawalRequest = () => {
    const amount = parseFloat(withdrawalAmount);
    if (amount > 0 && amount <= availableBalance) {
      console.log(`Withdrawal request: R$ ${amount.toLocaleString("pt-BR")}`);
      setIsWithdrawalDialogOpen(false);
      setWithdrawalAmount("");
      alert(
        `Solicitação de retirada de R$ ${amount.toLocaleString("pt-BR")} enviada com sucesso!`,
      );
    } else {
      alert("Valor inválido para retirada");
    }
  };

  const handleStartSimulation = () => {
    setShowContractFlow(true);
  };

  const handleContractFlowComplete = () => {
    setShowContractFlow(false);
    setActiveTab("contracts");
    // Refresh dashboard data after contract creation by re-triggering the useEffect
    // The useEffect will run again because showContractFlow changed
  };

  const handleViewContract = (contractId: string) => {
    setSelectedContractId(contractId);
    setIsContractModalOpen(true);
  };

  const handleEditContract = (contractId: string) => {
    setSelectedContractId(contractId);
    setIsContractModalOpen(true);
  };

  const handleCloseContractModal = () => {
    setIsContractModalOpen(false);
    setSelectedContractId(null);
    // Refresh dashboard data when modal closes
    window.location.reload();
  };

  // Contract creation flow is now integrated within the dashboard

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
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`}
                  alt={displayName}
                />
                <AvatarFallback>
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">Representante</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="ml-2 text-muted-foreground hover:text-foreground"
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
          {showContractFlow && (
            <div className="mb-6">
              <ContractCreationFlow onComplete={handleContractFlowComplete} />
            </div>
          )}
          {!showContractFlow && isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            </div>
          )}

          {!showContractFlow && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erro no Dashboard
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="text-red-800 border-red-300 hover:bg-red-100"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showContractFlow &&
            !isLoading &&
            !error &&
            activeTab === "dashboard" && (
              <>
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
                      onClick={handleStartSimulation}
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

          {!showContractFlow &&
            !isLoading &&
            !error &&
            activeTab === "simulator" && (
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

          {!showContractFlow &&
            !isLoading &&
            !error &&
            activeTab === "contracts" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Meus Contratos</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartSimulation}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Criar Contrato
                    </Button>
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
                    {myContracts.length > 0 ? (
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
                                {(contract.status === "active" ||
                                  contract.status === "ativo") && (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  >
                                    Ativo
                                  </Badge>
                                )}
                                {(contract.status === "completed" ||
                                  contract.status === "concluído") && (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-100 text-green-800 hover:bg-green-100"
                                  >
                                    Concluído
                                  </Badge>
                                )}
                                {(contract.status === "pending" ||
                                  contract.status === "pendente") && (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                                  >
                                    Pendente
                                  </Badge>
                                )}
                                {(contract.status === "cancelled" ||
                                  contract.status === "cancelado") && (
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
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleViewContract(contract.id)
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {(contract.status === "pending" ||
                                    contract.status === "pendente" ||
                                    contract.status === "cancelled" ||
                                    contract.status === "cancelado" ||
                                    contract.status === "Reprovado") && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleEditContract(contract.id)
                                      }
                                    >
                                      <Edit className="h-4 w-4" />
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
                        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">
                          Nenhum contrato encontrado
                        </p>
                        <p className="text-muted-foreground mb-4">
                          Você ainda não possui contratos registrados no
                          sistema.
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleStartSimulation}
                        >
                          <Calculator className="mr-2 h-4 w-4" />
                          Criar Primeira Simulação
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

          {!showContractFlow &&
            !isLoading &&
            !error &&
            activeTab === "commission" && (
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
                            onChange={(e) =>
                              setWithdrawalAmount(e.target.value)
                            }
                            className="col-span-3"
                            placeholder="0,00"
                            min="0"
                            max={availableBalance}
                            step="0.01"
                          />
                        </div>
                        {withdrawalAmount && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-blue-800">
                              Valor da solicitação:
                            </p>
                            <p className="text-lg font-bold text-blue-900">
                              R${" "}
                              {parseFloat(
                                withdrawalAmount || "0",
                              ).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
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
                          onClick={() => setIsWithdrawalDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleWithdrawalRequest}>
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
                    {commissionHistory.length > 0 ? (
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
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">
                          Nenhuma comissão encontrada
                        </p>
                        <p className="text-muted-foreground mb-4">
                          Você ainda não possui histórico de comissões.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("contracts")}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Ver Contratos
                        </Button>
                      </div>
                    )}
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

      {/* Contract Details Modal */}
      <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
          <div className="h-[95vh] overflow-y-auto">
            {selectedContractId && (
              <ContractDetails
                contractId={selectedContractId}
                onBack={handleCloseContractModal}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepresentativeDashboard;
