import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  representativeService,
  Representative,
  CreateRepresentativeData,
  contractService,
  clientService,
  supabase,
  authService,
  commissionPlansService,
  administratorService,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  Key,
} from "lucide-react";
import ContractCreationFlow from "@/components/sales/ContractCreationFlow";
import ContractTemplateManagement from "@/components/sales/ContractTemplateManagement";
import ContractDetails from "@/components/sales/ContractDetails";

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
  const form = useForm();
  const [activeSection, setActiveSection] = useState("dashboard");

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getCurrentUser();
      if (
        !currentUser ||
        (currentUser.role !== "Administrador" &&
          currentUser.email !== "admin@credicar.com")
      ) {
        console.log(
          "User not authenticated or not admin, redirecting to login",
        );
        navigate("/");
        return;
      }
    };

    checkAuth();
  }, [navigate]);
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
  const [isPasswordChangeDialogOpen, setIsPasswordChangeDialogOpen] =
    useState(false);
  const [editingRepresentative, setEditingRepresentative] =
    useState<Representative | null>(null);
  const [deletingRepresentative, setDeletingRepresentative] =
    useState<Representative | null>(null);
  const [representativeForPasswordChange, setRepresentativeForPasswordChange] =
    useState<Representative | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isContractTransferDialogOpen, setIsContractTransferDialogOpen] =
    useState(false);
  const [representativeContracts, setRepresentativeContracts] = useState([]);
  const [transferOption, setTransferOption] = useState<
    "admin" | "representative" | ""
  >("");
  const [selectedTransferRepresentative, setSelectedTransferRepresentative] =
    useState<string>("");
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
  const [selectedContractForInvoices, setSelectedContractForInvoices] =
    useState<Contract | null>(null);
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
  // Commission Plans State
  const [commissionPlans, setCommissionPlans] = useState([]);
  const [creditRanges, setCreditRanges] = useState([]);
  const [installmentConditions, setInstallmentConditions] = useState([]);
  const [anticipationConditions, setAnticipationConditions] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isNewPlanDialogOpen, setIsNewPlanDialogOpen] = useState(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [isManagePlanDialogOpen, setIsManagePlanDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    nome: "",
    descricao: "",
    ativo: true,
  });
  const [editingPlan, setEditingPlan] = useState(null);

  // Credit Range Management State
  const [isNewCreditRangeDialogOpen, setIsNewCreditRangeDialogOpen] =
    useState(false);
  const [isEditCreditRangeDialogOpen, setIsEditCreditRangeDialogOpen] =
    useState(false);
  const [selectedCreditRange, setSelectedCreditRange] = useState(null);
  const [newCreditRange, setNewCreditRange] = useState({
    valor_credito: "",
    valor_primeira_parcela: "",
    valor_parcelas_restantes: "",
    numero_total_parcelas: "80",
  });

  // Installment Conditions Management State
  const [isManageInstallmentsDialogOpen, setIsManageInstallmentsDialogOpen] =
    useState(false);
  const [isNewInstallmentDialogOpen, setIsNewInstallmentDialogOpen] =
    useState(false);
  const [selectedRangeForInstallments, setSelectedRangeForInstallments] =
    useState(null);
  const [newInstallment, setNewInstallment] = useState({
    numero_parcela: "",
    valor_parcela: "",
  });

  // Anticipation Conditions Management State
  const [isManageAnticipationsDialogOpen, setIsManageAnticipationsDialogOpen] =
    useState(false);
  const [isNewAnticipationDialogOpen, setIsNewAnticipationDialogOpen] =
    useState(false);
  const [selectedRangeForAnticipations, setSelectedRangeForAnticipations] =
    useState(null);
  const [newAnticipation, setNewAnticipation] = useState({
    percentual: "",
    valor_calculado: "",
  });

  // Legacy commission tables for backward compatibility
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
  const [internalUsers, setInternalUsers] = useState([]);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [newInternalUser, setNewInternalUser] = useState({
    name: "",
    email: "",
    role: "Suporte",
    password: "",
  });

  // Collaborator management state
  const [isEditCollaboratorDialogOpen, setIsEditCollaboratorDialogOpen] =
    useState(false);
  const [isDeleteCollaboratorDialogOpen, setIsDeleteCollaboratorDialogOpen] =
    useState(false);
  const [
    isCollaboratorPasswordChangeDialogOpen,
    setIsCollaboratorPasswordChangeDialogOpen,
  ] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState(null);
  const [deletingCollaborator, setDeletingCollaborator] = useState(null);
  const [collaboratorForPasswordChange, setCollaboratorForPasswordChange] =
    useState(null);
  const [newCollaboratorPassword, setNewCollaboratorPassword] = useState("");
  const [collaboratorAdminPassword, setCollaboratorAdminPassword] =
    useState("");

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

  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    systemName: "CredCar",
    companyName: "CredCar Soluções Financeiras",
    companyAddress: "Rua das Empresas, 123 - Centro - São Paulo/SP",
    companyPhone: "(11) 3000-0000",
    companyEmail: "contato@credcar.com.br",
    companyCNPJ: "12.345.678/0001-90",
    logoUrl: "",
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
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] =
    useState(false);
  const [selectedContractForStatusChange, setSelectedContractForStatusChange] =
    useState<any>(null);
  const [newContractStatus, setNewContractStatus] = useState<string>("");

  // Clients state
  const [allClients, setAllClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingInternalUsers, setIsLoadingInternalUsers] = useState(true);
  const [clientsFilter, setClientsFilter] = useState("all");
  const [clientsSearch, setClientsSearch] = useState("");

  // Global search state
  const [globalSearch, setGlobalSearch] = useState("");
  const [representativesSearch, setRepresentativesSearch] = useState("");

  // Dashboard statistics state
  const [dashboardStats, setDashboardStats] = useState({
    totalSales: 0,
    activeContracts: 0,
    totalRepresentatives: 0,
    pendingCommissions: 0,
    salesGrowth: 0,
    contractsGrowth: 0,
    representativesGrowth: 0,
    commissionsGrowth: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load representatives and pending registrations on component mount
  useEffect(() => {
    const loadData = async () => {
      console.log("AdminDashboard: Starting data load...");
      try {
        await Promise.all([
          loadRepresentatives(),
          loadPendingRegistrations(),
          loadDocuments(),
          loadAllContracts(),
          loadGroups(),
          loadAllClients(),
          loadDashboardStats(),
          loadCommissionPlans(),
          loadInternalUsers(),
        ]);
        console.log("AdminDashboard: All data loaded successfully");
      } catch (error) {
        console.error("AdminDashboard: Error loading data:", error);
      }
    };

    loadData();
  }, []);

  const loadRepresentatives = async () => {
    try {
      console.log("Loading representatives...");
      setIsLoadingRepresentatives(true);
      const data = await representativeService.getAll();
      console.log("Raw representatives data:", data);

      const filteredReps = data.filter(
        (rep) => rep.status !== "Pendente de Aprovação",
      );
      console.log(
        "Filtered representatives (excluding pending):",
        filteredReps,
      );

      setRepresentatives(filteredReps);
    } catch (error) {
      console.error("Error loading representatives:", error);
    } finally {
      setIsLoadingRepresentatives(false);
    }
  };

  const loadPendingRegistrations = async () => {
    try {
      console.log("Loading pending registrations...");
      setIsLoadingPendingRegistrations(true);
      const data = await representativeService.getPendingRegistrations();
      console.log("Pending registrations data:", data);
      setPendingRegistrations(data);
    } catch (error) {
      console.error("Error loading pending registrations:", error);
    } finally {
      setIsLoadingPendingRegistrations(false);
    }
  };

  const loadDocuments = async () => {
    try {
      // Load from both documents table (legacy) and representative_documents table (new)
      const [documentsResult, repDocumentsResult] = await Promise.all([
        supabase
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("representative_documents")
          .select("*")
          .order("uploaded_at", { ascending: false }),
      ]);

      const legacyDocs = documentsResult.data || [];
      const newDocs = repDocumentsResult.data || [];

      if (documentsResult.error) {
        console.error("Error loading legacy documents:", documentsResult.error);
      }
      if (repDocumentsResult.error) {
        console.error(
          "Error loading representative documents:",
          repDocumentsResult.error,
        );
      }

      // Group documents by representative_id
      const groupedDocs = {} as { [key: string]: any[] };

      // Add legacy documents
      legacyDocs.forEach((doc) => {
        if (doc.representative_id) {
          if (!groupedDocs[doc.representative_id]) {
            groupedDocs[doc.representative_id] = [];
          }
          groupedDocs[doc.representative_id].push({
            ...doc,
            document_type: doc.name,
            file_url: doc.file_url,
            uploaded_at: doc.created_at,
            isLegacy: true,
          });
        }
      });

      // Add new representative documents
      newDocs.forEach((doc) => {
        if (doc.representative_id) {
          if (!groupedDocs[doc.representative_id]) {
            groupedDocs[doc.representative_id] = [];
          }
          groupedDocs[doc.representative_id].push({
            ...doc,
            isLegacy: false,
          });
        }
      });

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

  const loadAllClients = async () => {
    try {
      setIsLoadingClients(true);
      const data = await clientService.getAllWithRepresentative();
      setAllClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const loadInternalUsers = async () => {
    try {
      setIsLoadingInternalUsers(true);
      console.log("Loading internal users from administrators table...");

      const { data, error } = await supabase
        .from("administrators")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading administrators:", error);
        return;
      }

      const formattedUsers = (data || []).map((user) => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.created_at
          ? new Date(user.created_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      }));

      console.log("Administrators loaded:", formattedUsers);
      console.log("Total administrators found:", formattedUsers.length);

      // Force a state update by creating a new array
      setInternalUsers([...formattedUsers]);
    } catch (error) {
      console.error("Error in loadInternalUsers:", error);
    } finally {
      setIsLoadingInternalUsers(false);
    }
  };

  const loadCommissionPlans = async () => {
    try {
      setIsLoadingPlans(true);
      console.log("Loading commission plans...");

      // Load plans
      const { data: plansData, error: plansError } = await supabase
        .from("planos")
        .select("*")
        .order("data_criacao", { ascending: false });

      if (plansError) {
        console.error("Error loading plans:", plansError);
        throw plansError;
      }

      // Load credit ranges
      const { data: rangesData, error: rangesError } = await supabase
        .from("faixas_de_credito")
        .select("*")
        .order("valor_credito", { ascending: true });

      if (rangesError) {
        console.error("Error loading credit ranges:", rangesError);
        throw rangesError;
      }

      // Note: condicoes_parcelas table was removed in the latest migration
      // Installments are now generated automatically based on total number
      const installmentsData = [];

      // Load anticipation conditions
      const { data: anticipationData, error: anticipationError } =
        await supabase
          .from("condicoes_antecipacao")
          .select("*")
          .order("percentual", { ascending: true });

      if (anticipationError) {
        console.error(
          "Error loading anticipation conditions:",
          anticipationError,
        );
        throw anticipationError;
      }

      setCommissionPlans(plansData || []);
      setCreditRanges(rangesData || []);
      setInstallmentConditions(installmentsData || []);
      setAnticipationConditions(anticipationData || []);

      console.log("Commission plans loaded successfully:", {
        plans: plansData?.length || 0,
        ranges: rangesData?.length || 0,
        installments: 0, // No longer using individual installment conditions
        anticipation: anticipationData?.length || 0,
      });
    } catch (error) {
      console.error("Error loading commission plans:", error);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      setIsLoadingStats(true);
      console.log("Loading dashboard statistics...");

      // Get all contracts for calculations
      const { data: contractsData, error: contractsError } =
        await supabase.from("contracts").select(`
          id,
          total_value,
          credit_amount,
          status,
          created_at,
          commission_tables!inner (
            commission_percentage
          )
        `);

      if (contractsError) {
        console.error("Error fetching contracts for stats:", contractsError);
      }

      // Get all representatives for count
      const { data: repsData, error: repsError } = await supabase
        .from("profiles")
        .select("id, created_at")
        .eq("role", "Representante")
        .neq("status", "Pendente de Aprovação");

      if (repsError) {
        console.error("Error fetching representatives for stats:", repsError);
      }

      const contracts = contractsData || [];
      const reps = repsData || [];

      // Calculate total sales (sum of all contract values)
      const totalSales = contracts.reduce((sum, contract) => {
        const value = parseFloat(
          contract.total_value || contract.credit_amount || "0",
        );
        return sum + value;
      }, 0);

      // Count active contracts
      const activeContracts = contracts.filter(
        (c) => c.status === "Ativo" || c.status === "Aprovado",
      ).length;

      // Calculate pending commissions
      const pendingCommissions = contracts
        .filter((c) => c.status === "Ativo" || c.status === "Aprovado")
        .reduce((sum, contract) => {
          const value = parseFloat(
            contract.total_value || contract.credit_amount || "0",
          );
          const commissionRate =
            contract.commission_tables?.commission_percentage || 4;
          return sum + value * (commissionRate / 100);
        }, 0);

      // Calculate growth percentages (simplified - comparing with previous month)
      const currentMonth = new Date();
      const previousMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1,
      );
      const currentMonthStart = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );

      // Current month data
      const currentMonthContracts = contracts.filter(
        (c) => new Date(c.created_at) >= currentMonthStart,
      );
      const currentMonthSales = currentMonthContracts.reduce(
        (sum, contract) => {
          const value = parseFloat(
            contract.total_value || contract.credit_amount || "0",
          );
          return sum + value;
        },
        0,
      );

      // Previous month data
      const previousMonthContracts = contracts.filter((c) => {
        const date = new Date(c.created_at);
        return date >= previousMonth && date < currentMonthStart;
      });
      const previousMonthSales = previousMonthContracts.reduce(
        (sum, contract) => {
          const value = parseFloat(
            contract.total_value || contract.credit_amount || "0",
          );
          return sum + value;
        },
        0,
      );

      // Calculate growth percentages
      const salesGrowth =
        previousMonthSales > 0
          ? ((currentMonthSales - previousMonthSales) / previousMonthSales) *
            100
          : currentMonthSales > 0
            ? 100
            : 0;

      const contractsGrowth =
        previousMonthContracts.length > 0
          ? ((currentMonthContracts.length - previousMonthContracts.length) /
              previousMonthContracts.length) *
            100
          : currentMonthContracts.length > 0
            ? 100
            : 0;

      // Representatives growth
      const currentMonthReps = reps.filter(
        (r) => new Date(r.created_at) >= currentMonthStart,
      ).length;
      const previousMonthReps = reps.filter((r) => {
        const date = new Date(r.created_at);
        return date >= previousMonth && date < currentMonthStart;
      }).length;

      const representativesGrowth =
        previousMonthReps > 0
          ? ((currentMonthReps - previousMonthReps) / previousMonthReps) * 100
          : currentMonthReps > 0
            ? 100
            : 0;

      // Commissions growth (simplified)
      const commissionsGrowth = salesGrowth; // Assuming commission growth follows sales growth

      const stats = {
        totalSales: Math.round(totalSales),
        activeContracts,
        totalRepresentatives: reps.length,
        pendingCommissions: Math.round(pendingCommissions),
        salesGrowth: Math.round(salesGrowth * 10) / 10, // Round to 1 decimal
        contractsGrowth: Math.round(contractsGrowth * 10) / 10,
        representativesGrowth: Math.round(representativesGrowth * 10) / 10,
        commissionsGrowth: Math.round(commissionsGrowth * 10) / 10,
      };

      console.log("Dashboard stats calculated:", stats);
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      // Keep default values on error
    } finally {
      setIsLoadingStats(false);
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

  const handleApproveDocument = async (document: any) => {
    try {
      let error;

      if (document.isLegacy) {
        // Handle legacy documents table
        const result = await supabase
          .from("documents")
          .update({
            status: "Aprovado",
            reviewed_at: new Date().toISOString(),
            reviewed_by: "admin", // In a real app, this would be the current admin user ID
          })
          .eq("id", document.id);
        error = result.error;
      } else {
        // Handle new representative_documents table
        const result = await supabase
          .from("representative_documents")
          .update({
            status:
              "Aprovado" as Database["public"]["Enums"]["document_status"],
          })
          .eq("id", document.id);
        error = result.error;
      }

      if (error) {
        console.error("Error approving document:", error);
        alert("Erro ao aprovar documento. Tente novamente.");
        return;
      }

      // Check if all required documents are now approved for this representative
      await checkAndUpdateRepresentativeStatus(document.representative_id);

      // Refresh documents
      await loadDocuments();
      console.log("Document approved:", document.id);
      alert("Documento aprovado com sucesso!");
    } catch (error) {
      console.error("Error approving document:", error);
      alert("Erro ao aprovar documento. Tente novamente.");
    }
  };

  // Check if all required documents are approved and update representative status
  const checkAndUpdateRepresentativeStatus = async (
    representativeId: string,
  ) => {
    try {
      const documents = representativeDocuments[representativeId] || [];
      const requiredDocuments = [
        "Cartão do CNPJ",
        "Comprovante de Endereço",
        "Certidão de Antecedente Criminal",
        "Certidão Negativa Civil",
      ];

      // Check if all required documents are approved
      const approvedDocs = documents.filter(
        (doc) =>
          doc.status === "Aprovado" &&
          requiredDocuments.includes(doc.document_type),
      );

      if (approvedDocs.length === requiredDocuments.length) {
        // All documents approved, update representative status to "Ativo"
        const { error } = await supabase
          .from("profiles")
          .update({
            status: "Ativo" as Database["public"]["Enums"]["user_status"],
            documents_approved: true,
            documents_approved_at: new Date().toISOString(),
            documents_approved_by: "admin",
          })
          .eq("id", representativeId);

        if (error) {
          console.error("Error updating representative status:", error);
        } else {
          console.log(
            "Representative status updated to Ativo:",
            representativeId,
          );
          // Refresh representatives list
          await loadRepresentatives();
          await loadPendingRegistrations();
        }
      }
    } catch (error) {
      console.error("Error checking representative status:", error);
    }
  };

  const handleRejectDocument = async () => {
    if (!selectedDocument || !documentRejectionReason.trim()) {
      alert("Por favor, informe o motivo da rejeição.");
      return;
    }

    try {
      let error;

      if (selectedDocument.isLegacy) {
        // Handle legacy documents table
        const result = await supabase
          .from("documents")
          .update({
            status: "Reprovado",
            rejection_reason: documentRejectionReason,
            reviewed_at: new Date().toISOString(),
            reviewed_by: "admin", // In a real app, this would be the current admin user ID
          })
          .eq("id", selectedDocument.id);
        error = result.error;
      } else {
        // Handle new representative_documents table (doesn't have rejection_reason field)
        const result = await supabase
          .from("representative_documents")
          .update({
            status:
              "Reprovado" as Database["public"]["Enums"]["document_status"],
          })
          .eq("id", selectedDocument.id);
        error = result.error;
      }

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
      alert("Documento reprovado com sucesso!");
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

  const handleDeleteContract = async (contractId: string) => {
    const contract = allContracts.find((c) => c.id.toString() === contractId);
    if (!contract) {
      alert("Contrato não encontrado");
      return;
    }

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o contrato ${contract.contract_number || contract.contract_code || `CONT-${contract.id}`}?\n\nEsta ação irá:\n• Excluir o contrato permanentemente\n• Remover todos os documentos associados\n• Remover todas as assinaturas\n\nEsta ação não pode ser desfeita.`,
    );

    if (!confirmDelete) return;

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        alert("Usuário não autenticado");
        return;
      }

      await contractService.delete(contractId, currentUser.id, true); // true for isAdmin

      // Refresh contracts list
      await loadAllContracts();

      alert("Contrato excluído com sucesso!");
    } catch (error) {
      console.error("Error deleting contract:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao excluir contrato: ${errorMessage}`);
    }
  };

  const handleStatusChange = async (contract: any, newStatus: string) => {
    setSelectedContractForStatusChange(contract);
    setNewContractStatus(newStatus);
    setIsStatusChangeDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedContractForStatusChange || !newContractStatus) return;

    try {
      const { error } = await supabase
        .from("contracts")
        .update({
          status:
            newContractStatus as Database["public"]["Enums"]["contract_status"],
        })
        .eq("id", selectedContractForStatusChange.id);

      if (error) {
        console.error("Error updating contract status:", error);
        alert(`Erro ao alterar status: ${error.message}`);
        return;
      }

      // Refresh contracts list
      await loadAllContracts();

      setIsStatusChangeDialogOpen(false);
      setSelectedContractForStatusChange(null);
      setNewContractStatus("");

      alert(
        `Status do contrato alterado para ${newContractStatus} com sucesso!`,
      );
    } catch (error) {
      console.error("Error changing contract status:", error);
      alert("Erro ao alterar status do contrato");
    }
  };

  // Filter representatives based on search
  const filteredRepresentatives = representatives.filter((rep) => {
    const searchTerm = representativesSearch.toLowerCase();
    return (
      rep.name.toLowerCase().includes(searchTerm) ||
      rep.email.toLowerCase().includes(searchTerm) ||
      (rep.phone && rep.phone.toLowerCase().includes(searchTerm)) ||
      (rep.cnpj && rep.cnpj.toLowerCase().includes(searchTerm)) ||
      (rep.razao_social &&
        rep.razao_social.toLowerCase().includes(searchTerm)) ||
      (rep.ponto_venda && rep.ponto_venda.toLowerCase().includes(searchTerm)) ||
      (rep.commission_code &&
        rep.commission_code.toLowerCase().includes(searchTerm))
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredRepresentatives.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRepresentatives = filteredRepresentatives.slice(
    startIndex,
    endIndex,
  );

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
      alert("Representante atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating representative:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao atualizar representante: ${errorMessage}`);
    }
  };

  const handleChangePassword = (rep: Representative) => {
    setRepresentativeForPasswordChange(rep);
    setIsPasswordChangeDialogOpen(true);
  };

  const handlePasswordUpdate = async () => {
    if (!representativeForPasswordChange || !newPassword.trim()) {
      alert("Por favor, informe a nova senha.");
      return;
    }

    try {
      // In a real implementation, you would call a password update service
      // For now, we'll just simulate the password change
      console.log(
        "Changing password for representative:",
        representativeForPasswordChange.name,
        "New password:",
        newPassword,
      );

      // Here you would typically call an API to update the password
      // await representativeService.updatePassword(representativeForPasswordChange.id, newPassword);

      setIsPasswordChangeDialogOpen(false);
      setRepresentativeForPasswordChange(null);
      setNewPassword("");
      alert("Senha alterada com sucesso!");
    } catch (error) {
      console.error("Error updating password:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao alterar senha: ${errorMessage}`);
    }
  };

  const generatePasswordForEdit = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const generatePasswordForCollaborator = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCollaboratorPassword(password);
  };

  // Collaborator management functions
  const handleEditCollaborator = (collaborator) => {
    setEditingCollaborator(collaborator);
    setIsEditCollaboratorDialogOpen(true);
  };

  const handleUpdateCollaborator = async () => {
    if (!editingCollaborator) return;

    try {
      await administratorService.update(editingCollaborator.id, {
        full_name: editingCollaborator.name,
        email: editingCollaborator.email,
        role: editingCollaborator.role,
        status: editingCollaborator.status,
      });
      console.log("Collaborator updated:", editingCollaborator);

      // Refresh the collaborators list
      await loadInternalUsers();

      setIsEditCollaboratorDialogOpen(false);
      setEditingCollaborator(null);
      alert("Colaborador atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating collaborator:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao atualizar colaborador: ${errorMessage}`);
    }
  };

  const handleChangeCollaboratorPassword = (collaborator) => {
    setCollaboratorForPasswordChange(collaborator);
    setIsCollaboratorPasswordChangeDialogOpen(true);
  };

  const handleCollaboratorPasswordUpdate = async () => {
    if (!collaboratorForPasswordChange || !newCollaboratorPassword.trim()) {
      alert("Por favor, informe a nova senha.");
      return;
    }

    try {
      console.log(
        "Changing password for collaborator:",
        collaboratorForPasswordChange.name,
        "New password:",
        newCollaboratorPassword,
      );

      // Call the password update service
      await administratorService.updatePassword(
        collaboratorForPasswordChange.id,
        newCollaboratorPassword,
      );

      setIsCollaboratorPasswordChangeDialogOpen(false);
      setCollaboratorForPasswordChange(null);
      setNewCollaboratorPassword("");
      alert("Senha do colaborador alterada com sucesso!");
    } catch (error) {
      console.error("Error updating collaborator password:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao alterar senha do colaborador: ${errorMessage}`);
    }
  };

  const handleDeleteCollaborator = (collaborator) => {
    setDeletingCollaborator(collaborator);
    setIsDeleteCollaboratorDialogOpen(true);
  };

  const confirmDeleteCollaborator = async () => {
    if (!deletingCollaborator) return;

    try {
      // Verify admin password
      const isValidPassword = await administratorService.verifyPassword(
        "admin",
        collaboratorAdminPassword,
      );

      if (!isValidPassword) {
        alert("Senha incorreta!");
        return;
      }

      await administratorService.delete(deletingCollaborator.id);
      console.log("Collaborator deleted:", deletingCollaborator);

      // Refresh the collaborators list
      await loadInternalUsers();

      setIsDeleteCollaboratorDialogOpen(false);
      setDeletingCollaborator(null);
      setCollaboratorAdminPassword("");
      alert("Colaborador excluído com sucesso!");
    } catch (error) {
      console.error("Error deleting collaborator:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao excluir colaborador: ${errorMessage}`);
    }
  };

  const handleDeleteRepresentative = (rep: Representative) => {
    setDeletingRepresentative(rep);
    setIsDeleteRepDialogOpen(true);
  };

  const checkRepresentativeContracts = async (representativeId: string) => {
    try {
      const { data: contracts, error } = await supabase
        .from("contracts")
        .select(
          `
          id,
          contract_number,
          contract_code,
          status,
          clients!inner (full_name, name)
        `,
        )
        .eq("representative_id", representativeId);

      if (error) {
        console.error("Error fetching representative contracts:", error);
        return [];
      }

      return contracts || [];
    } catch (error) {
      console.error("Error checking representative contracts:", error);
      return [];
    }
  };

  const confirmDeleteRepresentative = async () => {
    if (!deletingRepresentative) return;

    try {
      // Verify admin password
      const isValidPassword = await administratorService.verifyPassword(
        "admin",
        adminPassword,
      );

      if (!isValidPassword) {
        alert("Senha incorreta!");
        return;
      }

      // Check if representative has contracts
      const contracts = await checkRepresentativeContracts(
        deletingRepresentative.id,
      );

      if (contracts.length > 0) {
        // Representative has contracts, show transfer dialog
        setRepresentativeContracts(contracts);
        setIsDeleteRepDialogOpen(false);
        setIsContractTransferDialogOpen(true);
      } else {
        // No contracts, proceed with deletion
        await representativeService.delete(deletingRepresentative.id);
        console.log("Representative deleted:", deletingRepresentative);

        // Refresh the representatives list
        await loadRepresentatives();

        setIsDeleteRepDialogOpen(false);
        setDeletingRepresentative(null);
        setAdminPassword("");
        alert("Representante excluído com sucesso!");
      }
    } catch (error) {
      console.error("Error deleting representative:", error);
      alert("Erro ao excluir representante.");
    }
  };

  const handleContractTransfer = async () => {
    if (!deletingRepresentative || !transferOption) {
      alert("Por favor, selecione uma opção de transferência.");
      return;
    }

    if (
      transferOption === "representative" &&
      !selectedTransferRepresentative
    ) {
      alert(
        "Por favor, selecione um representante para transferir os contratos.",
      );
      return;
    }

    try {
      let newRepresentativeId: string;

      if (transferOption === "admin") {
        // Create or get admin user ID - for demo purposes, we'll use a fixed admin ID
        newRepresentativeId = "admin-user-id";

        // In a real implementation, you would:
        // 1. Check if admin user exists in profiles table
        // 2. Create admin user if doesn't exist
        // 3. Use the admin user ID

        // For now, we'll transfer to the first available admin or create a placeholder
        const { data: adminUser, error: adminError } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "Administrador")
          .limit(1)
          .single();

        if (adminUser) {
          newRepresentativeId = adminUser.id;
        } else {
          // Create a system admin entry for contract transfers
          const adminId = crypto.randomUUID();
          const { error: createAdminError } = await supabase
            .from("profiles")
            .insert({
              id: adminId,
              full_name: "Sistema Administrativo",
              email: "admin@sistema.com",
              role: "Administrador",
              status: "Ativo",
            });

          if (createAdminError) {
            console.error("Error creating admin user:", createAdminError);
            throw new Error("Erro ao criar usuário administrativo");
          }

          newRepresentativeId = adminId;
        }
      } else {
        newRepresentativeId = selectedTransferRepresentative;
      }

      // Transfer all contracts to the selected representative/admin
      const { error: transferError } = await supabase
        .from("contracts")
        .update({
          representative_id: newRepresentativeId,
          updated_at: new Date().toISOString(),
        })
        .eq("representative_id", deletingRepresentative.id);

      if (transferError) {
        console.error("Error transferring contracts:", transferError);
        throw new Error("Erro ao transferir contratos");
      }

      // Now delete the representative
      await representativeService.delete(deletingRepresentative.id);
      console.log(
        "Representative deleted and contracts transferred:",
        deletingRepresentative,
      );

      // Refresh the representatives list and contracts
      await loadRepresentatives();
      await loadAllContracts();

      // Close dialogs and reset state
      setIsContractTransferDialogOpen(false);
      setDeletingRepresentative(null);
      setAdminPassword("");
      setTransferOption("");
      setSelectedTransferRepresentative("");
      setRepresentativeContracts([]);

      const transferTarget =
        transferOption === "admin" ? "administrador" : "outro representante";
      alert(
        `Representante excluído com sucesso! ${representativeContracts.length} contrato(s) transferido(s) para ${transferTarget}.`,
      );
    } catch (error) {
      console.error("Error in contract transfer:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao transferir contratos: ${errorMessage}`);
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

  // Commission Plans Management Functions
  const handleCreatePlan = async () => {
    try {
      if (!newPlan.nome.trim()) {
        alert("Nome do plano é obrigatório");
        return;
      }

      await commissionPlansService.create({
        nome: newPlan.nome,
        descricao: newPlan.descricao,
        ativo: newPlan.ativo,
      });

      await loadCommissionPlans();
      setIsNewPlanDialogOpen(false);
      setNewPlan({ nome: "", descricao: "", ativo: true });
      alert("Plano criado com sucesso!");
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Erro ao criar plano. Tente novamente.");
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setIsEditPlanDialogOpen(true);
  };

  const handleUpdatePlan = async () => {
    try {
      if (!editingPlan?.nome?.trim()) {
        alert("Nome do plano é obrigatório");
        return;
      }

      await commissionPlansService.update(editingPlan.id, {
        nome: editingPlan.nome,
        descricao: editingPlan.descricao,
        ativo: editingPlan.ativo,
      });

      await loadCommissionPlans();
      setIsEditPlanDialogOpen(false);
      setEditingPlan(null);
      alert("Plano atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Erro ao atualizar plano. Tente novamente.");
    }
  };

  const handleDeletePlan = async (planId: number) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este plano? Esta ação irá remover todas as faixas de crédito, condições de parcelas e antecipação associadas.",
    );

    if (!confirmDelete) return;

    try {
      await commissionPlansService.delete(planId);
      await loadCommissionPlans();
      alert("Plano excluído com sucesso!");
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("Erro ao excluir plano. Tente novamente.");
    }
  };

  const handleManagePlan = (plan) => {
    setSelectedPlan(plan);
    setIsManagePlanDialogOpen(true);
  };

  // Credit Range Management Functions
  const handleCreateCreditRange = async () => {
    try {
      if (
        !selectedPlan ||
        !newCreditRange.valor_credito ||
        !newCreditRange.valor_primeira_parcela ||
        !newCreditRange.valor_parcelas_restantes ||
        !newCreditRange.numero_total_parcelas
      ) {
        alert("Todos os campos são obrigatórios");
        return;
      }

      await commissionPlansService.createCreditRange({
        plano_id: selectedPlan.id,
        valor_credito: parseFloat(newCreditRange.valor_credito),
        valor_primeira_parcela: parseFloat(
          newCreditRange.valor_primeira_parcela,
        ),
        valor_parcelas_restantes: parseFloat(
          newCreditRange.valor_parcelas_restantes,
        ),
        numero_total_parcelas:
          parseInt(newCreditRange.numero_total_parcelas) || 80,
      });

      await loadCommissionPlans();
      setIsNewCreditRangeDialogOpen(false);
      setNewCreditRange({
        valor_credito: "",
        valor_primeira_parcela: "",
        valor_parcelas_restantes: "",
        numero_total_parcelas: "80",
      });
      alert("Faixa de crédito criada com sucesso!");
    } catch (error) {
      console.error("Error creating credit range:", error);
      alert("Erro ao criar faixa de crédito. Tente novamente.");
    }
  };

  const handleDeleteCreditRange = async (rangeId) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir esta faixa de crédito? Todas as condições de parcelas e antecipação associadas também serão removidas.",
    );

    if (!confirmDelete) return;

    try {
      await commissionPlansService.deleteCreditRange(rangeId);
      await loadCommissionPlans();
      alert("Faixa de crédito excluída com sucesso!");
    } catch (error) {
      console.error("Error deleting credit range:", error);
      alert("Erro ao excluir faixa de crédito. Tente novamente.");
    }
  };

  // Installment Conditions Management Functions
  const handleManageInstallments = (creditRange) => {
    setSelectedRangeForInstallments(creditRange);
    setIsManageInstallmentsDialogOpen(true);
  };

  const handleCreateInstallment = async () => {
    try {
      if (
        !selectedRangeForInstallments ||
        !newInstallment.numero_parcela ||
        !newInstallment.valor_parcela
      ) {
        alert("Todos os campos são obrigatórios");
        return;
      }

      await commissionPlansService.createInstallmentCondition({
        faixa_credito_id: selectedRangeForInstallments.id,
        numero_parcela: parseInt(newInstallment.numero_parcela),
        valor_parcela: parseFloat(newInstallment.valor_parcela),
      });

      await loadCommissionPlans();
      setIsNewInstallmentDialogOpen(false);
      setNewInstallment({ numero_parcela: "", valor_parcela: "" });
      alert("Condição de parcela criada com sucesso!");
    } catch (error) {
      console.error("Error creating installment condition:", error);
      alert("Erro ao criar condição de parcela. Tente novamente.");
    }
  };

  const handleDeleteInstallment = async (installmentId) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir esta condição de parcela?",
    );

    if (!confirmDelete) return;

    try {
      await commissionPlansService.deleteInstallmentCondition(installmentId);
      await loadCommissionPlans();
      alert("Condição de parcela excluída com sucesso!");
    } catch (error) {
      console.error("Error deleting installment condition:", error);
      alert("Erro ao excluir condição de parcela. Tente novamente.");
    }
  };

  // Anticipation Conditions Management Functions
  const handleManageAnticipations = (creditRange) => {
    setSelectedRangeForAnticipations(creditRange);
    setIsManageAnticipationsDialogOpen(true);
  };

  const handleCreateAnticipation = async () => {
    try {
      if (
        !selectedRangeForAnticipations ||
        !newAnticipation.percentual ||
        !newAnticipation.valor_calculado
      ) {
        alert("Todos os campos são obrigatórios");
        return;
      }

      await commissionPlansService.createAnticipationCondition({
        faixa_credito_id: selectedRangeForAnticipations.id,
        percentual: parseInt(newAnticipation.percentual),
        valor_calculado: parseFloat(newAnticipation.valor_calculado),
      });

      await loadCommissionPlans();
      setIsNewAnticipationDialogOpen(false);
      setNewAnticipation({ percentual: "", valor_calculado: "" });
      alert("Condição de antecipação criada com sucesso!");
    } catch (error) {
      console.error("Error creating anticipation condition:", error);
      alert("Erro ao criar condição de antecipação. Tente novamente.");
    }
  };

  const handleDeleteAnticipation = async (anticipationId) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir esta condição de antecipação?",
    );

    if (!confirmDelete) return;

    try {
      await commissionPlansService.deleteAnticipationCondition(anticipationId);
      await loadCommissionPlans();
      alert("Condição de antecipação excluída com sucesso!");
    } catch (error) {
      console.error("Error deleting anticipation condition:", error);
      alert("Erro ao excluir condição de antecipação. Tente novamente.");
    }
  };

  const renderDashboardStats = () => (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(dashboardStats.totalSales)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardStats.salesGrowth >= 0 ? "+" : ""}
                  {dashboardStats.salesGrowth.toFixed(1)}% em relação ao mês
                  anterior
                </p>
                <div
                  className={`mt-2 flex items-center text-xs ${
                    dashboardStats.salesGrowth >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {dashboardStats.salesGrowth >= 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  <span>
                    {Math.abs(dashboardStats.salesGrowth).toFixed(1)}%{" "}
                    {dashboardStats.salesGrowth >= 0
                      ? "de aumento"
                      : "de redução"}
                  </span>
                </div>
              </>
            )}
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
            {isLoadingStats ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardStats.activeContracts}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardStats.contractsGrowth >= 0 ? "+" : ""}
                  {dashboardStats.contractsGrowth.toFixed(1)}% este mês
                </p>
                <div
                  className={`mt-2 flex items-center text-xs ${
                    dashboardStats.contractsGrowth >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {dashboardStats.contractsGrowth >= 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  <span>
                    {Math.abs(dashboardStats.contractsGrowth).toFixed(1)}%{" "}
                    {dashboardStats.contractsGrowth >= 0
                      ? "de aumento"
                      : "de redução"}
                  </span>
                </div>
              </>
            )}
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
            {isLoadingStats ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardStats.totalRepresentatives}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardStats.representativesGrowth >= 0 ? "+" : ""}
                  {dashboardStats.representativesGrowth.toFixed(1)}% este mês
                </p>
                <div
                  className={`mt-2 flex items-center text-xs ${
                    dashboardStats.representativesGrowth >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {dashboardStats.representativesGrowth >= 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  <span>
                    {Math.abs(dashboardStats.representativesGrowth).toFixed(1)}%{" "}
                    {dashboardStats.representativesGrowth >= 0
                      ? "de aumento"
                      : "de redução"}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Comissões Pendentes
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(dashboardStats.pendingCommissions)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseado em contratos ativos
                </p>
                <div
                  className={`mt-2 flex items-center text-xs ${
                    dashboardStats.commissionsGrowth >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {dashboardStats.commissionsGrowth >= 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  <span>
                    {Math.abs(dashboardStats.commissionsGrowth).toFixed(1)}%{" "}
                    {dashboardStats.commissionsGrowth >= 0
                      ? "de aumento"
                      : "de redução"}
                  </span>
                </div>
              </>
            )}
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
            {isLoadingContracts ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allContracts.slice(0, 5).map((contract: any) => {
                    const representative = representatives.find(
                      (r) => r.id === contract.representative_id,
                    );
                    return (
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
                          <Button
                            variant="link"
                            className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              if (representative?.id) {
                                navigate(
                                  `/representative/${representative.id}`,
                                );
                              }
                            }}
                          >
                            {contract.profiles?.full_name ||
                              representative?.name ||
                              "Representante não encontrado"}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(
                            contract.credit_amount || contract.total_value || 0,
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
                      </TableRow>
                    );
                  })}
                  {allContracts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nenhum contrato encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
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
            {isLoadingRepresentatives || isLoadingContracts
              ? [...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center space-x-4"
                  >
                    <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                ))
              : (() => {
                  // Calculate representative performance
                  const repPerformance = representatives
                    .map((rep) => {
                      const repContracts = allContracts.filter(
                        (c: any) => c.representative_id === rep.id,
                      );
                      const totalValue = repContracts.reduce(
                        (sum: number, contract: any) => {
                          return (
                            sum +
                            (parseFloat(
                              contract.total_value ||
                                contract.credit_amount ||
                                "0",
                            ) || 0)
                          );
                        },
                        0,
                      );
                      return {
                        ...rep,
                        contractsCount: repContracts.length,
                        totalValue,
                      };
                    })
                    .sort((a, b) => b.totalValue - a.totalValue)
                    .slice(0, 5);

                  const maxValue = repPerformance[0]?.totalValue || 1;

                  return repPerformance.length > 0 ? (
                    repPerformance.map((rep, index) => {
                      const percentage = Math.round(
                        (rep.totalValue / maxValue) * 100,
                      );
                      return (
                        <div key={rep.id} className="flex items-center">
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
                            <p className="text-sm font-medium leading-none">
                              {rep.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {rep.contractsCount} contratos |{" "}
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(rep.totalValue)}
                            </p>
                          </div>
                          <div className="ml-auto font-medium">
                            {percentage}%
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Nenhum representante com vendas ainda</p>
                    </div>
                  );
                })()}
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
    <Form {...form}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className="hidden md:flex w-64 flex-col bg-card border-r p-4">
          <div
            className="flex items-center mb-8 cursor-pointer"
            onClick={() => navigate("/")}
          >
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
              <Button
                variant={activeSection === "clients" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection("clients")}
              >
                <Users className="mr-2 h-4 w-4" />
                Clientes
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
                variant={
                  activeSection === "collaborators" ? "default" : "ghost"
                }
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
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    // Update specific search based on active section
                    if (activeSection === "representatives") {
                      setRepresentativesSearch(e.target.value);
                    } else if (activeSection === "contracts") {
                      setContractsSearch(e.target.value);
                    } else if (activeSection === "clients") {
                      setClientsSearch(e.target.value);
                    }
                  }}
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
                    <p className="text-xs text-muted-foreground">
                      Administrador
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      authService.logout();
                      navigate("/");
                    }}
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
                  <h1 className="text-2xl font-bold tracking-tight">
                    Dashboard
                  </h1>
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
                              value={formatCpfCnpj(
                                newRepresentative.cnpj || "",
                              )}
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

                {/* Pending Registrations Section */}
                {pendingRegistrations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-orange-500" />
                        Cadastros Pendentes de Aprovação
                      </CardTitle>
                      <CardDescription>
                        {pendingRegistrations.length} representantes aguardando
                        aprovação
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingPendingRegistrations ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pendingRegistrations.map((rep) => (
                            <div
                              key={rep.id}
                              className="flex items-center justify-between p-4 border rounded-lg bg-orange-50"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rep.name}`}
                                    />
                                    <AvatarFallback>
                                      {rep.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-medium">{rep.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {rep.email}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {rep.razao_social} - {rep.ponto_venda}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleApproveRepresentative(rep)
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPendingRep(rep);
                                    setIsRejectionDialogOpen(true);
                                  }}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Reprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    navigate(`/representative/${rep.id}`);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Representatives Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Lista de Representantes Aprovados</CardTitle>
                        <CardDescription>
                          {filteredRepresentatives.length} de{" "}
                          {representatives.length} representantes
                          {representativesSearch &&
                            ` (filtrado por "${representativesSearch}")`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar representantes..."
                            value={representativesSearch}
                            onChange={(e) => {
                              setRepresentativesSearch(e.target.value);
                              setGlobalSearch(e.target.value);
                              setCurrentPage(1); // Reset to first page when searching
                            }}
                            className="pl-8 w-64"
                          />
                        </div>
                      </div>
                    </div>
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
                              <TableHead className="text-right">
                                Ações
                              </TableHead>
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
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        console.log(
                                          "Edit button clicked for:",
                                          rep.name,
                                        );
                                        handleEditRepresentative(rep);
                                      }}
                                      title="Editar representante"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        console.log(
                                          "Password change button clicked for:",
                                          rep.name,
                                        );
                                        handleChangePassword(rep);
                                      }}
                                      title="Alterar senha"
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50"
                                    >
                                      <Key className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        console.log(
                                          "View details button clicked for:",
                                          rep.name,
                                        );
                                        navigate(`/representative/${rep.id}`);
                                      }}
                                      title="Ver detalhes"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        console.log(
                                          "Delete button clicked for:",
                                          rep.name,
                                        );
                                        handleDeleteRepresentative(rep);
                                      }}
                                      title="Excluir representante"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50"
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
                              {Math.min(
                                endIndex,
                                filteredRepresentatives.length,
                              )}{" "}
                              de {filteredRepresentatives.length} representantes
                              {representativesSearch &&
                                ` (de ${representatives.length} total)`}
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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Lista de Contratos</CardTitle>
                        <CardDescription>
                          {
                            allContracts.filter((contract: any) => {
                              if (!contractsSearch) return true;
                              const searchTerm = contractsSearch.toLowerCase();
                              return (
                                (contract.contract_number &&
                                  contract.contract_number
                                    .toLowerCase()
                                    .includes(searchTerm)) ||
                                (contract.contract_code &&
                                  contract.contract_code
                                    .toLowerCase()
                                    .includes(searchTerm)) ||
                                (contract.clients?.name &&
                                  contract.clients.name
                                    .toLowerCase()
                                    .includes(searchTerm)) ||
                                (contract.clients?.full_name &&
                                  contract.clients.full_name
                                    .toLowerCase()
                                    .includes(searchTerm)) ||
                                (contract.profiles?.full_name &&
                                  contract.profiles.full_name
                                    .toLowerCase()
                                    .includes(searchTerm))
                              );
                            }).length
                          }{" "}
                          de {allContracts.length} contratos
                          {contractsSearch &&
                            ` (filtrado por "${contractsSearch}")`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar contratos..."
                            value={contractsSearch}
                            onChange={(e) => {
                              setContractsSearch(e.target.value);
                              setGlobalSearch(e.target.value);
                            }}
                            className="pl-8 w-64"
                          />
                        </div>
                      </div>
                    </div>
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
                                <Select
                                  value={contract.status}
                                  onValueChange={(newStatus) =>
                                    handleStatusChange(contract, newStatus)
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue>
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
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pendente">
                                      Pendente
                                    </SelectItem>
                                    <SelectItem value="Ativo">Ativo</SelectItem>
                                    <SelectItem value="Aprovado">
                                      Aprovado
                                    </SelectItem>
                                    <SelectItem value="Reprovado">
                                      Reprovado
                                    </SelectItem>
                                    <SelectItem value="Cancelado">
                                      Cancelado
                                    </SelectItem>
                                    <SelectItem value="Concluído">
                                      Concluído
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                {new Date(
                                  contract.created_at,
                                ).toLocaleDateString("pt-BR")}
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
                                    disabled={
                                      contract.status === "Aprovado" ||
                                      contract.status === "Ativo"
                                    }
                                    title={
                                      contract.status === "Aprovado" ||
                                      contract.status === "Ativo"
                                        ? "Contratos aprovados só podem ser editados por administradores"
                                        : "Editar contrato"
                                    }
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteContract(
                                        contract.id.toString(),
                                      )
                                    }
                                    title="Excluir contrato (admin)"
                                  >
                                    <Trash2 className="h-4 w-4" />
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

            {activeSection === "commission-reports" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Relatório de Comissões
                    </h1>
                    <p className="text-muted-foreground">
                      Visualize e gerencie os relatórios de comissões dos
                      representantes.
                    </p>
                  </div>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Relatório
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Relatórios de Comissão</CardTitle>
                    <CardDescription>
                      Resumo das comissões por representante no período atual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Representante</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Total Comissão</TableHead>
                          <TableHead>Pago</TableHead>
                          <TableHead>Pendente</TableHead>
                          <TableHead>Contratos</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissionReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">
                              {report.representative}
                            </TableCell>
                            <TableCell>{report.period}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(report.totalCommission)}
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(report.paidCommission)}
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(report.pendingCommission)}
                            </TableCell>
                            <TableCell>{report.contracts}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "withdrawals" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Solicitações de Retirada
                    </h1>
                    <p className="text-muted-foreground">
                      Gerencie as solicitações de retirada dos representantes.
                    </p>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Solicitações Pendentes</CardTitle>
                    <CardDescription>
                      {
                        withdrawalRequests.filter((r) => r.status === "pending")
                          .length
                      }{" "}
                      solicitações aguardando aprovação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Representante</TableHead>
                          <TableHead>Valor Solicitado</TableHead>
                          <TableHead>Saldo Disponível</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawalRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {request.id}
                            </TableCell>
                            <TableCell>{request.representativeName}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(request.amount)}
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(request.availableBalance)}
                            </TableCell>
                            <TableCell>
                              {new Date(request.requestDate).toLocaleDateString(
                                "pt-BR",
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  request.status === "approved"
                                    ? "default"
                                    : request.status === "pending"
                                      ? "outline"
                                      : "destructive"
                                }
                              >
                                {request.status === "pending"
                                  ? "Pendente"
                                  : request.status === "approved"
                                    ? "Aprovado"
                                    : "Rejeitado"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {request.status === "pending" && (
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleWithdrawalAction(
                                        request.id,
                                        "approve",
                                      )
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleWithdrawalAction(
                                        request.id,
                                        "reject",
                                      )
                                    }
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "invoices" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Gestão de Faturas
                    </h1>
                    <p className="text-muted-foreground">
                      Gerencie as faturas e pagamentos dos contratos.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Faturas Pendentes
                      </CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {invoices.filter((i) => i.status === "pending").length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Aguardando pagamento
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Faturas Pagas
                      </CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {invoices.filter((i) => i.status === "paid").length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pagamentos confirmados
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Faturas Vencidas
                      </CardTitle>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {invoices.filter((i) => i.status === "overdue").length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pagamentos em atraso
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Contracts List */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle>Contratos Aprovados</CardTitle>
                        <CardDescription>
                          Selecione um contrato para ver suas faturas
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-96 overflow-y-auto">
                          {allContracts
                            .filter(
                              (contract: any) =>
                                contract.status === "Aprovado" ||
                                contract.status === "Ativo",
                            )
                            .map((contract: any) => (
                              <div
                                key={contract.id}
                                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                                  selectedContractForInvoices?.id ===
                                  contract.id.toString()
                                    ? "bg-red-50 border-l-4 border-l-red-600"
                                    : ""
                                }`}
                                onClick={() => {
                                  const contractData = {
                                    id: contract.id.toString(),
                                    client:
                                      contract.clients?.name ||
                                      contract.clients?.full_name ||
                                      "Cliente não encontrado",
                                    representative:
                                      contract.profiles?.full_name ||
                                      "Representante não encontrado",
                                    value: parseFloat(
                                      contract.credit_amount ||
                                        contract.total_value ||
                                        "0",
                                    ),
                                    installments: 80,
                                    paidInstallments: 0,
                                    remainingValue: parseFloat(
                                      contract.credit_amount ||
                                        contract.total_value ||
                                        "0",
                                    ),
                                    status: contract.status,
                                    createdAt:
                                      contract.created_at ||
                                      new Date().toISOString(),
                                  };
                                  setSelectedContractForInvoices(contractData);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">
                                      {contract.contract_number ||
                                        contract.contract_code ||
                                        `CONT-${contract.id}`}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {contract.clients?.name ||
                                        contract.clients?.full_name ||
                                        "Cliente não encontrado"}
                                    </p>
                                    <p className="text-xs font-medium text-green-600 mt-1">
                                      {new Intl.NumberFormat("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      }).format(
                                        contract.credit_amount ||
                                          contract.total_value ||
                                          0,
                                      )}
                                    </p>
                                    <div className="mt-2 space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">
                                          Pago:
                                        </span>
                                        <span className="text-green-600 font-medium">
                                          {new Intl.NumberFormat("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                          }).format(
                                            (contract.credit_amount ||
                                              contract.total_value ||
                                              0) * 0.15, // Simulando 15% pago
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">
                                          Restante:
                                        </span>
                                        <span className="text-orange-600 font-medium">
                                          {new Intl.NumberFormat("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                          }).format(
                                            (contract.credit_amount ||
                                              contract.total_value ||
                                              0) * 0.85, // Simulando 85% restante
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {contract.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          {allContracts.filter(
                            (contract: any) =>
                              contract.status === "Aprovado" ||
                              contract.status === "Ativo",
                          ).length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                              <FileText className="h-12 w-12 mx-auto mb-2" />
                              <p className="text-sm">
                                Nenhum contrato aprovado encontrado
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Invoice Details */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>
                              {selectedContractForInvoices
                                ? `Faturas - ${selectedContractForInvoices.id}`
                                : "Faturas do Contrato"}
                            </CardTitle>
                            <CardDescription>
                              {selectedContractForInvoices
                                ? `Cliente: ${selectedContractForInvoices.client}`
                                : "Selecione um contrato para visualizar as faturas"}
                            </CardDescription>
                          </div>
                          {selectedContractForInvoices && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Generate sample invoices for the selected contract
                                  const newInvoices = [];
                                  const installmentValue =
                                    selectedContractForInvoices.remainingValue /
                                    80;

                                  for (let i = 1; i <= 3; i++) {
                                    const dueDate = new Date();
                                    dueDate.setMonth(dueDate.getMonth() + i);

                                    newInvoices.push({
                                      id: `INV-${selectedContractForInvoices.id}-${i}`,
                                      contractId:
                                        selectedContractForInvoices.id,
                                      amount: installmentValue,
                                      installmentNumber: i,
                                      dueDate: dueDate
                                        .toISOString()
                                        .split("T")[0],
                                      status:
                                        i === 1 ? "paid" : ("pending" as const),
                                      createdAt: new Date()
                                        .toISOString()
                                        .split("T")[0],
                                      paidAt:
                                        i === 1
                                          ? new Date()
                                              .toISOString()
                                              .split("T")[0]
                                          : undefined,
                                    });
                                  }

                                  setInvoices((prev) => [
                                    ...prev.filter(
                                      (inv) =>
                                        inv.contractId !==
                                        selectedContractForInvoices.id,
                                    ),
                                    ...newInvoices,
                                  ]);
                                }}
                                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                              >
                                <Receipt className="mr-2 h-4 w-4" />
                                Gerar Faturas
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedContract(
                                    selectedContractForInvoices,
                                  );
                                  setIsEarlyPaymentDialogOpen(true);
                                }}
                                className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Gerar Antecipação
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!selectedContractForInvoices ? (
                          <div className="text-center py-12">
                            <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium mb-2">
                              Selecione um Contrato
                            </p>
                            <p className="text-muted-foreground">
                              Escolha um contrato na lista ao lado para
                              visualizar suas faturas.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Contract Summary */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Valor Total
                                  </p>
                                  <p className="font-semibold text-green-600">
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(
                                      selectedContractForInvoices.value,
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Valor Restante
                                  </p>
                                  <p className="font-semibold text-orange-600">
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(
                                      selectedContractForInvoices.remainingValue,
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Parcelas
                                  </p>
                                  <p className="font-semibold">
                                    {
                                      selectedContractForInvoices.paidInstallments
                                    }
                                    /{selectedContractForInvoices.installments}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Status
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {selectedContractForInvoices.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Invoices Table */}
                            {invoices.filter(
                              (inv) =>
                                inv.contractId ===
                                selectedContractForInvoices.id,
                            ).length === 0 ? (
                              <div className="text-center py-8">
                                <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-lg font-medium mb-2">
                                  Nenhuma fatura gerada
                                </p>
                                <p className="text-muted-foreground mb-4">
                                  Clique em "Gerar Faturas" para criar as
                                  faturas deste contrato.
                                </p>
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Fatura</TableHead>
                                    <TableHead>Parcela</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                      Ações
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {invoices
                                    .filter(
                                      (inv) =>
                                        inv.contractId ===
                                        selectedContractForInvoices.id,
                                    )
                                    .map((invoice) => (
                                      <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">
                                          {invoice.id}
                                        </TableCell>
                                        <TableCell>
                                          {invoice.installmentNumber === 0
                                            ? "Antecipação"
                                            : `${invoice.installmentNumber}/${selectedContractForInvoices.installments}`}
                                        </TableCell>
                                        <TableCell>
                                          {new Intl.NumberFormat("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                          }).format(invoice.amount)}
                                        </TableCell>
                                        <TableCell>
                                          {new Date(
                                            invoice.dueDate,
                                          ).toLocaleDateString("pt-BR")}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              invoice.status === "paid"
                                                ? "default"
                                                : invoice.status === "pending"
                                                  ? "outline"
                                                  : "destructive"
                                            }
                                          >
                                            {invoice.status === "paid"
                                              ? "Pago"
                                              : invoice.status === "pending"
                                                ? "Pendente"
                                                : "Vencido"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex gap-2 justify-end">
                                            <Button variant="outline" size="sm">
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                            {invoice.status === "pending" && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  // Mark as paid
                                                  setInvoices((prev) =>
                                                    prev.map((inv) =>
                                                      inv.id === invoice.id
                                                        ? {
                                                            ...inv,
                                                            status:
                                                              "paid" as const,
                                                            paidAt: new Date()
                                                              .toISOString()
                                                              .split("T")[0],
                                                          }
                                                        : inv,
                                                    ),
                                                  );
                                                }}
                                                className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                                                title="Marcar como pago"
                                              >
                                                <CheckCircle className="h-4 w-4" />
                                              </Button>
                                            )}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "settings" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Configurações
                    </h1>
                    <p className="text-muted-foreground">
                      Configure as definições do sistema.
                    </p>
                  </div>
                </div>

                <Tabs
                  value={activeConfigTab}
                  onValueChange={setActiveConfigTab}
                >
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="general-settings">Geral</TabsTrigger>
                    <TabsTrigger value="commission-tables">
                      Planos de Comissão
                    </TabsTrigger>
                    <TabsTrigger value="groups-quotas">
                      Grupos e Cotas
                    </TabsTrigger>
                    <TabsTrigger value="payment-settings">
                      Pagamentos
                    </TabsTrigger>
                    <TabsTrigger value="email-settings">Email</TabsTrigger>
                    <TabsTrigger value="system-settings">Sistema</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general-settings" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações Gerais</CardTitle>
                        <CardDescription>
                          Configure as informações da empresa e personalização
                          do sistema
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* System Branding */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">
                            Identidade do Sistema
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="system-name">
                                Nome do Sistema
                              </Label>
                              <Input
                                id="system-name"
                                value={generalSettings.systemName}
                                onChange={(e) =>
                                  setGeneralSettings({
                                    ...generalSettings,
                                    systemName: e.target.value,
                                  })
                                }
                                placeholder="CredCar"
                              />
                            </div>
                            <div>
                              <Label htmlFor="logo-url">URL do Logo</Label>
                              <Input
                                id="logo-url"
                                value={generalSettings.logoUrl}
                                onChange={(e) =>
                                  setGeneralSettings({
                                    ...generalSettings,
                                    logoUrl: e.target.value,
                                  })
                                }
                                placeholder="https://exemplo.com/logo.png"
                              />
                            </div>
                          </div>
                          {generalSettings.logoUrl && (
                            <div className="mt-4">
                              <Label>Pré-visualização do Logo</Label>
                              <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                                <img
                                  src={generalSettings.logoUrl}
                                  alt="Logo da empresa"
                                  className="h-12 object-contain"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Company Information */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">
                            Informações da Empresa
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="company-name">Razão Social</Label>
                              <Input
                                id="company-name"
                                value={generalSettings.companyName}
                                onChange={(e) =>
                                  setGeneralSettings({
                                    ...generalSettings,
                                    companyName: e.target.value,
                                  })
                                }
                                placeholder="CredCar Soluções Financeiras Ltda"
                              />
                            </div>
                            <div>
                              <Label htmlFor="company-cnpj">CNPJ</Label>
                              <Input
                                id="company-cnpj"
                                value={generalSettings.companyCNPJ}
                                onChange={(e) =>
                                  setGeneralSettings({
                                    ...generalSettings,
                                    companyCNPJ: e.target.value,
                                  })
                                }
                                placeholder="12.345.678/0001-90"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="company-address">
                              Endereço Completo
                            </Label>
                            <Input
                              id="company-address"
                              value={generalSettings.companyAddress}
                              onChange={(e) =>
                                setGeneralSettings({
                                  ...generalSettings,
                                  companyAddress: e.target.value,
                                })
                              }
                              placeholder="Rua das Empresas, 123 - Centro - São Paulo/SP - CEP: 01000-000"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="company-phone">Telefone</Label>
                              <Input
                                id="company-phone"
                                value={generalSettings.companyPhone}
                                onChange={(e) =>
                                  setGeneralSettings({
                                    ...generalSettings,
                                    companyPhone: e.target.value,
                                  })
                                }
                                placeholder="(11) 3000-0000"
                              />
                            </div>
                            <div>
                              <Label htmlFor="company-email">
                                Email Corporativo
                              </Label>
                              <Input
                                id="company-email"
                                type="email"
                                value={generalSettings.companyEmail}
                                onChange={(e) =>
                                  setGeneralSettings({
                                    ...generalSettings,
                                    companyEmail: e.target.value,
                                  })
                                }
                                placeholder="contato@credcar.com.br"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Preview */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">
                            Pré-visualização
                          </h3>
                          <div className="p-6 border rounded-lg bg-white">
                            <div className="flex items-center mb-4">
                              {generalSettings.logoUrl ? (
                                <img
                                  src={generalSettings.logoUrl}
                                  alt="Logo"
                                  className="h-8 w-8 rounded-md mr-2"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-md bg-red-600 mr-2"></div>
                              )}
                              <h1 className="text-xl font-bold">
                                {generalSettings.systemName}
                              </h1>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>
                                <strong>{generalSettings.companyName}</strong>
                              </p>
                              <p>CNPJ: {generalSettings.companyCNPJ}</p>
                              <p>{generalSettings.companyAddress}</p>
                              <p>
                                Tel: {generalSettings.companyPhone} | Email:{" "}
                                {generalSettings.companyEmail}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button className="bg-red-600 hover:bg-red-700">
                          Salvar Configurações Gerais
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="commission-tables" className="space-y-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Planos de Comissão</CardTitle>
                          <CardDescription>
                            Configure os planos de financiamento e suas
                            condições de comissão
                          </CardDescription>
                        </div>
                        <Dialog
                          open={isNewPlanDialogOpen}
                          onOpenChange={setIsNewPlanDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Novo Plano
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Criar Novo Plano de Comissão
                              </DialogTitle>
                              <DialogDescription>
                                Configure um novo plano de financiamento com
                                suas condições.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div>
                                <Label htmlFor="plan-name">
                                  Nome do Plano *
                                </Label>
                                <Input
                                  id="plan-name"
                                  value={newPlan.nome}
                                  onChange={(e) =>
                                    setNewPlan({
                                      ...newPlan,
                                      nome: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: Plano A"
                                />
                              </div>
                              <div>
                                <Label htmlFor="plan-description">
                                  Descrição
                                </Label>
                                <Input
                                  id="plan-description"
                                  value={newPlan.descricao}
                                  onChange={(e) =>
                                    setNewPlan({
                                      ...newPlan,
                                      descricao: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: Compra Programada 80X"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="plan-active"
                                  checked={newPlan.ativo}
                                  onChange={(e) =>
                                    setNewPlan({
                                      ...newPlan,
                                      ativo: e.target.checked,
                                    })
                                  }
                                />
                                <Label htmlFor="plan-active">Plano ativo</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsNewPlanDialogOpen(false);
                                  setNewPlan({
                                    nome: "",
                                    descricao: "",
                                    ativo: true,
                                  });
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleCreatePlan}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Criar Plano
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardHeader>
                      <CardContent>
                        {isLoadingPlans ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Faixas de Crédito</TableHead>
                                <TableHead>Data de Criação</TableHead>
                                <TableHead className="text-right">
                                  Ações
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {commissionPlans.map((plan) => {
                                const planRanges = creditRanges.filter(
                                  (range) => range.plano_id === plan.id,
                                );
                                return (
                                  <TableRow key={plan.id}>
                                    <TableCell className="font-medium">
                                      {plan.id}
                                    </TableCell>
                                    <TableCell>{plan.nome}</TableCell>
                                    <TableCell>
                                      {plan.descricao || "-"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          plan.ativo ? "default" : "secondary"
                                        }
                                      >
                                        {plan.ativo ? "Ativo" : "Inativo"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{planRanges.length}</TableCell>
                                    <TableCell>
                                      {new Date(
                                        plan.data_criacao,
                                      ).toLocaleDateString("pt-BR")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleManagePlan(plan)}
                                          title="Gerenciar faixas e condições"
                                        >
                                          <Settings className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditPlan(plan)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleDeletePlan(plan.id)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              {commissionPlans.length === 0 && (
                                <TableRow>
                                  <TableCell
                                    colSpan={7}
                                    className="text-center py-8 text-muted-foreground"
                                  >
                                    Nenhum plano encontrado. Crie seu primeiro
                                    plano de comissão.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="groups-quotas" className="space-y-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Gerenciamento de Grupos e Cotas</CardTitle>
                          <CardDescription>
                            Configure os grupos de cotas e gerencie a
                            disponibilidade
                          </CardDescription>
                        </div>
                        <Dialog
                          open={isNewGroupDialogOpen}
                          onOpenChange={setIsNewGroupDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700">
                              <Group className="mr-2 h-4 w-4" />
                              Novo Grupo
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Criar Novo Grupo</DialogTitle>
                              <DialogDescription>
                                Configure um novo grupo de cotas.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div>
                                <Label htmlFor="group-name">
                                  Nome do Grupo *
                                </Label>
                                <Input
                                  id="group-name"
                                  value={newGroup.name}
                                  onChange={(e) =>
                                    setNewGroup({
                                      ...newGroup,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: Grupo A"
                                />
                              </div>
                              <div>
                                <Label htmlFor="group-description">
                                  Descrição
                                </Label>
                                <Input
                                  id="group-description"
                                  value={newGroup.description}
                                  onChange={(e) =>
                                    setNewGroup({
                                      ...newGroup,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Descrição do grupo"
                                />
                              </div>
                              <div>
                                <Label htmlFor="total-quotas">
                                  Total de Cotas *
                                </Label>
                                <Input
                                  id="total-quotas"
                                  type="number"
                                  value={newGroup.totalQuotas}
                                  onChange={(e) =>
                                    setNewGroup({
                                      ...newGroup,
                                      totalQuotas:
                                        parseInt(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="10"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsNewGroupDialogOpen(false);
                                  setNewGroup({
                                    name: "",
                                    description: "",
                                    totalQuotas: 10,
                                  });
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={async () => {
                                  try {
                                    if (!newGroup.name.trim()) {
                                      alert("Nome do grupo é obrigatório");
                                      return;
                                    }

                                    // Create group
                                    const { data: group, error: groupError } =
                                      await supabase
                                        .from("groups")
                                        .insert({
                                          name: newGroup.name,
                                          description: newGroup.description,
                                          total_quotas: newGroup.totalQuotas,
                                        })
                                        .select()
                                        .single();

                                    if (groupError) throw groupError;

                                    // Create quotas for the group
                                    const quotasToInsert = [];
                                    for (
                                      let i = 1;
                                      i <= newGroup.totalQuotas;
                                      i++
                                    ) {
                                      quotasToInsert.push({
                                        group_id: group.id,
                                        quota_number: i,
                                        status: "Disponível",
                                      });
                                    }

                                    const { error: quotasError } =
                                      await supabase
                                        .from("quotas")
                                        .insert(quotasToInsert);

                                    if (quotasError) throw quotasError;

                                    await loadGroups();
                                    setIsNewGroupDialogOpen(false);
                                    setNewGroup({
                                      name: "",
                                      description: "",
                                      totalQuotas: 10,
                                    });
                                    alert("Grupo criado com sucesso!");
                                  } catch (error) {
                                    console.error(
                                      "Error creating group:",
                                      error,
                                    );
                                    alert(
                                      "Erro ao criar grupo. Tente novamente.",
                                    );
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Criar Grupo
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardHeader>
                      <CardContent>
                        {isLoadingGroups ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Groups Table */}
                            <div>
                              <h4 className="font-semibold mb-4">Grupos</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Total Cotas</TableHead>
                                    <TableHead>Disponíveis</TableHead>
                                    <TableHead>Ocupadas</TableHead>
                                    <TableHead className="text-right">
                                      Ações
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {groups.map((group: any) => (
                                    <TableRow key={group.id}>
                                      <TableCell className="font-medium">
                                        {group.name}
                                      </TableCell>
                                      <TableCell>
                                        {group.description || "-"}
                                      </TableCell>
                                      <TableCell>
                                        {group.total_quotas}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant="outline"
                                          className="text-green-600"
                                        >
                                          {group.available_quotas}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant="outline"
                                          className="text-red-600"
                                        >
                                          {group.occupied_quotas}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedGroup(group);
                                              setIsManageQuotasDialogOpen(true);
                                            }}
                                            title="Gerenciar Cotas"
                                          >
                                            <Hash className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                              const confirmDelete =
                                                window.confirm(
                                                  `Tem certeza que deseja excluir o grupo "${group.name}"? Todas as cotas associadas também serão excluídas.`,
                                                );
                                              if (!confirmDelete) return;

                                              try {
                                                const { error } = await supabase
                                                  .from("groups")
                                                  .delete()
                                                  .eq("id", group.id);

                                                if (error) throw error;

                                                await loadGroups();
                                                alert(
                                                  "Grupo excluído com sucesso!",
                                                );
                                              } catch (error) {
                                                console.error(
                                                  "Error deleting group:",
                                                  error,
                                                );
                                                alert(
                                                  "Erro ao excluir grupo. Tente novamente.",
                                                );
                                              }
                                            }}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {groups.length === 0 && (
                                    <TableRow>
                                      <TableCell
                                        colSpan={6}
                                        className="text-center py-8 text-muted-foreground"
                                      >
                                        Nenhum grupo encontrado. Crie seu
                                        primeiro grupo.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-4 border rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {groups.length}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Total de Grupos
                                </div>
                              </div>
                              <div className="p-4 border rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {groups.reduce(
                                    (sum: number, group: any) =>
                                      sum + (group.available_quotas || 0),
                                    0,
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Cotas Disponíveis
                                </div>
                              </div>
                              <div className="p-4 border rounded-lg text-center">
                                <div className="text-2xl font-bold text-red-600">
                                  {groups.reduce(
                                    (sum: number, group: any) =>
                                      sum + (group.occupied_quotas || 0),
                                    0,
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Cotas Ocupadas
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="payment-settings" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações de Pagamento</CardTitle>
                        <CardDescription>
                          Configure as opções de pagamento e integração com
                          gateways
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="asaas-api-key">Chave API Asaas</Label>
                          <Input
                            id="asaas-api-key"
                            type="password"
                            value={paymentSettings.asaasApiKey}
                            onChange={(e) =>
                              setPaymentSettings({
                                ...paymentSettings,
                                asaasApiKey: e.target.value,
                              })
                            }
                            placeholder="Insira sua chave API do Asaas"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="auto-generate-boletos"
                            checked={paymentSettings.autoGenerateBoletos}
                            onChange={(e) =>
                              setPaymentSettings({
                                ...paymentSettings,
                                autoGenerateBoletos: e.target.checked,
                              })
                            }
                          />
                          <Label htmlFor="auto-generate-boletos">
                            Gerar boletos automaticamente
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enable-pix"
                            checked={paymentSettings.enablePix}
                            onChange={(e) =>
                              setPaymentSettings({
                                ...paymentSettings,
                                enablePix: e.target.checked,
                              })
                            }
                          />
                          <Label htmlFor="enable-pix">
                            Habilitar pagamento via PIX
                          </Label>
                        </div>
                        <div>
                          <Label htmlFor="default-due-days">
                            Dias padrão para vencimento
                          </Label>
                          <Input
                            id="default-due-days"
                            type="number"
                            value={paymentSettings.defaultDueDays}
                            onChange={(e) =>
                              setPaymentSettings({
                                ...paymentSettings,
                                defaultDueDays: parseInt(e.target.value),
                              })
                            }
                            placeholder="30"
                          />
                        </div>
                        <Button className="bg-red-600 hover:bg-red-700">
                          Salvar Configurações
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="email-settings" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações de Email</CardTitle>
                        <CardDescription>
                          Configure o servidor de email para envio de
                          notificações
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="email-provider">
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
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="smtp">SMTP</SelectItem>
                              <SelectItem value="sendgrid">SendGrid</SelectItem>
                              <SelectItem value="mailgun">Mailgun</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="smtp-host">Servidor SMTP</Label>
                            <Input
                              id="smtp-host"
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
                          <div>
                            <Label htmlFor="smtp-port">Porta</Label>
                            <Input
                              id="smtp-port"
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
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="smtp-user">Usuário</Label>
                            <Input
                              id="smtp-user"
                              value={emailSettings.smtpUser}
                              onChange={(e) =>
                                setEmailSettings({
                                  ...emailSettings,
                                  smtpUser: e.target.value,
                                })
                              }
                              placeholder="seu-email@gmail.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="smtp-password">Senha</Label>
                            <Input
                              id="smtp-password"
                              type="password"
                              value={emailSettings.smtpPassword}
                              onChange={(e) =>
                                setEmailSettings({
                                  ...emailSettings,
                                  smtpPassword: e.target.value,
                                })
                              }
                              placeholder="sua-senha"
                            />
                          </div>
                        </div>
                        <div>
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
                              <SelectItem value="tls">TLS</SelectItem>
                              <SelectItem value="ssl">SSL</SelectItem>
                              <SelectItem value="none">Nenhuma</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="bg-red-600 hover:bg-red-700">
                          Salvar Configurações
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="system-settings" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações do Sistema</CardTitle>
                        <CardDescription>
                          Configurações gerais do sistema
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Configurações gerais do sistema</Label>
                          <p className="text-sm text-muted-foreground mt-2">
                            Esta seção será implementada com configurações
                            específicas do sistema.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeSection === "clients" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Clientes
                    </h1>
                    <p className="text-muted-foreground">
                      Gerencie todos os clientes do sistema.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={clientsFilter}
                      onValueChange={setClientsFilter}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por representante" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Todos os representantes
                        </SelectItem>
                        {representatives.map((rep) => (
                          <SelectItem key={rep.id} value={rep.id}>
                            {rep.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </div>
                </div>

                {/* Clients Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Lista de Clientes</CardTitle>
                        <CardDescription>
                          {
                            allClients.filter((client) => {
                              if (clientsFilter !== "all") {
                                const matchesFilter =
                                  client.representative_id === clientsFilter ||
                                  client.profiles?.id === clientsFilter;
                                if (!matchesFilter) return false;
                              }
                              if (!clientsSearch) return true;
                              const searchTerm = clientsSearch.toLowerCase();
                              return (
                                (client.full_name &&
                                  client.full_name
                                    .toLowerCase()
                                    .includes(searchTerm)) ||
                                (client.name &&
                                  client.name
                                    .toLowerCase()
                                    .includes(searchTerm)) ||
                                (client.email &&
                                  client.email
                                    .toLowerCase()
                                    .includes(searchTerm)) ||
                                (client.phone &&
                                  client.phone
                                    .toLowerCase()
                                    .includes(searchTerm)) ||
                                (client.cpf_cnpj &&
                                  client.cpf_cnpj
                                    .toLowerCase()
                                    .includes(searchTerm)) ||
                                (client.profiles?.full_name &&
                                  client.profiles.full_name
                                    .toLowerCase()
                                    .includes(searchTerm))
                              );
                            }).length
                          }{" "}
                          de {allClients.length} clientes
                          {clientsSearch &&
                            ` (filtrado por "${clientsSearch}")`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar clientes..."
                            value={clientsSearch}
                            onChange={(e) => {
                              setClientsSearch(e.target.value);
                              setGlobalSearch(e.target.value);
                            }}
                            className="pl-8 w-64"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingClients ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      </div>
                    ) : allClients.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">
                          Nenhum cliente encontrado
                        </p>
                        <p className="text-muted-foreground mb-4">
                          Os clientes aparecerão aqui quando os representantes
                          criarem contratos.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>CPF/CNPJ</TableHead>
                            <TableHead>Representante</TableHead>
                            <TableHead>Data Cadastro</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allClients
                            .filter((client) => {
                              if (clientsFilter === "all") return true;
                              // Check both possible representative ID fields
                              return (
                                client.representative_id === clientsFilter ||
                                client.profiles?.id === clientsFilter
                              );
                            })
                            .slice(0, 50)
                            .map((client) => {
                              console.log("Client data for display:", {
                                id: client.id,
                                name: client.full_name || client.name,
                                representative_id: client.representative_id,
                                profiles: client.profiles,
                                representative_name: client.profiles?.full_name,
                              });
                              return (
                                <TableRow key={client.id}>
                                  <TableCell className="font-medium">
                                    {client.full_name ||
                                      client.name ||
                                      "Nome não informado"}
                                  </TableCell>
                                  <TableCell>{client.email || "-"}</TableCell>
                                  <TableCell>{client.phone || "-"}</TableCell>
                                  <TableCell>
                                    {client.cpf_cnpj || "-"}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={
                                        client.profiles?.full_name
                                          ? "text-foreground"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {client.profiles?.full_name ||
                                        "Sem representante"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {client.created_at
                                      ? new Date(
                                          client.created_at,
                                        ).toLocaleDateString("pt-BR")
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          navigate(
                                            `/cliente?clientId=${client.id}`,
                                          )
                                        }
                                        title="Acessar painel do cliente"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "collaborators" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Colaboradores
                    </h1>
                    <p className="text-muted-foreground">
                      Gerencie os usuários internos do sistema.
                    </p>
                  </div>
                  <Dialog
                    open={isNewUserDialogOpen}
                    onOpenChange={setIsNewUserDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-red-600 hover:bg-red-700">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Colaborador
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Novo Colaborador</DialogTitle>
                        <DialogDescription>
                          Adicione um novo usuário interno ao sistema.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="user-name">Nome Completo</Label>
                          <Input
                            id="user-name"
                            value={newInternalUser.name}
                            onChange={(e) =>
                              setNewInternalUser({
                                ...newInternalUser,
                                name: e.target.value,
                              })
                            }
                            placeholder="Nome do colaborador"
                          />
                        </div>
                        <div>
                          <Label htmlFor="user-email">Email</Label>
                          <Input
                            id="user-email"
                            type="email"
                            value={newInternalUser.email}
                            onChange={(e) =>
                              setNewInternalUser({
                                ...newInternalUser,
                                email: e.target.value,
                              })
                            }
                            placeholder="email@empresa.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="user-role">Função</Label>
                          <Select
                            value={newInternalUser.role}
                            onValueChange={(value) =>
                              setNewInternalUser({
                                ...newInternalUser,
                                role: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Administrador">
                                Administrador
                              </SelectItem>
                              <SelectItem value="Suporte">Suporte</SelectItem>
                              <SelectItem value="Financeiro">
                                Financeiro
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="user-password">Senha</Label>
                          <Input
                            id="user-password"
                            type="password"
                            value={newInternalUser.password}
                            onChange={(e) =>
                              setNewInternalUser({
                                ...newInternalUser,
                                password: e.target.value,
                              })
                            }
                            placeholder="Senha do usuário"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsNewUserDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              console.log(
                                "Creating internal user with data:",
                                newInternalUser,
                              );

                              // Validate required fields
                              if (
                                !newInternalUser.name ||
                                !newInternalUser.email
                              ) {
                                alert("Nome e email são obrigatórios");
                                return;
                              }

                              // Create the administrator using the new service
                              const adminData = {
                                full_name: newInternalUser.name,
                                email: newInternalUser.email,
                                phone: "", // Optional field
                                role: newInternalUser.role,
                                status: "Ativo",
                                password:
                                  newInternalUser.password || "admin123",
                              };

                              const data =
                                await administratorService.create(adminData);
                              console.log(
                                "Administrator created successfully:",
                                data,
                              );

                              // Reload internal users first to get fresh data
                              await loadInternalUsers();

                              // Then close dialog and clear form
                              setIsNewUserDialogOpen(false);
                              setNewInternalUser({
                                name: "",
                                email: "",
                                role: "Suporte",
                                password: "",
                              });

                              alert("Colaborador criado com sucesso!");
                            } catch (error) {
                              console.error(
                                "Error in create internal user:",
                                error,
                              );
                              const errorMessage =
                                error instanceof Error
                                  ? error.message
                                  : "Erro desconhecido";
                              alert(
                                `Erro ao criar colaborador: ${errorMessage}`,
                              );
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Criar Colaborador
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Colaboradores</CardTitle>
                    <CardDescription>
                      {internalUsers.length} colaboradores cadastrados no
                      sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingInternalUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Carregando colaboradores...
                        </p>
                      </div>
                    ) : internalUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">
                          Nenhum colaborador encontrado
                        </p>
                        <p className="text-muted-foreground mb-4">
                          Adicione colaboradores para gerenciar o sistema.
                        </p>
                        <Button
                          onClick={() => setIsNewUserDialogOpen(true)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Adicionar Primeiro Colaborador
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            {internalUsers.length} colaborador(es) encontrado(s)
                          </p>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Função</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Data de Criação</TableHead>
                              <TableHead className="text-right">
                                Ações
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {internalUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                  {user.name || "Nome não informado"}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{user.role}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      user.status === "Ativo"
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {user.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {user.createdAt
                                    ? new Date(
                                        user.createdAt,
                                      ).toLocaleDateString("pt-BR")
                                    : "Data não disponível"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        console.log(
                                          "Edit collaborator button clicked for:",
                                          user.name,
                                        );
                                        handleEditCollaborator(user);
                                      }}
                                      title="Editar colaborador"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        console.log(
                                          "Change password button clicked for:",
                                          user.name,
                                        );
                                        handleChangeCollaboratorPassword(user);
                                      }}
                                      title="Alterar senha"
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50"
                                    >
                                      <Key className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        console.log(
                                          "Delete collaborator button clicked for:",
                                          user.name,
                                        );
                                        handleDeleteCollaborator(user);
                                      }}
                                      title="Excluir colaborador"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>

        {/* Rejection Dialog */}
        <Dialog
          open={isRejectionDialogOpen}
          onOpenChange={setIsRejectionDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reprovar Cadastro</DialogTitle>
              <DialogDescription>
                Informe o motivo da reprovação do cadastro de{" "}
                {selectedPendingRep?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Motivo da Reprovação</Label>
                <textarea
                  id="rejection-reason"
                  className="w-full p-3 border rounded-md resize-none"
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Descreva o motivo da reprovação..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectionDialogOpen(false);
                  setRejectionReason("");
                  setSelectedPendingRep(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRejectRepresentative}
                className="bg-red-600 hover:bg-red-700"
                disabled={!rejectionReason.trim()}
              >
                Reprovar Cadastro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Representative Details Modal */}
        <Dialog
          open={isRepresentativeModalOpen}
          onOpenChange={setIsRepresentativeModalOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Representante</DialogTitle>
              <DialogDescription>
                Informações completas do representante
              </DialogDescription>
            </DialogHeader>
            {selectedRepresentativeForModal && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedRepresentativeForModal.name}`}
                    />
                    <AvatarFallback className="text-lg">
                      {selectedRepresentativeForModal.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedRepresentativeForModal.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedRepresentativeForModal.email}
                    </p>
                    <Badge
                      variant={
                        selectedRepresentativeForModal.status === "Ativo"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedRepresentativeForModal.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Telefone
                    </Label>
                    <p className="text-sm">
                      {selectedRepresentativeForModal.phone || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      CNPJ
                    </Label>
                    <p className="text-sm">
                      {selectedRepresentativeForModal.cnpj || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Razão Social
                    </Label>
                    <p className="text-sm">
                      {selectedRepresentativeForModal.razao_social ||
                        "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Ponto de Venda
                    </Label>
                    <p className="text-sm">
                      {selectedRepresentativeForModal.ponto_venda ||
                        "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Código de Comissão
                    </Label>
                    <p className="text-sm">
                      {selectedRepresentativeForModal.commission_code ||
                        "Não gerado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Data de Cadastro
                    </Label>
                    <p className="text-sm">
                      {new Date(
                        selectedRepresentativeForModal.created_at,
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                {/* Documents Section */}
                {representativeDocuments[selectedRepresentativeForModal.id] && (
                  <div>
                    <h4 className="font-medium mb-3">Documentos</h4>
                    <div className="space-y-3">
                      {representativeDocuments[
                        selectedRepresentativeForModal.id
                      ].map((doc) => (
                        <div
                          key={`${doc.isLegacy ? "legacy" : "new"}-${doc.id}`}
                          className="p-4 border rounded-lg bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-gray-600" />
                                <p className="font-medium">
                                  {doc.document_type}
                                </p>
                                {doc.isLegacy && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Legacy
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Enviado em{" "}
                                {new Date(
                                  doc.uploaded_at || doc.created_at,
                                ).toLocaleDateString("pt-BR")}
                              </p>
                              {doc.file_url && (
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  Ver documento
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  doc.status === "Aprovado"
                                    ? "default"
                                    : doc.status === "Reprovado"
                                      ? "destructive"
                                      : "outline"
                                }
                              >
                                {doc.status}
                              </Badge>
                            </div>
                          </div>

                          {doc.status === "Pendente" && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => handleApproveDocument(doc)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setIsDocumentRejectionDialogOpen(true);
                                }}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reprovar
                              </Button>
                            </div>
                          )}

                          {doc.status === "Reprovado" &&
                            doc.rejection_reason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-sm text-red-800">
                                  <strong>Motivo da reprovação:</strong>{" "}
                                  {doc.rejection_reason}
                                </p>
                              </div>
                            )}

                          {doc.status === "Aprovado" && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <p className="text-sm text-green-800">
                                ✓ Documento aprovado
                              </p>
                            </div>
                          )}
                        </div>
                      ))}

                      {representativeDocuments[
                        selectedRepresentativeForModal.id
                      ].length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p>Nenhum documento enviado ainda</p>
                        </div>
                      )}
                    </div>

                    {/* Document Summary */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">
                        Status dos Documentos
                      </h5>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {
                              representativeDocuments[
                                selectedRepresentativeForModal.id
                              ].filter((d) => d.status === "Pendente").length
                            }
                          </div>
                          <div className="text-blue-700">Pendentes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {
                              representativeDocuments[
                                selectedRepresentativeForModal.id
                              ].filter((d) => d.status === "Aprovado").length
                            }
                          </div>
                          <div className="text-green-700">Aprovados</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">
                            {
                              representativeDocuments[
                                selectedRepresentativeForModal.id
                              ].filter((d) => d.status === "Reprovado").length
                            }
                          </div>
                          <div className="text-red-700">Reprovados</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                {selectedRepresentativeForModal?.status ===
                  "Pendente de Aprovação" && (
                  <>
                    <Button
                      onClick={() =>
                        handleApproveRepresentative(
                          selectedRepresentativeForModal,
                        )
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Aprovar Representante
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPendingRep(selectedRepresentativeForModal);
                        setIsRejectionDialogOpen(true);
                      }}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Reprovar
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setIsRepresentativeModalOpen(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Rejection Dialog */}
        <Dialog
          open={isDocumentRejectionDialogOpen}
          onOpenChange={setIsDocumentRejectionDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reprovar Documento</DialogTitle>
              <DialogDescription>
                Informe o motivo da reprovação do documento{" "}
                {selectedDocument?.document_type}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="document-rejection-reason">
                  Motivo da Reprovação
                </Label>
                <textarea
                  id="document-rejection-reason"
                  className="w-full p-3 border rounded-md resize-none"
                  rows={4}
                  value={documentRejectionReason}
                  onChange={(e) => setDocumentRejectionReason(e.target.value)}
                  placeholder="Descreva o motivo da reprovação do documento..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDocumentRejectionDialogOpen(false);
                  setDocumentRejectionReason("");
                  setSelectedDocument(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRejectDocument}
                className="bg-red-600 hover:bg-red-700"
                disabled={!documentRejectionReason.trim()}
              >
                Reprovar Documento
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
                Atualize os dados do representante {editingRepresentative?.name}
                .
              </DialogDescription>
            </DialogHeader>
            {editingRepresentative && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nome Completo *</Label>
                    <Input
                      id="edit-name"
                      value={editingRepresentative.name}
                      onChange={(e) =>
                        setEditingRepresentative({
                          ...editingRepresentative,
                          name: e.target.value,
                        })
                      }
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingRepresentative.email}
                      onChange={(e) =>
                        setEditingRepresentative({
                          ...editingRepresentative,
                          email: e.target.value,
                        })
                      }
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-phone">Telefone</Label>
                    <Input
                      id="edit-phone"
                      value={editingRepresentative.phone || ""}
                      onChange={(e) =>
                        setEditingRepresentative({
                          ...editingRepresentative,
                          phone: e.target.value,
                        })
                      }
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-cnpj">CNPJ</Label>
                    <Input
                      id="edit-cnpj"
                      value={formatCpfCnpj(editingRepresentative.cnpj || "")}
                      onChange={(e) =>
                        setEditingRepresentative({
                          ...editingRepresentative,
                          cnpj: e.target.value,
                        })
                      }
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-razao-social">Razão Social</Label>
                    <Input
                      id="edit-razao-social"
                      value={editingRepresentative.razao_social || ""}
                      onChange={(e) =>
                        setEditingRepresentative({
                          ...editingRepresentative,
                          razao_social: e.target.value,
                        })
                      }
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-ponto-venda">Ponto de Venda</Label>
                    <Input
                      id="edit-ponto-venda"
                      value={editingRepresentative.ponto_venda || ""}
                      onChange={(e) =>
                        setEditingRepresentative({
                          ...editingRepresentative,
                          ponto_venda: e.target.value,
                        })
                      }
                      placeholder="Local de vendas"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingRepresentative.status}
                    onValueChange={(value) =>
                      setEditingRepresentative({
                        ...editingRepresentative,
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
                      <SelectItem value="Pausado">Pausado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditRepDialogOpen(false);
                  setEditingRepresentative(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateRepresentative}
                className="bg-red-600 hover:bg-red-700"
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Change Dialog */}
        <Dialog
          open={isPasswordChangeDialogOpen}
          onOpenChange={setIsPasswordChangeDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Alterar Senha</DialogTitle>
              <DialogDescription>
                Defina uma nova senha para{" "}
                {representativeForPasswordChange?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-password" className="text-right">
                  Nova Senha
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="new-password"
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1"
                    placeholder="Digite ou gere uma nova senha"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePasswordForEdit}
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
                  setIsPasswordChangeDialogOpen(false);
                  setRepresentativeForPasswordChange(null);
                  setNewPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handlePasswordUpdate} disabled={!newPassword}>
                Alterar Senha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Representative Dialog */}
        <AlertDialog
          open={isDeleteRepDialogOpen}
          onOpenChange={setIsDeleteRepDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Representante</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o representante{" "}
                <strong>{deletingRepresentative?.name}</strong>?
                <br />
                <br />
                Esta ação não pode ser desfeita. Se o representante possuir
                contratos ativos, você será direcionado para transferi-los antes
                da exclusão.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-password">Senha do Administrador</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Digite a senha do administrador"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setIsDeleteRepDialogOpen(false);
                  setDeletingRepresentative(null);
                  setAdminPassword("");
                }}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteRepresentative}
                className="bg-red-600 hover:bg-red-700"
                disabled={!adminPassword.trim()}
              >
                Excluir Representante
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Contract Transfer Dialog */}
        <Dialog
          open={isContractTransferDialogOpen}
          onOpenChange={setIsContractTransferDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transferir Contratos</DialogTitle>
              <DialogDescription>
                O representante <strong>{deletingRepresentative?.name}</strong>{" "}
                possui <strong>{representativeContracts.length}</strong>{" "}
                contrato(s) ativo(s). Escolha para onde transferir estes
                contratos antes de excluir o representante.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Contracts List */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Contratos que serão transferidos:
                </Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-3 bg-gray-50">
                  {representativeContracts.map((contract: any) => (
                    <div
                      key={contract.id}
                      className="flex justify-between items-center py-1 text-sm"
                    >
                      <span className="font-medium">
                        {contract.contract_number ||
                          contract.contract_code ||
                          `CONT-${contract.id}`}
                      </span>
                      <span className="text-muted-foreground">
                        {contract.clients?.full_name ||
                          contract.clients?.name ||
                          "Cliente não encontrado"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {contract.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transfer Options */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Selecione o destino dos contratos:
                </Label>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="transfer-admin"
                      name="transfer-option"
                      value="admin"
                      checked={transferOption === "admin"}
                      onChange={(e) => {
                        setTransferOption(e.target.value as "admin");
                        setSelectedTransferRepresentative("");
                      }}
                    />
                    <Label htmlFor="transfer-admin" className="cursor-pointer">
                      Transferir para o Administrador do Sistema
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="transfer-representative"
                      name="transfer-option"
                      value="representative"
                      checked={transferOption === "representative"}
                      onChange={(e) => {
                        setTransferOption(e.target.value as "representative");
                      }}
                    />
                    <Label
                      htmlFor="transfer-representative"
                      className="cursor-pointer"
                    >
                      Transferir para outro Representante
                    </Label>
                  </div>
                </div>

                {/* Representative Selection */}
                {transferOption === "representative" && (
                  <div className="ml-6">
                    <Label
                      htmlFor="select-representative"
                      className="text-sm font-medium mb-2 block"
                    >
                      Selecione o representante:
                    </Label>
                    <Select
                      value={selectedTransferRepresentative}
                      onValueChange={setSelectedTransferRepresentative}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um representante" />
                      </SelectTrigger>
                      <SelectContent>
                        {representatives
                          .filter(
                            (rep) =>
                              rep.id !== deletingRepresentative?.id &&
                              rep.status === "Ativo",
                          )
                          .map((rep) => (
                            <SelectItem key={rep.id} value={rep.id}>
                              {rep.name} - {rep.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsContractTransferDialogOpen(false);
                  setDeletingRepresentative(null);
                  setTransferOption("");
                  setSelectedTransferRepresentative("");
                  setRepresentativeContracts([]);
                  setAdminPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleContractTransfer}
                className="bg-red-600 hover:bg-red-700"
                disabled={
                  !transferOption ||
                  (transferOption === "representative" &&
                    !selectedTransferRepresentative)
                }
              >
                Transferir e Excluir Representante
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contract Details Modal */}
        <Dialog
          open={isContractModalOpen}
          onOpenChange={setIsContractModalOpen}
        >
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
        {/* Edit Plan Dialog */}
        <Dialog
          open={isEditPlanDialogOpen}
          onOpenChange={setIsEditPlanDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Plano de Comissão</DialogTitle>
              <DialogDescription>
                Atualize as informações do plano de financiamento.
              </DialogDescription>
            </DialogHeader>
            {editingPlan && (
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="edit-plan-name">Nome do Plano *</Label>
                  <Input
                    id="edit-plan-name"
                    value={editingPlan.nome}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        nome: e.target.value,
                      })
                    }
                    placeholder="Ex: Plano A"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-plan-description">Descrição</Label>
                  <Input
                    id="edit-plan-description"
                    value={editingPlan.descricao || ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        descricao: e.target.value,
                      })
                    }
                    placeholder="Ex: Compra Programada 80X"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-plan-active"
                    checked={editingPlan.ativo}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        ativo: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="edit-plan-active">Plano ativo</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditPlanDialogOpen(false);
                  setEditingPlan(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdatePlan}
                className="bg-red-600 hover:bg-red-700"
              >
                Atualizar Plano
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Plan Dialog */}
        <Dialog
          open={isManagePlanDialogOpen}
          onOpenChange={setIsManagePlanDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Plano: {selectedPlan?.nome}</DialogTitle>
              <DialogDescription>
                Configure as faixas de crédito, condições de parcelas e
                antecipação para este plano.
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-6">
                {/* Plan Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedPlan.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan.descricao}
                  </p>
                  <Badge
                    variant={selectedPlan.ativo ? "default" : "secondary"}
                    className="mt-2"
                  >
                    {selectedPlan.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                {/* Credit Ranges */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Faixas de Crédito</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsNewCreditRangeDialogOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Adicionar Faixa
                    </Button>
                  </div>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Valor do Crédito</TableHead>
                          <TableHead>Valor Restante</TableHead>
                          <TableHead>Parcelas</TableHead>
                          <TableHead>Antecipações</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditRanges
                          .filter((range) => range.plano_id === selectedPlan.id)
                          .map((range) => {
                            const rangeInstallments =
                              installmentConditions.filter(
                                (inst) => inst.faixa_credito_id === range.id,
                              );
                            const rangeAnticipations =
                              anticipationConditions.filter(
                                (ant) => ant.faixa_credito_id === range.id,
                              );
                            return (
                              <TableRow key={range.id}>
                                <TableCell className="font-medium">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(range.valor_credito)}
                                </TableCell>
                                <TableCell>
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(range.valor_restante)}
                                </TableCell>
                                <TableCell>
                                  {rangeInstallments.length}
                                </TableCell>
                                <TableCell>
                                  {rangeAnticipations.length}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleManageInstallments(range)
                                      }
                                      title="Gerenciar Parcelas"
                                    >
                                      <Hash className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleManageAnticipations(range)
                                      }
                                      title="Gerenciar Antecipações"
                                    >
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteCreditRange(range.id)
                                      }
                                      className="text-red-600 hover:text-red-700"
                                      title="Excluir Faixa"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        {creditRanges.filter(
                          (range) => range.plano_id === selectedPlan.id,
                        ).length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Nenhuma faixa de crédito configurada para este
                              plano.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {
                        creditRanges.filter(
                          (range) => range.plano_id === selectedPlan.id,
                        ).length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Faixas de Crédito
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {
                        installmentConditions.filter((inst) =>
                          creditRanges.some(
                            (range) =>
                              range.plano_id === selectedPlan.id &&
                              range.id === inst.faixa_credito_id,
                          ),
                        ).length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Condições de Parcelas
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {
                        anticipationConditions.filter((ant) =>
                          creditRanges.some(
                            (range) =>
                              range.plano_id === selectedPlan.id &&
                              range.id === ant.faixa_credito_id,
                          ),
                        ).length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Condições de Antecipação
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsManagePlanDialogOpen(false);
                  setSelectedPlan(null);
                }}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Change Confirmation Dialog */}
        <AlertDialog
          open={isStatusChangeDialogOpen}
          onOpenChange={setIsStatusChangeDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alterar Status do Contrato</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja alterar o status do contrato{" "}
                <strong>
                  {selectedContractForStatusChange?.contract_number ||
                    selectedContractForStatusChange?.contract_code ||
                    `CONT-${selectedContractForStatusChange?.id}`}
                </strong>{" "}
                de <strong>{selectedContractForStatusChange?.status}</strong>{" "}
                para <strong>{newContractStatus}</strong>?
                <br />
                <br />
                {(newContractStatus === "Aprovado" ||
                  newContractStatus === "Ativo") && (
                  <span className="text-amber-600">
                    <strong>Atenção:</strong> Após aprovado, o contrato só
                    poderá ser editado por administradores.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setIsStatusChangeDialogOpen(false);
                  setSelectedContractForStatusChange(null);
                  setNewContractStatus("");
                }}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmStatusChange}
                className={
                  newContractStatus === "Reprovado"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }
              >
                Confirmar Alteração
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* New Credit Range Dialog */}
        <Dialog
          open={isNewCreditRangeDialogOpen}
          onOpenChange={setIsNewCreditRangeDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Faixa de Crédito</DialogTitle>
              <DialogDescription>
                Configure uma nova faixa de crédito para o plano{" "}
                {selectedPlan?.nome}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="credit-value">Valor do Crédito *</Label>
                <Input
                  id="credit-value"
                  type="number"
                  step="0.01"
                  value={newCreditRange.valor_credito}
                  onChange={(e) =>
                    setNewCreditRange({
                      ...newCreditRange,
                      valor_credito: e.target.value,
                    })
                  }
                  placeholder="Ex: 20000.00"
                />
              </div>
              <div>
                <Label htmlFor="first-installment-value">
                  Valor da Primeira Parcela *
                </Label>
                <Input
                  id="first-installment-value"
                  type="number"
                  step="0.01"
                  value={newCreditRange.valor_primeira_parcela}
                  onChange={(e) =>
                    setNewCreditRange({
                      ...newCreditRange,
                      valor_primeira_parcela: e.target.value,
                    })
                  }
                  placeholder="Ex: 2000.00"
                />
              </div>
              <div>
                <Label htmlFor="remaining-installments-value">
                  Valor das Parcelas Restantes *
                </Label>
                <Input
                  id="remaining-installments-value"
                  type="number"
                  step="0.01"
                  value={newCreditRange.valor_parcelas_restantes}
                  onChange={(e) =>
                    setNewCreditRange({
                      ...newCreditRange,
                      valor_parcelas_restantes: e.target.value,
                    })
                  }
                  placeholder="Ex: 250.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewCreditRangeDialogOpen(false);
                  setNewCreditRange({
                    valor_credito: "",
                    valor_primeira_parcela: "",
                    valor_parcelas_restantes: "",
                  });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCreditRange}
                className="bg-red-600 hover:bg-red-700"
              >
                Criar Faixa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Installments Dialog */}
        <Dialog
          open={isManageInstallmentsDialogOpen}
          onOpenChange={setIsManageInstallmentsDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Parcelas</DialogTitle>
              <DialogDescription>
                Configure as condições de parcelas para a faixa de crédito de{" "}
                {selectedRangeForInstallments &&
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(selectedRangeForInstallments.valor_credito)}
                .
              </DialogDescription>
            </DialogHeader>
            {selectedRangeForInstallments && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Condições de Parcelas</h4>
                  <Button
                    size="sm"
                    onClick={() => setIsNewInstallmentDialogOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Parcela
                  </Button>
                </div>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número da Parcela</TableHead>
                        <TableHead>Valor da Parcela</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installmentConditions
                        .filter(
                          (inst) =>
                            inst.faixa_credito_id ===
                            selectedRangeForInstallments.id,
                        )
                        .sort((a, b) => a.numero_parcela - b.numero_parcela)
                        .map((installment) => (
                          <TableRow key={installment.id}>
                            <TableCell className="font-medium">
                              {installment.numero_parcela}ª parcela
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(installment.valor_parcela)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteInstallment(installment.id)
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      {installmentConditions.filter(
                        (inst) =>
                          inst.faixa_credito_id ===
                          selectedRangeForInstallments.id,
                      ).length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Nenhuma condição de parcela configurada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsManageInstallmentsDialogOpen(false);
                  setSelectedRangeForInstallments(null);
                }}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Installment Dialog */}
        <Dialog
          open={isNewInstallmentDialogOpen}
          onOpenChange={setIsNewInstallmentDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Condição de Parcela</DialogTitle>
              <DialogDescription>
                Configure uma nova condição de parcela.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="installment-number">Número da Parcela *</Label>
                <Input
                  id="installment-number"
                  type="number"
                  value={newInstallment.numero_parcela}
                  onChange={(e) =>
                    setNewInstallment({
                      ...newInstallment,
                      numero_parcela: e.target.value,
                    })
                  }
                  placeholder="Ex: 1"
                />
              </div>
              <div>
                <Label htmlFor="installment-value">Valor da Parcela *</Label>
                <Input
                  id="installment-value"
                  type="number"
                  step="0.01"
                  value={newInstallment.valor_parcela}
                  onChange={(e) =>
                    setNewInstallment({
                      ...newInstallment,
                      valor_parcela: e.target.value,
                    })
                  }
                  placeholder="Ex: 2000.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewInstallmentDialogOpen(false);
                  setNewInstallment({ numero_parcela: "", valor_parcela: "" });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateInstallment}
                className="bg-red-600 hover:bg-red-700"
              >
                Criar Parcela
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Anticipations Dialog */}
        <Dialog
          open={isManageAnticipationsDialogOpen}
          onOpenChange={setIsManageAnticipationsDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Antecipações</DialogTitle>
              <DialogDescription>
                Configure as condições de antecipação para a faixa de crédito de{" "}
                {selectedRangeForAnticipations &&
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(selectedRangeForAnticipations.valor_credito)}
                .
              </DialogDescription>
            </DialogHeader>
            {selectedRangeForAnticipations && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Condições de Antecipação</h4>
                  <Button
                    size="sm"
                    onClick={() => setIsNewAnticipationDialogOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Antecipação
                  </Button>
                </div>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Percentual</TableHead>
                        <TableHead>Valor Calculado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anticipationConditions
                        .filter(
                          (ant) =>
                            ant.faixa_credito_id ===
                            selectedRangeForAnticipations.id,
                        )
                        .sort((a, b) => a.percentual - b.percentual)
                        .map((anticipation) => (
                          <TableRow key={anticipation.id}>
                            <TableCell className="font-medium">
                              {anticipation.percentual}%
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(anticipation.valor_calculado)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteAnticipation(anticipation.id)
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      {anticipationConditions.filter(
                        (ant) =>
                          ant.faixa_credito_id ===
                          selectedRangeForAnticipations.id,
                      ).length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Nenhuma condição de antecipação configurada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsManageAnticipationsDialogOpen(false);
                  setSelectedRangeForAnticipations(null);
                }}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Anticipation Dialog */}
        <Dialog
          open={isNewAnticipationDialogOpen}
          onOpenChange={setIsNewAnticipationDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Condição de Antecipação</DialogTitle>
              <DialogDescription>
                Configure uma nova condição de antecipação.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="anticipation-percentage">Percentual *</Label>
                <Input
                  id="anticipation-percentage"
                  type="number"
                  value={newAnticipation.percentual}
                  onChange={(e) =>
                    setNewAnticipation({
                      ...newAnticipation,
                      percentual: e.target.value,
                    })
                  }
                  placeholder="Ex: 20"
                />
              </div>
              <div>
                <Label htmlFor="anticipation-value">Valor Calculado *</Label>
                <Input
                  id="anticipation-value"
                  type="number"
                  step="0.01"
                  value={newAnticipation.valor_calculado}
                  onChange={(e) =>
                    setNewAnticipation({
                      ...newAnticipation,
                      valor_calculado: e.target.value,
                    })
                  }
                  placeholder="Ex: 4000.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewAnticipationDialogOpen(false);
                  setNewAnticipation({ percentual: "", valor_calculado: "" });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAnticipation}
                className="bg-red-600 hover:bg-red-700"
              >
                Criar Antecipação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Collaborator Dialog */}
        <Dialog
          open={isEditCollaboratorDialogOpen}
          onOpenChange={setIsEditCollaboratorDialogOpen}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Colaborador</DialogTitle>
              <DialogDescription>
                Atualize os dados do colaborador {editingCollaborator?.name}.
              </DialogDescription>
            </DialogHeader>
            {editingCollaborator && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-collaborator-name">
                      Nome Completo *
                    </Label>
                    <Input
                      id="edit-collaborator-name"
                      value={editingCollaborator.name}
                      onChange={(e) =>
                        setEditingCollaborator({
                          ...editingCollaborator,
                          name: e.target.value,
                        })
                      }
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-collaborator-email">Email *</Label>
                    <Input
                      id="edit-collaborator-email"
                      type="email"
                      value={editingCollaborator.email}
                      onChange={(e) =>
                        setEditingCollaborator({
                          ...editingCollaborator,
                          email: e.target.value,
                        })
                      }
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-collaborator-role">Função</Label>
                    <Select
                      value={editingCollaborator.role}
                      onValueChange={(value) =>
                        setEditingCollaborator({
                          ...editingCollaborator,
                          role: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administrador">
                          Administrador
                        </SelectItem>
                        <SelectItem value="Suporte">Suporte</SelectItem>
                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-collaborator-status">Status</Label>
                    <Select
                      value={editingCollaborator.status}
                      onValueChange={(value) =>
                        setEditingCollaborator({
                          ...editingCollaborator,
                          status: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditCollaboratorDialogOpen(false);
                  setEditingCollaborator(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateCollaborator}
                className="bg-red-600 hover:bg-red-700"
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Collaborator Password Change Dialog */}
        <Dialog
          open={isCollaboratorPasswordChangeDialogOpen}
          onOpenChange={setIsCollaboratorPasswordChangeDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Alterar Senha do Colaborador</DialogTitle>
              <DialogDescription>
                Defina uma nova senha para {collaboratorForPasswordChange?.name}
                .
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="new-collaborator-password"
                  className="text-right"
                >
                  Nova Senha
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="new-collaborator-password"
                    type="text"
                    value={newCollaboratorPassword}
                    onChange={(e) => setNewCollaboratorPassword(e.target.value)}
                    className="flex-1"
                    placeholder="Digite ou gere uma nova senha"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePasswordForCollaborator}
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
                  setIsCollaboratorPasswordChangeDialogOpen(false);
                  setCollaboratorForPasswordChange(null);
                  setNewCollaboratorPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCollaboratorPasswordUpdate}
                disabled={!newCollaboratorPassword}
                className="bg-red-600 hover:bg-red-700"
              >
                Alterar Senha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Collaborator Dialog */}
        <Dialog
          open={isDeleteCollaboratorDialogOpen}
          onOpenChange={setIsDeleteCollaboratorDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Colaborador</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o colaborador{" "}
                <strong>{deletingCollaborator?.name}</strong>?
                <br />
                <br />
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="collaborator-admin-password">
                  Senha do Administrador
                </Label>
                <Input
                  id="collaborator-admin-password"
                  type="password"
                  value={collaboratorAdminPassword}
                  onChange={(e) => setCollaboratorAdminPassword(e.target.value)}
                  placeholder="Digite a senha do administrador"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteCollaboratorDialogOpen(false);
                  setDeletingCollaborator(null);
                  setCollaboratorAdminPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDeleteCollaborator}
                className="bg-red-600 hover:bg-red-700"
                disabled={!collaboratorAdminPassword.trim()}
              >
                Excluir Colaborador
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Quotas Dialog */}
        <Dialog
          open={isManageQuotasDialogOpen}
          onOpenChange={setIsManageQuotasDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Cotas - {selectedGroup?.name}</DialogTitle>
              <DialogDescription>
                Visualize e gerencie as cotas do grupo selecionado.
              </DialogDescription>
            </DialogHeader>
            {selectedGroup && (
              <div className="space-y-6">
                {/* Group Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedGroup.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedGroup.description}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span>
                      Total: <strong>{selectedGroup.total_quotas}</strong>
                    </span>
                    <span className="text-green-600">
                      Disponíveis:{" "}
                      <strong>{selectedGroup.available_quotas}</strong>
                    </span>
                    <span className="text-red-600">
                      Ocupadas: <strong>{selectedGroup.occupied_quotas}</strong>
                    </span>
                  </div>
                </div>

                {/* Quotas Table */}
                <div>
                  <h4 className="font-semibold mb-4">Cotas do Grupo</h4>
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Representante</TableHead>
                          <TableHead>Data Atribuição</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotas
                          .filter(
                            (quota: any) => quota.group_id === selectedGroup.id,
                          )
                          .sort(
                            (a: any, b: any) => a.quota_number - b.quota_number,
                          )
                          .map((quota: any) => (
                            <TableRow key={quota.id}>
                              <TableCell className="font-medium">
                                Cota {quota.quota_number}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    quota.status === "Disponível"
                                      ? "outline"
                                      : quota.status === "Ocupada"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {quota.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {quota.profiles?.full_name || "-"}
                              </TableCell>
                              <TableCell>
                                {quota.assigned_at
                                  ? new Date(
                                      quota.assigned_at,
                                    ).toLocaleDateString("pt-BR")
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                {quota.status === "Ocupada" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const confirmRelease = window.confirm(
                                        `Tem certeza que deseja liberar a Cota ${quota.quota_number}?`,
                                      );
                                      if (!confirmRelease) return;

                                      try {
                                        const { error } = await supabase
                                          .from("quotas")
                                          .update({
                                            status: "Disponível",
                                            representative_id: null,
                                            assigned_at: null,
                                            contract_id: null,
                                            updated_at:
                                              new Date().toISOString(),
                                          })
                                          .eq("id", quota.id);

                                        if (error) throw error;

                                        await loadGroups();
                                        alert("Cota liberada com sucesso!");
                                      } catch (error) {
                                        console.error(
                                          "Error releasing quota:",
                                          error,
                                        );
                                        alert(
                                          "Erro ao liberar cota. Tente novamente.",
                                        );
                                      }
                                    }}
                                    className="text-orange-600 hover:text-orange-700"
                                  >
                                    Liberar
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsManageQuotasDialogOpen(false);
                  setSelectedGroup(null);
                }}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Form>
  );
};

export default AdminDashboard;
