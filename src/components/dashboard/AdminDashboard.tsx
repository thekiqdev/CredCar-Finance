import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  representativeService,
  Representative,
  CreateRepresentativeData,
  contractService,
  supabase,
} from "../../lib/supabase";
import { Database } from "../../types/supabase";
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
  ArrowLeft,
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
  Group,
  Hash,
  UserCheck,
  UserX,
  Calculator,
} from "lucide-react";
import ContractCreationFlow from "@/components/sales/ContractCreationFlow";
import ContractTemplateManagement from "@/components/sales/ContractTemplateManagement";
import ContractDetails from "@/components/sales/ContractDetails";

interface AdminDashboardProps {
  userName?: string;
  notifications?: number;
  onLogout?: () => void;
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
  onLogout = () => {},
}) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeConfigTab, setActiveConfigTab] = useState("commission-tables");
  const [showContractFlow, setShowContractFlow] = useState(false);
  const [contractFlowStep, setContractFlowStep] = useState<string>("");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null,
  );
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  // Groups and Quotas state
  const [groups, setGroups] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isNewGroupDialogOpen, setIsNewGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [isManageQuotasDialogOpen, setIsManageQuotasDialogOpen] =
    useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    totalQuotas: 10,
  });
  const [selectedQuota, setSelectedQuota] = useState(null);
  const [isAssignQuotaDialogOpen, setIsAssignQuotaDialogOpen] = useState(false);
  const [isNewRepDialogOpen, setIsNewRepDialogOpen] = useState(false);
  const [isEditRepDialogOpen, setIsEditRepDialogOpen] = useState(false);
  const [isDeleteRepDialogOpen, setIsDeleteRepDialogOpen] = useState(false);
  const [editingRepresentative, setEditingRepresentative] =
    useState<Representative | null>(null);
  const [deletingRepresentative, setDeletingRepresentative] =
    useState<Representative | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [newRepresentative, setNewRepresentative] =
    useState<CreateRepresentativeData>({
      name: "",
      email: "",
      phone: "",
      cnpj: "",
      razao_social: "",
      ponto_venda: "",
      password: "",
      status: "Ativo",
      commission_table: "A",
    });

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
  const [isRepresentativeModalOpen, setIsRepresentativeModalOpen] =
    useState(false);
  const [selectedRepresentativeForModal, setSelectedRepresentativeForModal] =
    useState<Representative | null>(null);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [selectedPendingRep, setSelectedPendingRep] = useState<any>(null);
  const [representativeDocuments, setRepresentativeDocuments] = useState<{
    [key: string]: any[];
  }>({});
  const [isDocumentRejectionDialogOpen, setIsDocumentRejectionDialogOpen] =
    useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentRejectionReason, setDocumentRejectionReason] = useState("");
  const [internalUsers, setInternalUsers] = useState([
    {
      id: 1,
      name: "Admin Principal",
      email: "admin@credicar.com",
      role: "Administrador",
      status: "Ativo",
      createdAt: "2023-01-15",
    },
    {
      id: 2,
      name: "Suporte Técnico",
      email: "suporte@credicar.com",
      role: "Suporte",
      status: "Ativo",
      createdAt: "2023-03-20",
    },
  ]);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [newInternalUser, setNewInternalUser] = useState({
    name: "",
    email: "",
    role: "Suporte",
    password: "",
  });

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

  // Representatives state
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [isLoadingRepresentatives, setIsLoadingRepresentatives] =
    useState(true);
  const [isLoadingPendingRegistrations, setIsLoadingPendingRegistrations] =
    useState(true);

  // Contracts state
  const [allContracts, setAllContracts] = useState([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [contractsFilter, setContractsFilter] = useState("all");
  const [contractsSearch, setContractsSearch] = useState("");

  // Load representatives and pending registrations on component mount
  useEffect(() => {
    loadRepresentatives();
    loadPendingRegistrations();
    loadDocuments();
    loadAllContracts();
    loadGroups();
  }, []);

  const loadRepresentatives = async () => {
    try {
      setIsLoadingRepresentatives(true);
      const data = await representativeService.getAll();
      setRepresentatives(
        data.filter((rep) => rep.status !== "Pendente de Aprovação"),
      );
    } catch (error) {
      console.error("Error loading representatives:", error);
    } finally {
      setIsLoadingRepresentatives(false);
    }
  };

  const loadPendingRegistrations = async () => {
    try {
      setIsLoadingPendingRegistrations(true);
      const data = await representativeService.getPendingRegistrations();
      setPendingRegistrations(data);
    } catch (error) {
      console.error("Error loading pending registrations:", error);
    } finally {
      setIsLoadingPendingRegistrations(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading documents:", error);
        return;
      }

      // Group documents by representative_id
      const groupedDocs = (data || []).reduce(
        (acc, doc) => {
          if (doc.representative_id) {
            if (!acc[doc.representative_id]) {
              acc[doc.representative_id] = [];
            }
            acc[doc.representative_id].push(doc);
          }
          return acc;
        },
        {} as { [key: string]: any[] },
      );

      setRepresentativeDocuments(groupedDocs);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  const loadAllContracts = async () => {
    try {
      setIsLoadingContracts(true);
      const data = await contractService.getAll();
      setAllContracts(data);
    } catch (error) {
      console.error("Error loading contracts:", error);
    } finally {
      setIsLoadingContracts(false);
    }
  };

  const loadGroups = async () => {
    try {
      setIsLoadingGroups(true);
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (groupsError) {
        console.error("Error loading groups:", groupsError);
        return;
      }

      const { data: quotasData, error: quotasError } = await supabase
        .from("quotas")
        .select(
          `
          *,
          profiles:representative_id(full_name)
        `,
        )
        .order("quota_number", { ascending: true });

      if (quotasError) {
        console.error("Error loading quotas:", quotasError);
        return;
      }

      setGroups(groupsData || []);
      setQuotas(quotasData || []);
    } catch (error) {
      console.error("Error loading groups and quotas:", error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleApproveRepresentative = async (representative: any) => {
    try {
      await representativeService.update(representative.id, {
        status: "Ativo",
      });

      // Refresh both lists
      await loadRepresentatives();
      await loadPendingRegistrations();

      console.log("Representative approved:", representative.name);
      alert("Representante aprovado com sucesso!");
    } catch (error) {
      console.error("Error approving representative:", error);
      alert("Erro ao aprovar representante. Tente novamente.");
    }
  };

  const handleRejectRepresentative = async () => {
    if (!selectedPendingRep || !rejectionReason.trim()) {
      alert("Por favor, informe o motivo da reprovação.");
      return;
    }

    try {
      // Update status to "Reprovado" and save rejection reason
      await representativeService.update(selectedPendingRep.id, {
        status: "Cancelado", // Using "Cancelado" as closest to "Reprovado"
      });

      // In a real implementation, you would also save the rejection reason
      // This could be done by adding a rejection_reason field to the profiles table
      // or creating a separate rejections table

      console.log(
        "Representative rejected:",
        selectedPendingRep.name,
        "Reason:",
        rejectionReason,
      );

      // Refresh both lists
      await loadRepresentatives();
      await loadPendingRegistrations();

      setIsRejectionDialogOpen(false);
      setRejectionReason("");
      setSelectedPendingRep(null);

      alert("Representante reprovado com sucesso!");
    } catch (error) {
      console.error("Error rejecting representative:", error);
      alert("Erro ao reprovar representante. Tente novamente.");
    }
  };

  const handleApproveDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({
          status: "Aprovado",
          reviewed_at: new Date().toISOString(),
          reviewed_by: "admin", // In a real app, this would be the current admin user ID
        })
        .eq("id", documentId);

      if (error) {
        console.error("Error approving document:", error);
        alert("Erro ao aprovar documento. Tente novamente.");
        return;
      }

      // Refresh documents
      await loadDocuments();
      console.log("Document approved:", documentId);
    } catch (error) {
      console.error("Error approving document:", error);
      alert("Erro ao aprovar documento. Tente novamente.");
    }
  };

  const handleRejectDocument = async () => {
    if (!selectedDocument || !documentRejectionReason.trim()) {
      alert("Por favor, informe o motivo da rejeição.");
      return;
    }

    try {
      const { error } = await supabase
        .from("documents")
        .update({
          status: "Reprovado",
          rejection_reason: documentRejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: "admin", // In a real app, this would be the current admin user ID
        })
        .eq("id", selectedDocument.id);

      if (error) {
        console.error("Error rejecting document:", error);
        alert("Erro ao reprovar documento. Tente novamente.");
        return;
      }

      // Refresh documents
      await loadDocuments();

      setIsDocumentRejectionDialogOpen(false);
      setDocumentRejectionReason("");
      setSelectedDocument(null);

      console.log(
        "Document rejected:",
        selectedDocument.id,
        "Reason:",
        documentRejectionReason,
      );
    } catch (error) {
      console.error("Error rejecting document:", error);
      alert("Erro ao reprovar documento. Tente novamente.");
    }
  };

  const handleContractFlowComplete = () => {
    setShowContractFlow(false);
    setContractFlowStep("");
    setActiveSection("contracts");
    // Refresh dashboard data after contract creation
    loadAllContracts();
  };

  const handleContractFlowBack = () => {
    setShowContractFlow(false);
    setContractFlowStep("");
    setActiveSection("contracts");
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
    // Refresh contracts data when modal closes
    loadAllContracts();
  };

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

  const handleCreateRepresentative = async () => {
    try {
      console.log("Creating representative with data:", newRepresentative);

      // Validate required fields
      if (!newRepresentative.name || !newRepresentative.email) {
        alert("Nome e email são obrigatórios");
        return;
      }

      const newRep = await representativeService.create(newRepresentative);
      console.log("Representative created successfully:", newRep);

      // Refresh the representatives list
      await loadRepresentatives();

      setIsNewRepDialogOpen(false);
      setNewRepresentative({
        name: "",
        email: "",
        phone: "",
        cnpj: "",
        razao_social: "",
        ponto_venda: "",
        password: "",
        status: "Ativo",
        commission_table: "A",
      });
      alert("Representante criado com sucesso!");
    } catch (error) {
      console.error("Error creating representative:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao criar representante: ${errorMessage}`);
    }
  };

  const handleEditRepresentative = (rep: Representative) => {
    setEditingRepresentative(rep);
    setIsEditRepDialogOpen(true);
  };

  const handleUpdateRepresentative = async () => {
    if (!editingRepresentative) return;

    try {
      await representativeService.update(
        editingRepresentative.id,
        editingRepresentative,
      );
      console.log("Representative updated:", editingRepresentative);

      // Refresh the representatives list
      await loadRepresentatives();

      setIsEditRepDialogOpen(false);
      setEditingRepresentative(null);
    } catch (error) {
      console.error("Error updating representative:", error);
      alert("Erro ao atualizar representante.");
    }
  };

  const handleDeleteRepresentative = (rep: Representative) => {
    setDeletingRepresentative(rep);
    setIsDeleteRepDialogOpen(true);
  };

  const confirmDeleteRepresentative = async () => {
    if (adminPassword === "admin123" && deletingRepresentative) {
      try {
        await representativeService.delete(deletingRepresentative.id);
        console.log("Representative deleted:", deletingRepresentative);

        // Refresh the representatives list
        await loadRepresentatives();

        setIsDeleteRepDialogOpen(false);
        setDeletingRepresentative(null);
        setAdminPassword("");
      } catch (error) {
        console.error("Error deleting representative:", error);
        alert("Erro ao excluir representante.");
      }
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
        <div className="grid gap-4 md:grid-cols-4">
          <Button
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            onClick={() => setActiveSection("representatives")}
          >
            <PlusCircle className="h-6 w-6" />
            <span>Novo Representante</span>
          </Button>
          <Button
            className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              setShowContractFlow(true);
              setActiveSection("contract-creation");
            }}
          >
            <Calculator className="h-6 w-6" />
            <span>Criar Contrato</span>
          </Button>
          <Button
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            variant="outline"
            onClick={() => setActiveSection("contracts")}
          >
            <FileText className="h-6 w-6" />
            <span>Contratos</span>
          </Button>
          <Button
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            variant="outline"
            onClick={() => setActiveSection("settings")}
          >
            <Settings className="h-6 w-6" />
            <span>Configurações</span>
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
                    repId: 1,
                    value: "R$ 45.000",
                    status: "Aprovado",
                  },
                  {
                    id: "PV-2023-002",
                    client: "Maria Santos",
                    rep: "Ana Pereira",
                    repId: 2,
                    value: "R$ 38.500",
                    status: "Pendente",
                  },
                  {
                    id: "PV-2023-003",
                    client: "Pedro Costa",
                    rep: "Carlos Oliveira",
                    repId: 1,
                    value: "R$ 52.000",
                    status: "Aprovado",
                  },
                  {
                    id: "PV-2023-004",
                    client: "Lucia Ferreira",
                    rep: "Marcos Souza",
                    repId: 3,
                    value: "R$ 41.200",
                    status: "Em análise",
                  },
                  {
                    id: "PV-2023-005",
                    client: "Roberto Alves",
                    rep: "Ana Pereira",
                    repId: 2,
                    value: "R$ 36.800",
                    status: "Pendente",
                  },
                ].map((contract) => {
                  const representative = representatives.find(
                    (r) => r.id === contract.repId,
                  );
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.id}
                      </TableCell>
                      <TableCell>{contract.client}</TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            setSelectedRepresentativeForModal(representative);
                            setIsRepresentativeModalOpen(true);
                          }}
                        >
                          {contract.rep}
                        </Button>
                      </TableCell>
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
                  );
                })}
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

  // Error boundary check
  if (!navigate) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Erro de Configuração
          </h2>
          <p className="text-gray-600">
            O componente precisa estar dentro de um Router context.
          </p>
        </div>
      </div>
    );
  }

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
              variant={
                activeSection === "contract-templates" ? "default" : "ghost"
              }
              className="w-full justify-start"
              onClick={() => setActiveSection("contract-templates")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Modelos de Contrato
            </Button>
            <Button
              variant={activeSection === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
            <Button
              variant={activeSection === "collaborators" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("collaborators")}
            >
              <Users className="mr-2 h-4 w-4" />
              Colaboradores
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  Sair
                </Button>
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

          {activeSection === "contract-creation" && showContractFlow && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Criar Novo Contrato
                  </h1>
                  <p className="text-muted-foreground">
                    Siga os passos para criar um novo contrato no sistema.
                  </p>
                </div>
                <Button
                  onClick={handleContractFlowBack}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para Contratos
                </Button>
              </div>
              <div className="bg-white rounded-lg border">
                <ContractCreationFlow
                  onComplete={handleContractFlowComplete}
                  isAdminMode={true}
                />
              </div>
            </div>
          )}

          {activeSection === "representatives" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Representantes
                  </h1>
                  <p className="text-muted-foreground">
                    Gerencie os representantes de vendas do sistema.
                  </p>
                </div>
                <Dialog
                  open={isNewRepDialogOpen}
                  onOpenChange={setIsNewRepDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Novo Representante
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Representante</DialogTitle>
                      <DialogDescription>
                        Preencha os dados do novo representante de vendas.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nome Completo *</Label>
                          <Input
                            id="name"
                            value={newRepresentative.name}
                            onChange={(e) =>
                              setNewRepresentative({
                                ...newRepresentative,
                                name: e.target.value,
                              })
                            }
                            placeholder="Nome completo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
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
                            placeholder="email@exemplo.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={newRepresentative.phone}
                            onChange={(e) =>
                              setNewRepresentative({
                                ...newRepresentative,
                                phone: e.target.value,
                              })
                            }
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cnpj">CNPJ</Label>
                          <Input
                            id="cnpj"
                            value={formatCpfCnpj(newRepresentative.cnpj || "")}
                            onChange={(e) =>
                              setNewRepresentative({
                                ...newRepresentative,
                                cnpj: e.target.value,
                              })
                            }
                            placeholder="00.000.000/0000-00"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="razao_social">Razão Social</Label>
                          <Input
                            id="razao_social"
                            value={newRepresentative.razao_social}
                            onChange={(e) =>
                              setNewRepresentative({
                                ...newRepresentative,
                                razao_social: e.target.value,
                              })
                            }
                            placeholder="Nome da empresa"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ponto_venda">Ponto de Venda</Label>
                          <Input
                            id="ponto_venda"
                            value={newRepresentative.ponto_venda}
                            onChange={(e) =>
                              setNewRepresentative({
                                ...newRepresentative,
                                ponto_venda: e.target.value,
                              })
                            }
                            placeholder="Local de vendas"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="password">Senha</Label>
                          <div className="flex gap-2">
                            <Input
                              id="password"
                              type="password"
                              value={newRepresentative.password}
                              onChange={(e) =>
                                setNewRepresentative({
                                  ...newRepresentative,
                                  password: e.target.value,
                                })
                              }
                              placeholder="Senha do usuário"
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
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={newRepresentative.status}
                            onValueChange={(value) =>
                              setNewRepresentative({
                                ...newRepresentative,
                                status: value as any,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ativo">Ativo</SelectItem>
                              <SelectItem value="Inativo">Inativo</SelectItem>
                              <SelectItem value="Pendente de Aprovação">
                                Pendente de Aprovação
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsNewRepDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateRepresentative}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Criar Representante
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Representatives Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Representantes</CardTitle>
                  <CardDescription>
                    {representatives.length} representantes cadastrados no
                    sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingRepresentatives ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedRepresentatives.map((rep) => (
                            <TableRow key={rep.id}>
                              <TableCell className="font-medium">
                                {rep.name}
                              </TableCell>
                              <TableCell>{rep.email}</TableCell>
                              <TableCell>{rep.phone || "-"}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    rep.status === "Ativo"
                                      ? "default"
                                      : rep.status === "Inativo"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {rep.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {rep.commission_code || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleEditRepresentative(rep)
                                    }
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRepresentativeForModal(rep);
                                      setIsRepresentativeModalOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteRepresentative(rep)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-muted-foreground">
                            Mostrando {startIndex + 1} a{" "}
                            {Math.min(endIndex, representatives.length)} de{" "}
                            {representatives.length} representantes
                          </p>
                          <Select
                            value={itemsPerPage.toString()}
                            onValueChange={handleItemsPerPageChange}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <span className="text-sm">
                            Página {currentPage} de {totalPages}
                          </span>
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
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "contracts" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Contratos
                  </h1>
                  <p className="text-muted-foreground">
                    Gerencie todos os contratos do sistema.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowContractFlow(true);
                    setActiveSection("contract-creation");
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Contrato
                </Button>
              </div>

              {/* Contracts Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Contratos</CardTitle>
                  <CardDescription>
                    {allContracts.length} contratos registrados no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingContracts ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                  ) : allContracts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        Nenhum contrato encontrado
                      </p>
                      <p className="text-muted-foreground mb-4">
                        Comece criando seu primeiro contrato.
                      </p>
                      <Button
                        onClick={() => {
                          setShowContractFlow(true);
                          setActiveSection("contract-creation");
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Primeiro Contrato
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Representante</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allContracts.slice(0, 10).map((contract: any) => (
                          <TableRow key={contract.id}>
                            <TableCell className="font-medium">
                              {contract.contract_number ||
                                contract.contract_code ||
                                `CONT-${contract.id}`}
                            </TableCell>
                            <TableCell>
                              {contract.clients?.name ||
                                contract.clients?.full_name ||
                                "Cliente não encontrado"}
                            </TableCell>
                            <TableCell>
                              {contract.profiles?.full_name ||
                                "Representante não encontrado"}
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(
                                contract.credit_amount ||
                                  contract.total_value ||
                                  0,
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  contract.status === "Aprovado" ||
                                  contract.status === "Ativo"
                                    ? "default"
                                    : contract.status === "Pendente"
                                      ? "outline"
                                      : contract.status === "Reprovado"
                                        ? "destructive"
                                        : "secondary"
                                }
                              >
                                {contract.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(contract.created_at).toLocaleDateString(
                                "pt-BR",
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleViewContract(contract.id.toString())
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleEditContract(contract.id.toString())
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "contract-templates" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Modelos de Contrato
                  </h1>
                  <p className="text-muted-foreground">
                    Gerencie os modelos de contrato do sistema.
                  </p>
                </div>
              </div>
              <ContractTemplateManagement
                currentUserId="admin"
                isAdmin={true}
              />
            </div>
          )}

          {/* Add other sections here as needed */}
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

export default AdminDashboard;
