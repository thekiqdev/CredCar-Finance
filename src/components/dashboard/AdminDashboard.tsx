import React, { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Users,
  FileText,
  Settings,
  PlusCircle,
  Search,
  Bell,
  ChevronDown,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Eye,
  Mail,
  Phone,
  Receipt,
  CreditCard,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Trash2,
} from "lucide-react";

interface AdminDashboardProps {
  userName?: string;
  notifications?: number;
}

interface Contract {
  id: string;
  client: string;
  representative: string;
  value: number;
  installments: number;
  paidInstallments: number;
  remainingValue: number;
  status: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  contractId: string;
  amount: number;
  installmentNumber: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  createdAt: string;
  paidAt?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userName = "Admin User",
  notifications = 5,
}) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeConfigTab, setActiveConfigTab] = useState("commission-tables");
  const [isNewRepDialogOpen, setIsNewRepDialogOpen] = useState(false);
  const [isEditRepDialogOpen, setIsEditRepDialogOpen] = useState(false);
  const [isDeleteRepDialogOpen, setIsDeleteRepDialogOpen] = useState(false);
  const [editingRepresentative, setEditingRepresentative] = useState(null);
  const [deletingRepresentative, setDeletingRepresentative] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [newRepresentative, setNewRepresentative] = useState({
    name: "",
    email: "",
    phone: "",
    cnpj: "",
    razaoSocial: "",
    pontoVenda: "",
    commissionCode: "",
    password: "",
    status: "active",
  });
  const [nextRepresentativeId, setNextRepresentativeId] = useState(6);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isEarlyPaymentDialogOpen, setIsEarlyPaymentDialogOpen] =
    useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  );
  const [earlyPaymentInstallments, setEarlyPaymentInstallments] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([
    {
      id: "PV-2023-001",
      client: "João Silva",
      representative: "Carlos Oliveira",
      value: 45000,
      installments: 80,
      paidInstallments: 12,
      remainingValue: 38250,
      status: "Ativo",
      createdAt: "2023-01-15",
    },
    {
      id: "PV-2023-002",
      client: "Maria Santos",
      representative: "Ana Pereira",
      value: 38500,
      installments: 80,
      paidInstallments: 8,
      remainingValue: 34650,
      status: "Ativo",
      createdAt: "2023-02-20",
    },
    {
      id: "PV-2023-003",
      client: "Pedro Costa",
      representative: "Carlos Oliveira",
      value: 52000,
      installments: 80,
      paidInstallments: 15,
      remainingValue: 42250,
      status: "Ativo",
      createdAt: "2023-01-10",
    },
  ]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [commissionTables, setCommissionTables] = useState([
    {
      id: "A",
      name: "Tabela Premium",
      percentage: 4,
      installments: 1,
      description: "Pagamento integral (1 parcela)",
      activeContracts: 86,
    },
    {
      id: "B",
      name: "Tabela Padrão",
      percentage: 4,
      installments: 2,
      description: "Pagamento dividido em 2 parcelas",
      activeContracts: 64,
    },
    {
      id: "C",
      name: "Tabela Flexível",
      percentage: 4,
      installments: 3,
      description: "Pagamento dividido em 3 parcelas",
      activeContracts: 52,
    },
    {
      id: "D",
      name: "Tabela Básica",
      percentage: 4,
      installments: 4,
      description: "Pagamento dividido em 4 parcelas",
      activeContracts: 46,
    },
  ]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([
    {
      id: "WR-001",
      representativeName: "Carlos Oliveira",
      amount: 2400,
      requestDate: "2023-06-20",
      status: "pending",
      availableBalance: 3200,
    },
    {
      id: "WR-002",
      representativeName: "Ana Pereira",
      amount: 1800,
      requestDate: "2023-06-21",
      status: "pending",
      availableBalance: 2100,
    },
    {
      id: "WR-003",
      representativeName: "Marcos Souza",
      amount: 1500,
      requestDate: "2023-06-19",
      status: "approved",
      availableBalance: 1500,
    },
  ]);
  const [isNewTableDialogOpen, setIsNewTableDialogOpen] = useState(false);
  const [newTable, setNewTable] = useState({
    name: "",
    percentage: 4,
    installments: 1,
    description: "",
  });
  const [commissionReports, setCommissionReports] = useState([
    {
      id: "1",
      representative: "Carlos Oliveira",
      period: "Junho 2023",
      totalCommission: 3200,
      paidCommission: 800,
      pendingCommission: 2400,
      contracts: 8,
    },
    {
      id: "2",
      representative: "Ana Pereira",
      period: "Junho 2023",
      totalCommission: 2100,
      paidCommission: 300,
      pendingCommission: 1800,
      contracts: 6,
    },
    {
      id: "3",
      representative: "Marcos Souza",
      period: "Junho 2023",
      totalCommission: 1500,
      paidCommission: 1500,
      pendingCommission: 0,
      contracts: 4,
    },
  ]);

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({
    asaasApiKey: "",
    autoGenerateBoletos: false,
    enablePix: false,
    defaultDueDays: 30,
  });

  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    provider: "smtp",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    encryption: "tls",
  });

  // Mock data for representatives
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
    },
  ];

  // Pagination calculations
  const totalPages = Math.ceil(representatives.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRepresentatives = representatives.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const generateCommissionCode = (representativeId: number) => {
    const code = representativeId.toString().padStart(8, "0");
    return code;
  };

  const formatCpfCnpj = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 11) {
      // CPF format: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    } else {
      // CNPJ format: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    }
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewRepresentative({ ...newRepresentative, password });
  };

  const handleCreateRepresentative = () => {
    // Generate commission code based on the new representative ID
    const commissionCode = generateCommissionCode(nextRepresentativeId);
    const representativeWithCode = {
      ...newRepresentative,
      id: nextRepresentativeId,
      commissionCode: commissionCode,
    };

    console.log("Creating representative:", representativeWithCode);

    // Increment the next ID for future representatives
    setNextRepresentativeId(nextRepresentativeId + 1);

    setIsNewRepDialogOpen(false);
    setNewRepresentative({
      name: "",
      email: "",
      phone: "",
      cnpj: "",
      razaoSocial: "",
      pontoVenda: "",
      commissionCode: "",
      password: "",
      status: "active",
    });
  };

  const handleEditRepresentative = (rep) => {
    setEditingRepresentative(rep);
    setIsEditRepDialogOpen(true);
  };

  const handleUpdateRepresentative = () => {
    console.log("Updating representative:", editingRepresentative);
    setIsEditRepDialogOpen(false);
    setEditingRepresentative(null);
  };

  const handleDeleteRepresentative = (rep) => {
    setDeletingRepresentative(rep);
    setIsDeleteRepDialogOpen(true);
  };

  const confirmDeleteRepresentative = () => {
    if (adminPassword === "admin123") {
      // In real app, validate against actual admin password
      console.log("Deleting representative:", deletingRepresentative);
      setIsDeleteRepDialogOpen(false);
      setDeletingRepresentative(null);
      setAdminPassword("");
    } else {
      alert("Senha incorreta!");
    }
  };

  const generateInvoice = (contract: Contract) => {
    const installmentValue =
      contract.remainingValue /
      (contract.installments - contract.paidInstallments);
    const nextInstallmentNumber = contract.paidInstallments + 1;
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);

    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      contractId: contract.id,
      amount: installmentValue,
      installmentNumber: nextInstallmentNumber,
      dueDate: dueDate.toISOString().split("T")[0],
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setInvoices((prev) => [...prev, newInvoice]);
    console.log("Invoice generated:", newInvoice);
  };

  const handleEarlyPayment = () => {
    if (!selectedContract || !earlyPaymentInstallments) return;

    const installmentsToPayCount = parseInt(earlyPaymentInstallments);
    const remainingInstallments =
      selectedContract.installments - selectedContract.paidInstallments;

    if (
      installmentsToPayCount <= 0 ||
      installmentsToPayCount > remainingInstallments
    ) {
      alert("Número de parcelas inválido para antecipação");
      return;
    }

    const installmentValue =
      selectedContract.remainingValue / remainingInstallments;
    const paymentAmount = installmentValue * installmentsToPayCount;

    // Update contract with early payment
    const updatedContracts = contracts.map((contract) => {
      if (contract.id === selectedContract.id) {
        const newRemainingValue = contract.remainingValue - paymentAmount;

        return {
          ...contract,
          remainingValue: newRemainingValue,
          paidInstallments: contract.paidInstallments + installmentsToPayCount,
        };
      }
      return contract;
    });

    setContracts(updatedContracts);

    // Generate invoice for early payment
    const earlyPaymentInvoice: Invoice = {
      id: `INV-EARLY-${Date.now()}`,
      contractId: selectedContract.id,
      amount: paymentAmount,
      installmentNumber: 0, // Special case for early payment
      dueDate: new Date().toISOString().split("T")[0],
      status: "paid",
      createdAt: new Date().toISOString().split("T")[0],
      paidAt: new Date().toISOString().split("T")[0],
    };

    setInvoices((prev) => [...prev, earlyPaymentInvoice]);

    setIsEarlyPaymentDialogOpen(false);
    setSelectedContract(null);
    setEarlyPaymentInstallments("");

    console.log("Early payment processed:", earlyPaymentInvoice);
  };

  const handleWithdrawalAction = (
    requestId: string,
    action: "approve" | "reject",
  ) => {
    setWithdrawalRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: action === "approve" ? "approved" : "rejected",
            }
          : request,
      ),
    );
    console.log(`Withdrawal request ${requestId} ${action}d`);
  };

  const handleCreateTable = () => {
    const newId = String.fromCharCode(65 + commissionTables.length);
    const table = {
      id: newId,
      name: newTable.name,
      percentage: newTable.percentage,
      installments: newTable.installments,
      description: newTable.description,
      activeContracts: 0,
    };
    setCommissionTables((prev) => [...prev, table]);
    setIsNewTableDialogOpen(false);
    setNewTable({ name: "", percentage: 4, installments: 1, description: "" });
    console.log("New commission table created:", table);
  };

  const handleDeleteTable = (tableId: string) => {
    if (commissionTables.find((t) => t.id === tableId)?.activeContracts === 0) {
      setCommissionTables((prev) => prev.filter((t) => t.id !== tableId));
      console.log(`Commission table ${tableId} deleted`);
    } else {
      alert("Não é possível excluir uma tabela com contratos ativos");
    }
  };

  const renderDashboardStats = () => (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 1.234.567</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
            <div className="mt-2 flex items-center text-xs text-green-500">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>12% de aumento</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Contratos Ativos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">248</div>
            <p className="text-xs text-muted-foreground">
              +6 novos contratos hoje
            </p>
            <div className="mt-2 flex items-center text-xs text-green-500">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>8% de aumento</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Representantes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">36</div>
            <p className="text-xs text-muted-foreground">+2 novos este mês</p>
            <div className="mt-2 flex items-center text-xs text-green-500">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>5% de aumento</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Comissões Pendentes
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 45.890</div>
            <p className="text-xs text-muted-foreground">
              12 pagamentos pendentes
            </p>
            <div className="mt-2 flex items-center text-xs text-red-500">
              <ArrowDownRight className="mr-1 h-3 w-3" />
              <span>3% de aumento</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2">
            <PlusCircle className="h-6 w-6" />
            <span>Novo Representante</span>
          </Button>
          <Button
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            variant="outline"
          >
            <FileText className="h-6 w-6" />
            <span>Gerar Relatório</span>
          </Button>
          <Button
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            variant="outline"
          >
            <Settings className="h-6 w-6" />
            <span>Configurações</span>
          </Button>
          <Button
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            variant="outline"
          >
            <Bell className="h-6 w-6" />
            <span>Notificações</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Contracts */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center">
            <div>
              <CardTitle>Contratos Recentes</CardTitle>
              <CardDescription>
                Últimos 5 contratos registrados no sistema
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="ml-auto">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Representante</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    id: "PV-2023-001",
                    client: "João Silva",
                    rep: "Carlos Oliveira",
                    value: "R$ 45.000",
                    status: "Aprovado",
                  },
                  {
                    id: "PV-2023-002",
                    client: "Maria Santos",
                    rep: "Ana Pereira",
                    value: "R$ 38.500",
                    status: "Pendente",
                  },
                  {
                    id: "PV-2023-003",
                    client: "Pedro Costa",
                    rep: "Carlos Oliveira",
                    value: "R$ 52.000",
                    status: "Aprovado",
                  },
                  {
                    id: "PV-2023-004",
                    client: "Lucia Ferreira",
                    rep: "Marcos Souza",
                    value: "R$ 41.200",
                    status: "Em análise",
                  },
                  {
                    id: "PV-2023-005",
                    client: "Roberto Alves",
                    rep: "Ana Pereira",
                    value: "R$ 36.800",
                    status: "Pendente",
                  },
                ].map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.id}</TableCell>
                    <TableCell>{contract.client}</TableCell>
                    <TableCell>{contract.rep}</TableCell>
                    <TableCell>{contract.value}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          contract.status === "Aprovado"
                            ? "default"
                            : contract.status === "Pendente"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {contract.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Representatives */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Representantes Destaque</CardTitle>
            <CardDescription>
              Top 5 representantes por volume de vendas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Carlos Oliveira", sales: 85, value: "R$ 425.000" },
              { name: "Ana Pereira", sales: 72, value: "R$ 360.000" },
              { name: "Marcos Souza", sales: 65, value: "R$ 325.000" },
              { name: "Juliana Costa", sales: 58, value: "R$ 290.000" },
              { name: "Ricardo Gomes", sales: 45, value: "R$ 225.000" },
            ].map((rep, index) => (
              <div key={rep.name} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rep.name}`}
                  />
                  <AvatarFallback>
                    {rep.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">{rep.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {rep.sales} vendas | {rep.value}
                  </p>
                </div>
                <div className="ml-auto font-medium">{100 - index * 10}%</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-card border-r p-4">
        <div className="flex items-center mb-8">
          <div className="h-8 w-8 rounded-md bg-red-600 mr-2"></div>
          <h1 className="text-xl font-bold">CredCar</h1>
        </div>

        <nav className="space-y-4">
          <div className="space-y-1">
            <Button
              variant={activeSection === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("dashboard")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={
                activeSection === "representatives" ? "default" : "ghost"
              }
              className="w-full justify-start"
              onClick={() => setActiveSection("representatives")}
            >
              <Users className="mr-2 h-4 w-4" />
              Representantes
            </Button>
            <Button
              variant={activeSection === "contracts" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("contracts")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Contratos
            </Button>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Financeiro
            </p>
            <Button
              variant={
                activeSection === "commission-reports" ? "default" : "ghost"
              }
              className="w-full justify-start"
              onClick={() => setActiveSection("commission-reports")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Relatório de Comissões
            </Button>
            <Button
              variant={activeSection === "withdrawals" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("withdrawals")}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Solicitações de Retirada
            </Button>
            <Button
              variant={activeSection === "invoices" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("invoices")}
            >
              <Receipt className="mr-2 h-4 w-4" />
              Gestão de Faturas
            </Button>
          </div>

          <Separator />

          <div className="space-y-1">
            <Button
              variant={activeSection === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </div>
        </nav>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center rounded-md border px-3 py-2 w-72">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-0 focus:outline-none flex-1 text-sm"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-600"></span>
                )}
              </Button>
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
                  <AvatarFallback>AU</AvatarFallback>
                </Avatar>
                <div className="ml-2 hidden md:block">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">Administrador</p>
                </div>
                <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === "dashboard" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                  Visão geral do sistema de gestão de vendas.
                </p>
              </div>
              {renderDashboardStats()}
            </>
          )}

          {activeSection === "representatives" && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Representantes
                  </h1>
                  <p className="text-muted-foreground">
                    Gerencie os representantes de vendas e seus perfis.
                  </p>
                </div>
                <Dialog
                  open={isNewRepDialogOpen}
                  onOpenChange={setIsNewRepDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Novo Representante
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Representante</DialogTitle>
                      <DialogDescription>
                        Preencha os dados do novo representante de vendas.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nome Completo *
                        </Label>
                        <Input
                          id="name"
                          value={newRepresentative.name}
                          onChange={(e) =>
                            setNewRepresentative({
                              ...newRepresentative,
                              name: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Nome completo"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newRepresentative.email}
                          onChange={(e) =>
                            setNewRepresentative({
                              ...newRepresentative,
                              email: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="email@exemplo.com"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          value={newRepresentative.phone}
                          onChange={(e) =>
                            setNewRepresentative({
                              ...newRepresentative,
                              phone: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cnpj" className="text-right">
                          CPF/CNPJ
                        </Label>
                        <Input
                          id="cnpj"
                          value={newRepresentative.cnpj}
                          onChange={(e) => {
                            const formatted = formatCpfCnpj(e.target.value);
                            setNewRepresentative({
                              ...newRepresentative,
                              cnpj: formatted,
                            });
                          }}
                          className="col-span-3"
                          placeholder="000.000.000-00 ou 00.000.000/0000-00"
                          maxLength={18}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="razaoSocial" className="text-right">
                          Razão Social
                        </Label>
                        <Input
                          id="razaoSocial"
                          value={newRepresentative.razaoSocial}
                          onChange={(e) =>
                            setNewRepresentative({
                              ...newRepresentative,
                              razaoSocial: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Razão social da empresa"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pontoVenda" className="text-right">
                          Ponto de Venda
                        </Label>
                        <Input
                          id="pontoVenda"
                          value={newRepresentative.pontoVenda}
                          onChange={(e) =>
                            setNewRepresentative({
                              ...newRepresentative,
                              pontoVenda: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Localização do ponto de venda"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="commissionCode" className="text-right">
                          Código da Comissão
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="commissionCode"
                            value="Será gerado após o cadastro"
                            className="flex-1"
                            placeholder="Gerado automaticamente após cadastro"
                            readOnly
                            disabled
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            O código será o ID do representante com 8 dígitos
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Senha
                        </Label>
                        <div className="col-span-3 flex gap-2">
                          <Input
                            id="password"
                            type="text"
                            value={newRepresentative.password}
                            onChange={(e) =>
                              setNewRepresentative({
                                ...newRepresentative,
                                password: e.target.value,
                              })
                            }
                            className="flex-1"
                            placeholder="Digite ou gere uma senha"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generatePassword}
                          >
                            Gerar Senha
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        onClick={handleCreateRepresentative}
                      >
                        Cadastrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit Representative Dialog */}
                <Dialog
                  open={isEditRepDialogOpen}
                  onOpenChange={setIsEditRepDialogOpen}
                >
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Editar Representante</DialogTitle>
                      <DialogDescription>
                        Edite os dados do representante selecionado.
                      </DialogDescription>
                    </DialogHeader>
                    {editingRepresentative && (
                      <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="editName" className="text-right">
                            Nome Completo *
                          </Label>
                          <Input
                            id="editName"
                            value={editingRepresentative.name}
                            onChange={(e) =>
                              setEditingRepresentative({
                                ...editingRepresentative,
                                name: e.target.value,
                              })
                            }
                            className="col-span-3"
                            placeholder="Nome completo"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="editEmail" className="text-right">
                            Email *
                          </Label>
                          <Input
                            id="editEmail"
                            type="email"
                            value={editingRepresentative.email}
                            onChange={(e) =>
                              setEditingRepresentative({
                                ...editingRepresentative,
                                email: e.target.value,
                              })
                            }
                            className="col-span-3"
                            placeholder="email@exemplo.com"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="editPhone" className="text-right">
                            Telefone
                          </Label>
                          <Input
                            id="editPhone"
                            value={editingRepresentative.phone}
                            onChange={(e) =>
                              setEditingRepresentative({
                                ...editingRepresentative,
                                phone: e.target.value,
                              })
                            }
                            className="col-span-3"
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="editCnpj" className="text-right">
                            CPF/CNPJ
                          </Label>
                          <Input
                            id="editCnpj"
                            value={
                              editingRepresentative.cnpj || "123.456.789-00"
                            }
                            className="col-span-3"
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                            readOnly
                            disabled
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="editRazaoSocial"
                            className="text-right"
                          >
                            Razão Social
                          </Label>
                          <Input
                            id="editRazaoSocial"
                            value={editingRepresentative.razaoSocial || ""}
                            onChange={(e) =>
                              setEditingRepresentative({
                                ...editingRepresentative,
                                razaoSocial: e.target.value,
                              })
                            }
                            className="col-span-3"
                            placeholder="Razão social da empresa"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="editPontoVenda"
                            className="text-right"
                          >
                            Ponto de Venda
                          </Label>
                          <Input
                            id="editPontoVenda"
                            value={editingRepresentative.pontoVenda || ""}
                            onChange={(e) =>
                              setEditingRepresentative({
                                ...editingRepresentative,
                                pontoVenda: e.target.value,
                              })
                            }
                            className="col-span-3"
                            placeholder="Localização do ponto de venda"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="editCommissionCode"
                            className="text-right"
                          >
                            Código da Comissão
                          </Label>
                          <Input
                            id="editCommissionCode"
                            value={
                              editingRepresentative.id
                                ?.toString()
                                .padStart(8, "0") || "00000000"
                            }
                            className="col-span-3"
                            placeholder="Código gerado automaticamente"
                            readOnly
                            disabled
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="editStatus" className="text-right">
                            Status
                          </Label>
                          <Select
                            value={editingRepresentative.status}
                            onValueChange={(value) =>
                              setEditingRepresentative({
                                ...editingRepresentative,
                                status: value,
                              })
                            }
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ativo">Ativa</SelectItem>
                              <SelectItem value="Cancelada">
                                Cancelada
                              </SelectItem>
                              <SelectItem value="Pausada">Pausada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditRepDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleUpdateRepresentative}
                      >
                        Salvar Alterações
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete Representative Dialog */}
                <Dialog
                  open={isDeleteRepDialogOpen}
                  onOpenChange={setIsDeleteRepDialogOpen}
                >
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Confirmar Exclusão</DialogTitle>
                      <DialogDescription>
                        Esta ação não pode ser desfeita. Para confirmar a
                        exclusão do representante, digite sua senha de
                        administrador.
                      </DialogDescription>
                    </DialogHeader>
                    {deletingRepresentative && (
                      <div className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="font-medium text-red-800">
                            {deletingRepresentative.name}
                          </h4>
                          <p className="text-sm text-red-600">
                            ID:{" "}
                            {deletingRepresentative.id
                              .toString()
                              .padStart(3, "0")}{" "}
                            | {deletingRepresentative.email}
                          </p>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="adminPassword" className="text-right">
                            Senha Admin
                          </Label>
                          <Input
                            id="adminPassword"
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="col-span-3"
                            placeholder="Digite sua senha de administrador"
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDeleteRepDialogOpen(false);
                          setAdminPassword("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={confirmDeleteRepresentative}
                        disabled={!adminPassword}
                      >
                        Confirmar Exclusão
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Representatives Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Lista de Representantes</CardTitle>
                      <CardDescription>
                        {representatives.length} representantes cadastrados no
                        sistema
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="itemsPerPage"
                        className="text-sm font-medium"
                      >
                        Itens por página:
                      </Label>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={handleItemsPerPageChange}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Representante</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Vendas Totais</TableHead>
                        <TableHead>Contratos</TableHead>
                        <TableHead>Data de Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRepresentatives.map((rep) => (
                        <TableRow key={rep.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rep.name}`}
                                />
                                <AvatarFallback>
                                  {rep.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{rep.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  ID: {rep.id.toString().padStart(3, "0")}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Mail className="mr-1 h-3 w-3" />
                                {rep.email}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="mr-1 h-3 w-3" />
                                {rep.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                rep.status === "Ativo" ? "default" : "secondary"
                              }
                            >
                              {rep.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {rep.totalSales}
                          </TableCell>
                          <TableCell>{rep.contractsCount} contratos</TableCell>
                          <TableCell className="text-muted-foreground">
                            {rep.joinDate}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate(`/representative/${rep.id}`)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRepresentative(rep)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRepresentative(rep)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1} a{" "}
                        {Math.min(endIndex, representatives.length)} de{" "}
                        {representatives.length} representantes
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Representatives Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Representantes
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {representatives.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {
                        representatives.filter((r) => r.status === "Ativo")
                          .length
                      }{" "}
                      ativos
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Vendas Médias
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">R$ 325.000</div>
                    <p className="text-xs text-muted-foreground">
                      Por representante ativo
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Contratos Médios
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">21</div>
                    <p className="text-xs text-muted-foreground">
                      Contratos por representante
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Novos Este Mês
                    </CardTitle>
                    <PlusCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2</div>
                    <p className="text-xs text-muted-foreground">
                      Representantes cadastrados
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeSection === "contracts" && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
              <p className="text-muted-foreground">
                Gerencie todos os contratos do sistema.
              </p>
              <div className="mt-8 text-center text-muted-foreground">
                Seção em desenvolvimento...
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                  Configurações
                </h1>
                <p className="text-muted-foreground">
                  Gerencie as configurações gerais, integrações e
                  personalizações do sistema.
                </p>
              </div>

              {/* Configuration Tabs */}
              <Tabs value={activeConfigTab} onValueChange={setActiveConfigTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="commission-tables">
                    Tabelas de Comissão
                  </TabsTrigger>
                  <TabsTrigger value="payments">Pagamentos (Asaas)</TabsTrigger>
                  <TabsTrigger value="email">Configuração de Email</TabsTrigger>
                </TabsList>

                {/* Commission Tables Tab */}
                <TabsContent value="commission-tables">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">
                        Tabelas de Comissão
                      </h2>
                      <p className="text-muted-foreground">
                        Gerencie as tabelas de comissão disponíveis no sistema
                      </p>
                    </div>
                    <Dialog
                      open={isNewTableDialogOpen}
                      onOpenChange={setIsNewTableDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Nova Tabela
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>
                            Criar Nova Tabela de Comissão
                          </DialogTitle>
                          <DialogDescription>
                            Configure uma nova tabela de comissão para o
                            sistema.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tableName" className="text-right">
                              Nome
                            </Label>
                            <Input
                              id="tableName"
                              value={newTable.name}
                              onChange={(e) =>
                                setNewTable({
                                  ...newTable,
                                  name: e.target.value,
                                })
                              }
                              className="col-span-3"
                              placeholder="Nome da tabela"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="percentage" className="text-right">
                              Percentual
                            </Label>
                            <Input
                              id="percentage"
                              type="number"
                              value={newTable.percentage}
                              onChange={(e) =>
                                setNewTable({
                                  ...newTable,
                                  percentage: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="col-span-3"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="installments"
                              className="text-right"
                            >
                              Parcelas
                            </Label>
                            <Input
                              id="installments"
                              type="number"
                              value={newTable.installments}
                              onChange={(e) =>
                                setNewTable({
                                  ...newTable,
                                  installments: parseInt(e.target.value) || 1,
                                })
                              }
                              className="col-span-3"
                              min="1"
                              max="12"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                              Descrição
                            </Label>
                            <Input
                              id="description"
                              value={newTable.description}
                              onChange={(e) =>
                                setNewTable({
                                  ...newTable,
                                  description: e.target.value,
                                })
                              }
                              className="col-span-3"
                              placeholder="Descrição da tabela"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={handleCreateTable}>
                            Criar Tabela
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tabelas de Comissão</CardTitle>
                      <CardDescription>
                        Gerencie as tabelas de comissão disponíveis no sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {commissionTables.map((table) => (
                          <div
                            key={table.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline">
                                  Tabela {table.id}
                                </Badge>
                                <h4 className="font-medium">{table.name}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {table.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span>
                                  <strong>Percentual:</strong>{" "}
                                  {table.percentage}%
                                </span>
                                <span>
                                  <strong>Parcelas:</strong>{" "}
                                  {table.installments}
                                </span>
                                <span>
                                  <strong>Contratos Ativos:</strong>{" "}
                                  {table.activeContracts}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTable(table.id)}
                                disabled={table.activeContracts > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">
                        Configuração de Pagamentos
                      </h2>
                      <p className="text-muted-foreground">
                        Integre sua conta do gateway de pagamentos Asaas para
                        automatizar a geração de faturas e cobranças.
                      </p>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Credenciais da API Asaas</CardTitle>
                        <CardDescription>
                          Configure sua chave de API para integração com o Asaas
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="asaasApiKey">
                            Chave da API (API Key)
                          </Label>
                          <Input
                            id="asaasApiKey"
                            type="password"
                            value={paymentSettings.asaasApiKey}
                            onChange={(e) =>
                              setPaymentSettings({
                                ...paymentSettings,
                                asaasApiKey: e.target.value,
                              })
                            }
                            placeholder="Insira sua chave da API do Asaas"
                          />
                          <p className="text-sm text-muted-foreground">
                            <a
                              href="#"
                              className="text-blue-600 hover:underline"
                            >
                              Como encontrar minha chave da API no Asaas?
                            </a>
                          </p>
                        </div>
                        <Button variant="outline">Verificar Conexão</Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações de Fatura</CardTitle>
                        <CardDescription>
                          Configure as opções de geração e vencimento de faturas
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="autoGenerateBoletos"
                            checked={paymentSettings.autoGenerateBoletos}
                            onChange={(e) =>
                              setPaymentSettings({
                                ...paymentSettings,
                                autoGenerateBoletos: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <Label htmlFor="autoGenerateBoletos">
                            Ativar geração automática de boletos
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enablePix"
                            checked={paymentSettings.enablePix}
                            onChange={(e) =>
                              setPaymentSettings({
                                ...paymentSettings,
                                enablePix: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <Label htmlFor="enablePix">
                            Ativar PIX como forma de pagamento
                          </Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="defaultDueDays">
                            Dias para vencimento padrão da fatura
                          </Label>
                          <Input
                            id="defaultDueDays"
                            type="number"
                            value={paymentSettings.defaultDueDays}
                            onChange={(e) =>
                              setPaymentSettings({
                                ...paymentSettings,
                                defaultDueDays: parseInt(e.target.value) || 30,
                              })
                            }
                            min="1"
                            max="365"
                            className="w-32"
                          />
                        </div>
                        <Button>Salvar Configurações</Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Email Tab */}
                <TabsContent value="email">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">
                        Configuração de Envio de Emails
                      </h2>
                      <p className="text-muted-foreground">
                        Configure o servidor SMTP para o envio de notificações
                        automáticas do sistema, como faturas e contratos.
                      </p>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações do Servidor SMTP</CardTitle>
                        <CardDescription>
                          Configure os dados de conexão com seu provedor de
                          email
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="emailProvider">
                            Provedor de Email
                          </Label>
                          <Select
                            value={emailSettings.provider}
                            onValueChange={(value) =>
                              setEmailSettings({
                                ...emailSettings,
                                provider: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o provedor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="smtp">SMTP</SelectItem>
                              <SelectItem value="sendgrid">SendGrid</SelectItem>
                              <SelectItem value="mailgun">Mailgun</SelectItem>
                              <SelectItem value="ses">Amazon SES</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="smtpHost">Host SMTP</Label>
                            <Input
                              id="smtpHost"
                              value={emailSettings.smtpHost}
                              onChange={(e) =>
                                setEmailSettings({
                                  ...emailSettings,
                                  smtpHost: e.target.value,
                                })
                              }
                              placeholder="smtp.gmail.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtpPort">Porta SMTP</Label>
                            <Input
                              id="smtpPort"
                              value={emailSettings.smtpPort}
                              onChange={(e) =>
                                setEmailSettings({
                                  ...emailSettings,
                                  smtpPort: e.target.value,
                                })
                              }
                              placeholder="587"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtpUser">Usuário SMTP</Label>
                          <Input
                            id="smtpUser"
                            type="email"
                            value={emailSettings.smtpUser}
                            onChange={(e) =>
                              setEmailSettings({
                                ...emailSettings,
                                smtpUser: e.target.value,
                              })
                            }
                            placeholder="seu@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtpPassword">Senha SMTP</Label>
                          <Input
                            id="smtpPassword"
                            type="password"
                            value={emailSettings.smtpPassword}
                            onChange={(e) =>
                              setEmailSettings({
                                ...emailSettings,
                                smtpPassword: e.target.value,
                              })
                            }
                            placeholder="Sua senha SMTP"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="encryption">Criptografia</Label>
                          <Select
                            value={emailSettings.encryption}
                            onValueChange={(value) =>
                              setEmailSettings({
                                ...emailSettings,
                                encryption: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma</SelectItem>
                              <SelectItem value="ssl">SSL</SelectItem>
                              <SelectItem value="tls">TLS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="outline">Enviar Email de Teste</Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Modelos de Email</CardTitle>
                        <CardDescription>
                          Personalize o conteúdo dos emails enviados pelo
                          sistema
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">Fatura Gerada</h4>
                            <p className="text-sm text-muted-foreground">
                              Email enviado quando uma nova fatura é gerada
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">
                              Lembrete de Vencimento de Fatura
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Email de lembrete antes do vencimento da fatura
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">
                              Contrato Enviado para Assinatura
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Email enviado quando um contrato precisa ser
                              assinado
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </div>
                        <Button>Salvar Configurações</Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {activeSection === "commission-reports" && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Relatório de Comissões
                  </h1>
                  <p className="text-muted-foreground">
                    Visualize todas as comissões geradas no sistema.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>

              {/* Commission Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Comissões
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R${" "}
                      {commissionReports
                        .reduce((sum, r) => sum + r.totalCommission, 0)
                        .toLocaleString("pt-BR")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Período atual
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Comissões Pagas
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R${" "}
                      {commissionReports
                        .reduce((sum, r) => sum + r.paidCommission, 0)
                        .toLocaleString("pt-BR")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Já processadas
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Comissões Pendentes
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R${" "}
                      {commissionReports
                        .reduce((sum, r) => sum + r.pendingCommission, 0)
                        .toLocaleString("pt-BR")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aguardando pagamento
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Representantes Ativos
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {commissionReports.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Com comissões no período
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Relatório Detalhado</CardTitle>
                  <CardDescription>
                    Comissões por representante no período selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Representante</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Contratos</TableHead>
                        <TableHead>Total Comissão</TableHead>
                        <TableHead>Pago</TableHead>
                        <TableHead>Pendente</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">
                            {report.representative}
                          </TableCell>
                          <TableCell>{report.period}</TableCell>
                          <TableCell>{report.contracts} contratos</TableCell>
                          <TableCell>
                            R$ {report.totalCommission.toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-green-600">
                            R$ {report.paidCommission.toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-amber-600">
                            R${" "}
                            {report.pendingCommission.toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                report.pendingCommission === 0
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {report.pendingCommission === 0
                                ? "Completo"
                                : "Pendente"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === "withdrawals" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                  Solicitações de Retirada
                </h1>
                <p className="text-muted-foreground">
                  Gerencie os pedidos de saque dos representantes.
                </p>
              </div>

              {/* Withdrawal Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Solicitações Pendentes
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {
                        withdrawalRequests.filter((r) => r.status === "pending")
                          .length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aguardando aprovação
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Valor Pendente
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R${" "}
                      {withdrawalRequests
                        .filter((r) => r.status === "pending")
                        .reduce((sum, r) => sum + r.amount, 0)
                        .toLocaleString("pt-BR")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total a ser processado
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aprovadas Hoje
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {
                        withdrawalRequests.filter(
                          (r) => r.status === "approved",
                        ).length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Processadas com sucesso
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Taxa de Aprovação
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">85%</div>
                    <p className="text-xs text-muted-foreground">
                      Últimos 30 dias
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Lista de Solicitações</CardTitle>
                  <CardDescription>
                    Gerencie as solicitações de retirada dos representantes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {withdrawalRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">
                              {request.representativeName}
                            </h4>
                            <Badge
                              variant={
                                request.status === "pending"
                                  ? "outline"
                                  : request.status === "approved"
                                    ? "default"
                                    : "destructive"
                              }
                            >
                              {request.status === "pending"
                                ? "Pendente"
                                : request.status === "approved"
                                  ? "Aprovado"
                                  : "Rejeitado"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                Valor Solicitado
                              </p>
                              <p className="font-medium">
                                R$ {request.amount.toLocaleString("pt-BR")}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Saldo Disponível
                              </p>
                              <p className="font-medium">
                                R${" "}
                                {request.availableBalance.toLocaleString(
                                  "pt-BR",
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Data da Solicitação
                              </p>
                              <p className="font-medium">
                                {new Date(
                                  request.requestDate,
                                ).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                ID da Solicitação
                              </p>
                              <p className="font-medium">{request.id}</p>
                            </div>
                          </div>
                        </div>
                        {request.status === "pending" && (
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleWithdrawalAction(request.id, "approve")
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleWithdrawalAction(request.id, "reject")
                              }
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === "invoices" && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Gestão de Faturas
                  </h1>
                  <p className="text-muted-foreground">
                    Gerencie faturas, contratos e antecipações de pagamento.
                  </p>
                </div>
              </div>

              {/* Invoice Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Faturas Pendentes
                    </CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {
                        invoices.filter((inv) => inv.status === "pending")
                          .length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      R${" "}
                      {invoices
                        .filter((inv) => inv.status === "pending")
                        .reduce((sum, inv) => sum + inv.amount, 0)
                        .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Faturas Pagas
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {invoices.filter((inv) => inv.status === "paid").length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      R${" "}
                      {invoices
                        .filter((inv) => inv.status === "paid")
                        .reduce((sum, inv) => sum + inv.amount, 0)
                        .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Contratos Ativos
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {contracts.filter((c) => c.status === "Ativo").length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      R${" "}
                      {contracts
                        .filter((c) => c.status === "Ativo")
                        .reduce((sum, c) => sum + c.remainingValue, 0)
                        .toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                      restantes
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Antecipações
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {
                        invoices.filter((inv) => inv.installmentNumber === 0)
                          .length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      R${" "}
                      {invoices
                        .filter((inv) => inv.installmentNumber === 0)
                        .reduce((sum, inv) => sum + inv.amount, 0)
                        .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Contracts Management */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Contratos Ativos</CardTitle>
                      <CardDescription>
                        Gerencie contratos e gere faturas
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contracts.map((contract) => (
                        <div
                          key={contract.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{contract.client}</h4>
                              <Badge
                                variant={
                                  contract.status === "Ativo"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {contract.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Contrato: {contract.id} | Rep:{" "}
                              {contract.representative}
                            </p>
                            <p className="text-sm">
                              Valor restante:{" "}
                              <span className="font-medium">
                                R${" "}
                                {contract.remainingValue.toLocaleString(
                                  "pt-BR",
                                  { minimumFractionDigits: 2 },
                                )}
                              </span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Parcelas: {contract.paidInstallments}/
                              {contract.installments}
                            </p>
                            <Progress
                              value={
                                (contract.paidInstallments /
                                  contract.installments) *
                                100
                              }
                              className="mt-2"
                            />
                          </div>
                          <div className="ml-4 space-y-2">
                            <Button
                              size="sm"
                              onClick={() => generateInvoice(contract)}
                              disabled={
                                contract.paidInstallments >=
                                contract.installments
                              }
                            >
                              <Receipt className="mr-1 h-3 w-3" />
                              Gerar Fatura
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedContract(contract);
                                setIsEarlyPaymentDialogOpen(true);
                              }}
                              disabled={contract.remainingValue <= 0}
                            >
                              <DollarSign className="mr-1 h-3 w-3" />
                              Antecipar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Invoices List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Faturas Recentes</CardTitle>
                    <CardDescription>
                      Últimas faturas geradas no sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {invoices.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhuma fatura gerada ainda
                        </p>
                      ) : (
                        invoices
                          .slice(-10)
                          .reverse()
                          .map((invoice) => {
                            const contract = contracts.find(
                              (c) => c.id === invoice.contractId,
                            );
                            return (
                              <div
                                key={invoice.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h5 className="font-medium text-sm">
                                      {invoice.id}
                                    </h5>
                                    <Badge
                                      variant={
                                        invoice.status === "paid"
                                          ? "default"
                                          : invoice.status === "overdue"
                                            ? "destructive"
                                            : "outline"
                                      }
                                    >
                                      {invoice.status === "paid"
                                        ? "Paga"
                                        : invoice.status === "overdue"
                                          ? "Vencida"
                                          : "Pendente"}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Cliente: {contract?.client || "N/A"}
                                  </p>
                                  <p className="text-sm font-medium">
                                    R${" "}
                                    {invoice.amount.toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {invoice.installmentNumber === 0
                                      ? "Antecipação"
                                      : `Parcela ${invoice.installmentNumber}`}{" "}
                                    | Venc:{" "}
                                    {new Date(
                                      invoice.dueDate,
                                    ).toLocaleDateString("pt-BR")}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Early Payment Dialog */}
              <Dialog
                open={isEarlyPaymentDialogOpen}
                onOpenChange={setIsEarlyPaymentDialogOpen}
              >
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Antecipação de Pagamento</DialogTitle>
                    <DialogDescription>
                      Processe uma antecipação de pagamento para o contrato
                      selecionado.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedContract && (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium">
                          {selectedContract.client}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Contrato: {selectedContract.id}
                        </p>
                        <p className="text-sm">
                          Valor restante:{" "}
                          <span className="font-medium">
                            R${" "}
                            {selectedContract.remainingValue.toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
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
                            ).map((num) => {
                              const installmentValue =
                                selectedContract.remainingValue /
                                (selectedContract.installments -
                                  selectedContract.paidInstallments);
                              const totalAmount = installmentValue * num;
                              return (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}parcela{num > 1 ? "s" : ""}- R${" "}
                                  {totalAmount.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      {earlyPaymentInstallments && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-medium text-green-800">
                            Valor total da antecipação:
                          </p>
                          <p className="text-lg font-bold text-green-900">
                            R${" "}
                            {(
                              (selectedContract.remainingValue /
                                (selectedContract.installments -
                                  selectedContract.paidInstallments)) *
                              parseInt(earlyPaymentInstallments)
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-xs text-green-700">
                            {earlyPaymentInstallments} parcela
                            {parseInt(earlyPaymentInstallments) > 1
                              ? "s"
                              : ""}{" "}
                            de R${" "}
                            {(
                              selectedContract.remainingValue /
                              (selectedContract.installments -
                                selectedContract.paidInstallments)
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            cada
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEarlyPaymentDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleEarlyPayment}>
                      Processar Antecipação
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
