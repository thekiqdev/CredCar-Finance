import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createSupabaseClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
);

// Representative types based on profiles table
export interface Representative {
  id: string;
  full_name: string;
  name: string; // alias for full_name for compatibility
  email: string;
  phone?: string;
  cnpj?: string;
  company_name?: string;
  razao_social?: string; // alias for company_name
  point_of_sale?: string;
  ponto_venda?: string; // alias for point_of_sale
  commission_code?: string;
  role: string;
  status: Database["public"]["Enums"]["user_status"];

  total_sales: number;
  contracts_count: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateRepresentativeData {
  name: string;
  email: string;
  phone?: string;
  cnpj?: string;
  razao_social?: string;
  ponto_venda?: string;
  password: string;
  status?: Database["public"]["Enums"]["user_status"];
}

// Representative functions
export const representativeService = {
  // Get all representatives from profiles table
  async getAll(): Promise<Representative[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "Representante")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((profile) => ({
      ...profile,
      name: profile.full_name,
      razao_social: profile.company_name,
      ponto_venda: profile.point_of_sale,
      total_sales: 0,
      contracts_count: 0,
      updated_at: profile.created_at,
    }));
  },

  // Get pending registrations from profiles table
  async getPendingRegistrations(): Promise<Representative[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "Representante")
      .eq("status", "Pendente de Aprovação")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((profile) => ({
      ...profile,
      name: profile.full_name,
      razao_social: profile.company_name,
      ponto_venda: profile.point_of_sale,
      total_sales: 0,
      contracts_count: 0,
      updated_at: profile.created_at,
    }));
  },

  // Get representative by ID from profiles table
  async getById(id: string): Promise<Representative | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("role", "Representante")
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return {
      ...data,
      name: data.full_name,
      razao_social: data.company_name,
      ponto_venda: data.point_of_sale,
      total_sales: 0,
      contracts_count: 0,
      updated_at: data.created_at,
    };
  },

  // Get representative by email from profiles table
  async getByEmail(email: string): Promise<Representative | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .eq("role", "Representante")
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return {
      ...data,
      name: data.full_name,
      razao_social: data.company_name,
      ponto_venda: data.point_of_sale,
      total_sales: 0,
      contracts_count: 0,
      updated_at: data.created_at,
    };
  },

  // Create new representative in profiles table
  async create(
    representativeData: CreateRepresentativeData,
  ): Promise<Representative> {
    try {
      console.log(
        "Starting representative creation with data:",
        representativeData,
      );

      // Check if email already exists
      try {
        const existingUser = await this.getByEmail(representativeData.email);
        if (existingUser) {
          throw new Error("Email já está em uso");
        }
      } catch (emailCheckError) {
        console.error("Error checking existing email:", emailCheckError);
        if (
          emailCheckError instanceof Error &&
          emailCheckError.message === "Email já está em uso"
        ) {
          throw emailCheckError;
        }
        // Continue if it's just a "not found" error
      }

      // Generate a proper UUID for the new profile
      const profileId = crypto.randomUUID();
      console.log("Generated profile ID:", profileId);

      // Prepare the insert data with proper field mapping
      const insertData = {
        id: profileId,
        full_name: representativeData.name,
        email: representativeData.email,
        phone: representativeData.phone || null,
        cnpj: representativeData.cnpj || null,
        company_name: representativeData.razao_social || null,
        point_of_sale: representativeData.ponto_venda || null,
        role: "Representante",
        status:
          (representativeData.status as Database["public"]["Enums"]["user_status"]) ||
          "Ativo",
      };

      console.log("Inserting profile data:", insertData);

      const { data, error } = await supabase
        .from("profiles")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Database insert error:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(
          `Erro ao inserir no banco de dados: ${error.message} (Código: ${error.code})`,
        );
      }

      if (!data) {
        console.error("No data returned after insert");
        throw new Error("Nenhum dado retornado após inserção");
      }

      console.log("Profile inserted successfully:", data);

      // Generate commission code after creation
      const commissionCode = `PV-${data.id.substring(0, 8).toUpperCase()}`;
      console.log("Generated commission code:", commissionCode);

      const { data: updatedData, error: updateError } = await supabase
        .from("profiles")
        .update({ commission_code: commissionCode })
        .eq("id", data.id)
        .select()
        .single();

      if (updateError) {
        console.error("Commission code update error:", updateError);
        console.error("Update error details:", {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        });
        throw new Error(
          `Erro ao atualizar código de comissão: ${updateError.message} (Código: ${updateError.code})`,
        );
      }

      if (!updatedData) {
        console.error("No data returned after commission code update");
        throw new Error(
          "Nenhum dado retornado após atualização do código de comissão",
        );
      }

      console.log("Representative created successfully:", updatedData);

      return {
        ...updatedData,
        name: updatedData.full_name,
        razao_social: updatedData.company_name,
        ponto_venda: updatedData.point_of_sale,
        total_sales: 0,
        contracts_count: 0,
        updated_at: updatedData.created_at,
      };
    } catch (error) {
      console.error("Error in create representative:", error);
      if (error instanceof Error) {
        console.error("Known error:", error.message);
        throw error;
      }
      console.error("Unknown error type:", typeof error, error);
      throw new Error(
        `Erro desconhecido ao criar representante: ${String(error)}`,
      );
    }
  },

  // Create public registration in profiles table
  async createPublicRegistration(registrationData: {
    name: string;
    email: string;
    phone?: string;
    cnpj?: string;
    razao_social?: string;
    ponto_venda?: string;
    password: string;
  }): Promise<Representative> {
    try {
      console.log("Starting public registration with data:", registrationData);

      // Check if email already exists
      try {
        const existingUser = await this.getByEmail(registrationData.email);
        if (existingUser) {
          throw new Error("Email já está em uso");
        }
      } catch (emailCheckError) {
        console.error("Error checking existing email:", emailCheckError);
        if (
          emailCheckError instanceof Error &&
          emailCheckError.message === "Email já está em uso"
        ) {
          throw emailCheckError;
        }
        // Continue if it's just a "not found" error
      }

      // Generate a proper UUID for the new profile
      const profileId = crypto.randomUUID();
      console.log("Generated profile ID for public registration:", profileId);

      // Prepare the insert data with proper field mapping
      const insertData = {
        id: profileId,
        full_name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phone || null,
        cnpj: registrationData.cnpj || null,
        company_name: registrationData.razao_social || null,
        point_of_sale: registrationData.ponto_venda || null,
        role: "Representante",
        status:
          "Pendente de Aprovação" as Database["public"]["Enums"]["user_status"],
      };

      console.log("Inserting public registration data:", insertData);

      const { data, error } = await supabase
        .from("profiles")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Database insert error (public registration):", error);
        console.error("Public registration error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(
          `Erro ao inserir registro público: ${error.message} (Código: ${error.code})`,
        );
      }

      if (!data) {
        console.error("No data returned after public registration insert");
        throw new Error(
          "Nenhum dado retornado após inserção do registro público",
        );
      }

      console.log("Public registration inserted successfully:", data);

      return {
        ...data,
        name: data.full_name,
        razao_social: data.company_name,
        ponto_venda: data.point_of_sale,
        total_sales: 0,
        contracts_count: 0,
        updated_at: data.created_at,
      };
    } catch (error) {
      console.error("Error in createPublicRegistration:", error);
      if (error instanceof Error) {
        console.error("Known public registration error:", error.message);
        throw error;
      }
      console.error(
        "Unknown public registration error type:",
        typeof error,
        error,
      );
      throw new Error(
        `Erro desconhecido ao criar registro público: ${String(error)}`,
      );
    }
  },

  // Approve registration in profiles table
  async approveRegistration(id: string): Promise<Representative> {
    try {
      const commissionCode = `PV-${id.substring(0, 8).toUpperCase()}`;

      const { data, error } = await supabase
        .from("profiles")
        .update({
          status:
            "Documentos Pendentes" as Database["public"]["Enums"]["user_status"],
          commission_code: commissionCode,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Database approve registration error:", error);
        throw new Error(`Erro ao aprovar registro: ${error.message}`);
      }

      if (!data) {
        throw new Error("Nenhum dado retornado após aprovação");
      }

      return {
        ...data,
        name: data.full_name,
        razao_social: data.company_name,
        ponto_venda: data.point_of_sale,
        total_sales: 0,
        contracts_count: 0,
        updated_at: data.created_at,
      };
    } catch (error) {
      console.error("Error in approveRegistration:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro desconhecido ao aprovar registro");
    }
  },

  // Update representative in profiles table
  async update(
    id: string,
    updates: Partial<Representative>,
  ): Promise<Representative> {
    try {
      // Map the updates to the correct profile fields
      const profileUpdates: any = {};
      if (updates.name || updates.full_name) {
        profileUpdates.full_name = updates.name || updates.full_name;
      }
      if (updates.email) profileUpdates.email = updates.email;
      if (updates.phone !== undefined)
        profileUpdates.phone = updates.phone || null;
      if (updates.cnpj !== undefined)
        profileUpdates.cnpj = updates.cnpj || null;
      if (updates.razao_social || updates.company_name) {
        profileUpdates.company_name =
          updates.razao_social || updates.company_name || null;
      }
      if (updates.ponto_venda || updates.point_of_sale) {
        profileUpdates.point_of_sale =
          updates.ponto_venda || updates.point_of_sale || null;
      }
      if (updates.commission_code)
        profileUpdates.commission_code = updates.commission_code;
      if (updates.status) profileUpdates.status = updates.status;

      console.log("Updating profile with data:", profileUpdates);

      const { data, error } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Database update error:", error);
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      }

      if (!data) {
        throw new Error("Nenhum dado retornado após atualização");
      }

      return {
        ...data,
        name: data.full_name,
        razao_social: data.company_name,
        ponto_venda: data.point_of_sale,
        total_sales: 0,
        contracts_count: 0,
        updated_at: data.created_at,
      };
    } catch (error) {
      console.error("Error in update representative:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro desconhecido ao atualizar representante");
    }
  },

  // Delete representative from profiles table
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) throw error;
  },

  // Authenticate representative (simplified for demo)
  async authenticate(
    email: string,
    password: string,
  ): Promise<Representative | null> {
    const representative = await this.getByEmail(email);
    if (!representative) return null;

    // For demo purposes, accept any password for existing users
    // In production, implement proper authentication with Supabase Auth
    return representative;
  },
};

// Simple password hashing (in production, use a proper library like bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Contract service
export const contractService = {
  // Get contract by ID with all related data
  async getById(contractId: string) {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select(
          `
          *,
          clients!inner (
            id,
            name,
            email,
            phone,
            cpf_cnpj,
            address_street,
            address_number,
            address_complement,
            address_neighborhood,
            address_city,
            address_state,
            address_zip
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

      if (error) {
        console.error("Error fetching contract:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in contractService.getById:", error);
      throw error;
    }
  },

  // Update contract status
  async updateStatus(
    contractId: string,
    status: Database["public"]["Enums"]["contract_status"],
  ) {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .update({ status })
        .eq("id", contractId)
        .select()
        .single();

      if (error) {
        console.error("Error updating contract status:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in contractService.updateStatus:", error);
      throw error;
    }
  },

  // Delete contract (only for admin or representative with pending/rejected status)
  async delete(contractId: string, userId: string, isAdmin: boolean = false) {
    try {
      // If not admin, check if user owns the contract and it has the right status
      if (!isAdmin) {
        const { data: contract, error: fetchError } = await supabase
          .from("contracts")
          .select("representative_id, status")
          .eq("id", contractId)
          .single();

        if (fetchError) {
          console.error("Error fetching contract for deletion:", fetchError);
          throw new Error("Contrato não encontrado");
        }

        if (contract.representative_id !== userId) {
          throw new Error("Você não tem permissão para excluir este contrato");
        }

        if (contract.status !== "Pendente" && contract.status !== "Reprovado") {
          throw new Error(
            "Só é possível excluir contratos com status Pendente ou Reprovado",
          );
        }
      }

      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", contractId);

      if (error) {
        console.error("Error deleting contract:", error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("Error in contractService.delete:", error);
      throw error;
    }
  },

  // Update contract (only for representatives with pending/rejected status or admins)
  async update(
    contractId: string,
    updates: {
      client_id?: number;
      commission_table_id?: number;
      credit_amount?: string;
      total_value?: string;
      total_installments?: number;
      contract_content?: string;
      quota_id?: string;
    },
    userId: string,
    isAdmin: boolean = false,
  ) {
    try {
      // If not admin, check if user owns the contract and it has the right status
      if (!isAdmin) {
        const { data: contract, error: fetchError } = await supabase
          .from("contracts")
          .select("representative_id, status")
          .eq("id", contractId)
          .single();

        if (fetchError) {
          console.error("Error fetching contract for update:", fetchError);
          throw new Error("Contrato não encontrado");
        }

        if (contract.representative_id !== userId) {
          throw new Error("Você não tem permissão para editar este contrato");
        }

        if (contract.status !== "Pendente" && contract.status !== "Reprovado") {
          throw new Error(
            "Só é possível editar contratos com status Pendente ou Reprovado",
          );
        }
      }

      // Add updated_at timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("contracts")
        .update(updateData)
        .eq("id", contractId)
        .select()
        .single();

      if (error) {
        console.error("Error updating contract:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in contractService.update:", error);
      throw error;
    }
  },

  // Update contract content specifically (with permission checks)
  async updateContent(
    contractId: string,
    content: string,
    userId: string,
    isAdmin: boolean = false,
  ) {
    return this.update(
      contractId,
      { contract_content: content },
      userId,
      isAdmin,
    );
  },

  // Get all contracts for admin view
  async getAll() {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select(
          `
          *,
          clients!inner (name, email),
          profiles!inner (full_name, email),
          commission_tables!inner (name, commission_percentage)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching all contracts:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error in contractService.getAll:", error);
      throw error;
    }
  },
};

// Dashboard data service
export const dashboardService = {
  // Create sample contracts for a representative (for demo purposes)
  async createSampleContractsForRep(representativeId: string) {
    try {
      console.log(
        "Creating sample contracts for representative:",
        representativeId,
      );

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(representativeId)) {
        console.warn(
          "Invalid UUID format for representative ID:",
          representativeId,
        );
        return;
      }

      const { data, error } = await supabase.rpc(
        "create_sample_contracts_for_rep",
        {
          rep_id: representativeId,
        },
      );

      if (error) {
        console.error("Error creating sample contracts:", error);
        // Don't throw error, just log it - this is optional sample data
      } else {
        console.log("Sample contracts created successfully");
      }
    } catch (error) {
      console.error("Error in createSampleContractsForRep:", error);
      // Don't throw error, just log it - this is optional sample data
    }
  },

  // Get representative dashboard data
  async getRepresentativeDashboardData(representativeId: string) {
    try {
      console.log(
        "Fetching dashboard data for representative:",
        representativeId,
      );

      // Validate representative ID
      if (!representativeId) {
        throw new Error("ID do representante é obrigatório");
      }

      // Get contracts for this representative
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select(
          `
          *,
          clients(full_name, name),
          commission_tables(commission_percentage)
        `,
        )
        .eq("representative_id", representativeId);

      if (contractsError) {
        console.error("Error fetching contracts:", contractsError);
        console.error("Contract error details:", {
          code: contractsError.code,
          message: contractsError.message,
          details: contractsError.details,
          hint: contractsError.hint,
        });
        // Don't throw error, continue with empty contracts
        console.log("Continuing with empty contracts due to error");
      }

      // If no contracts exist, create sample data for demo
      if (!contracts || contracts.length === 0) {
        console.log("No contracts found, creating sample data...");
        await this.createSampleContractsForRep(representativeId);

        // Retry fetching contracts after creating sample data
        const { data: newContracts, error: newContractsError } = await supabase
          .from("contracts")
          .select(
            `
            *,
            clients(full_name, name),
            commission_tables(commission_percentage)
          `,
          )
          .eq("representative_id", representativeId);

        if (newContractsError) {
          console.error("Error fetching new contracts:", newContractsError);
          console.log(
            "Continuing with empty contracts after sample data creation failed",
          );
        } else if (newContracts) {
          console.log(
            "Successfully fetched contracts after creating sample data:",
            newContracts.length,
          );
        }
      }

      // Ensure contracts is an array
      const validContracts = Array.isArray(contracts) ? contracts : [];
      console.log("Valid contracts count:", validContracts.length);

      // Calculate performance metrics
      const totalSales = validContracts.reduce((sum, contract) => {
        return sum + (parseFloat(contract?.total_value || "0") || 0);
      }, 0);

      const activeContracts = validContracts.filter(
        (c) => c?.status === "Ativo",
      ).length;
      const completedContracts = validContracts.filter(
        (c) => c?.status === "Concluído",
      ).length;

      // Calculate pending commission (simplified calculation)
      const pendingCommission = validContracts.reduce((sum, contract) => {
        if (contract?.status === "Ativo" || contract?.status === "Concluído") {
          const commissionRate =
            contract?.commission_tables?.commission_percentage || 4; // Default 4%
          const contractValue = parseFloat(contract?.total_value || "0") || 0;
          return sum + contractValue * (commissionRate / 100);
        }
        return sum;
      }, 0);

      // Format contracts for display
      const formattedContracts = validContracts.map((contract) => {
        const createdAt = contract?.created_at;
        let formattedDate = "Data não disponível";

        try {
          if (createdAt) {
            formattedDate = new Date(createdAt).toLocaleDateString("pt-BR");
          }
        } catch (dateError) {
          console.warn("Error formatting date:", dateError);
        }

        return {
          id: contract?.id?.toString() || "unknown",
          contractNumber:
            contract?.contract_code || contract?.contract_number || "N/A",
          clientName:
            contract?.clients?.full_name ||
            contract?.clients?.name ||
            "Cliente não encontrado",
          date: formattedDate,
          value: parseFloat(contract?.total_value || "0") || 0,
          status: (contract?.status?.toLowerCase() || "pending") as
            | "active"
            | "completed"
            | "pending"
            | "cancelled",
          commission:
            (parseFloat(contract?.total_value || "0") || 0) *
            ((contract?.commission_tables?.commission_percentage || 4) / 100),
        };
      });

      // Get withdrawal requests for commission history
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("representative_id", representativeId)
        .order("requested_at", { ascending: false });

      if (withdrawalsError) {
        console.error("Error fetching withdrawals:", withdrawalsError);
        console.error("Withdrawal error details:", {
          code: withdrawalsError.code,
          message: withdrawalsError.message,
          details: withdrawalsError.details,
          hint: withdrawalsError.hint,
        });
      }

      const validWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];
      const commissionHistory = validWithdrawals.map((withdrawal) => {
        let requestedDate = "Data não disponível";
        let processedDate: string | undefined;

        try {
          if (withdrawal?.requested_at) {
            requestedDate = new Date(
              withdrawal.requested_at,
            ).toLocaleDateString("pt-BR");
          }
          if (withdrawal?.processed_at) {
            processedDate = new Date(
              withdrawal.processed_at,
            ).toLocaleDateString("pt-BR");
          }
        } catch (dateError) {
          console.warn("Error formatting withdrawal dates:", dateError);
        }

        return {
          id: withdrawal?.id?.toString() || "unknown",
          contract: withdrawal?.request_code || "N/A",
          date: requestedDate,
          value: withdrawal?.requested_value || 0,
          status:
            withdrawal?.status === "Aprovado"
              ? ("paid" as const)
              : ("pending" as const),
          dueDate: processedDate,
        };
      });

      const dashboardData = {
        performanceData: {
          totalSales: totalSales || 0,
          targetSales: 500000, // Fixed target for now
          activeContracts: activeContracts || 0,
          completedContracts: completedContracts || 0,
          pendingCommission: pendingCommission || 0,
          nextCommissionDate: "15/08/2025", // Fixed for now
          nextCommissionValue:
            pendingCommission > 0 ? Math.min(pendingCommission, 5000) : 0,
        },
        myContracts: formattedContracts || [],
        commissionHistory: commissionHistory || [],
      };

      console.log("Dashboard data prepared successfully:", {
        totalSales: dashboardData.performanceData.totalSales,
        contractsCount: dashboardData.myContracts.length,
        commissionHistoryCount: dashboardData.commissionHistory.length,
      });

      return dashboardData;
    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      // Return default data instead of throwing error
      const defaultData = {
        performanceData: {
          totalSales: 0,
          targetSales: 500000,
          activeContracts: 0,
          completedContracts: 0,
          pendingCommission: 0,
          nextCommissionDate: "15/08/2025",
          nextCommissionValue: 0,
        },
        myContracts: [],
        commissionHistory: [],
      };

      console.log("Returning default dashboard data due to error");
      return defaultData;
    }
  },
};

// Document service
export const documentService = {
  // Get documents for a representative
  async getRepresentativeDocuments(representativeId: string) {
    try {
      const { data, error } = await supabase
        .from("representative_documents")
        .select("*")
        .eq("representative_id", representativeId)
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(
        "Error in documentService.getRepresentativeDocuments:",
        error,
      );
      throw error;
    }
  },

  // Update document status
  async updateDocumentStatus(
    documentId: number,
    status: Database["public"]["Enums"]["document_status"],
    reviewedBy?: string,
  ) {
    try {
      const { data, error } = await supabase
        .from("representative_documents")
        .update({
          status,
          ...(reviewedBy && { reviewed_by: reviewedBy }),
        })
        .eq("id", documentId)
        .select()
        .single();

      if (error) {
        console.error("Error updating document status:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in documentService.updateDocumentStatus:", error);
      throw error;
    }
  },

  // Check if all required documents are approved for a representative
  async checkAllDocumentsApproved(representativeId: string): Promise<boolean> {
    try {
      const requiredDocuments = [
        "Cartão do CNPJ",
        "Comprovante de Endereço",
        "Certidão de Antecedente Criminal",
        "Certidão Negativa Civil",
      ];

      const { data, error } = await supabase
        .from("representative_documents")
        .select("document_type, status")
        .eq("representative_id", representativeId)
        .in("document_type", requiredDocuments);

      if (error) {
        console.error("Error checking document approval status:", error);
        throw error;
      }

      // Check if all required documents are approved
      const approvedDocuments = (data || []).filter(
        (doc) => doc.status === "Aprovado",
      );
      return approvedDocuments.length === requiredDocuments.length;
    } catch (error) {
      console.error(
        "Error in documentService.checkAllDocumentsApproved:",
        error,
      );
      return false;
    }
  },

  // Approve all documents for a representative and grant dashboard access
  async approveAllDocuments(representativeId: string, approvedBy: string) {
    try {
      // First, approve all documents
      const { error: docsError } = await supabase
        .from("representative_documents")
        .update({
          status: "Aprovado" as Database["public"]["Enums"]["document_status"],
          reviewed_by: approvedBy,
        })
        .eq("representative_id", representativeId);

      if (docsError) {
        console.error("Error approving documents:", docsError);
        throw docsError;
      }

      // Then update the profile to mark documents as approved and change status to active
      const { data, error } = await supabase
        .from("profiles")
        .update({
          documents_approved: true,
          documents_approved_at: new Date().toISOString(),
          documents_approved_by: approvedBy,
          status: "Ativo" as Database["public"]["Enums"]["user_status"],
        })
        .eq("id", representativeId)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile approval status:", error);
        throw error;
      }

      console.log(
        "Documents approved and profile activated for:",
        representativeId,
      );
      return data;
    } catch (error) {
      console.error("Error in documentService.approveAllDocuments:", error);
      throw error;
    }
  },

  // Create required documents for a representative (if they don't exist)
  async createRequiredDocuments(representativeId: string) {
    try {
      const requiredDocuments = [
        "Cartão do CNPJ",
        "Comprovante de Endereço",
        "Certidão de Antecedente Criminal",
        "Certidão Negativa Civil",
      ];

      // Check which documents already exist
      const { data: existingDocs, error: fetchError } = await supabase
        .from("representative_documents")
        .select("document_type")
        .eq("representative_id", representativeId);

      if (fetchError) {
        console.error("Error fetching existing documents:", fetchError);
        throw fetchError;
      }

      const existingTypes = (existingDocs || []).map(
        (doc) => doc.document_type,
      );
      const missingDocuments = requiredDocuments.filter(
        (type) => !existingTypes.includes(type),
      );

      // Create missing documents with pending status
      if (missingDocuments.length > 0) {
        const documentsToInsert = missingDocuments.map((docType) => ({
          representative_id: representativeId,
          document_type: docType,
          status: "Pendente" as Database["public"]["Enums"]["document_status"],
          file_url: "",
        }));

        const { error: insertError } = await supabase
          .from("representative_documents")
          .insert(documentsToInsert);

        if (insertError) {
          console.error("Error creating required documents:", insertError);
          throw insertError;
        }
      }

      return true;
    } catch (error) {
      console.error("Error in documentService.createRequiredDocuments:", error);
      throw error;
    }
  },
};

// Contract Template service
export const contractTemplateService = {
  // Get all templates (admin sees all, others see only public ones)
  async getAll(isAdmin: boolean = false) {
    try {
      let query = supabase
        .from("contract_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("visibility", "all");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching contract templates:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error in contractTemplateService.getAll:", error);
      throw error;
    }
  },

  // Get template by ID
  async getById(id: number) {
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching contract template:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in contractTemplateService.getById:", error);
      throw error;
    }
  },

  // Create new template
  async create(templateData: {
    name: string;
    description?: string;
    content: string;
    visibility: "admin" | "all";
    created_by: string;
  }) {
    try {
      console.log("contractTemplateService.create called with:", templateData);
      console.log("Supabase client status:", !!supabase);

      // Validate required fields
      if (!templateData.name || !templateData.name.trim()) {
        throw new Error("Nome do modelo é obrigatório");
      }

      if (!templateData.content || !templateData.content.trim()) {
        throw new Error("Conteúdo do modelo é obrigatório");
      }

      if (
        !templateData.visibility ||
        !["admin", "all"].includes(templateData.visibility)
      ) {
        throw new Error("Visibilidade deve ser 'admin' ou 'all'");
      }

      // Check if table exists by trying to select from it first
      console.log("Checking if contract_templates table exists...");
      const { data: tableCheck, error: tableError } = await supabase
        .from("contract_templates")
        .select("id")
        .limit(1);

      if (tableError) {
        console.error("Table check error:", tableError);
        if (tableError.code === "42P01") {
          throw new Error(
            "Tabela 'contract_templates' não existe no banco de dados",
          );
        }
        if (tableError.code === "PGRST301") {
          throw new Error("Erro de autenticação - verifique suas credenciais");
        }
        throw tableError;
      }

      console.log("Table exists, proceeding with insert...");

      // For created_by, we'll set it to null since we don't have proper user authentication
      // The foreign key constraint allows NULL values (ON DELETE SET NULL)
      const insertData = {
        name: templateData.name.trim(),
        description: templateData.description?.trim() || null,
        content: templateData.content,
        visibility: templateData.visibility,
        created_by: null, // Set to null to avoid foreign key constraint issues
      };

      console.log("Inserting template data:", {
        ...insertData,
        content: `${insertData.content.substring(0, 50)}...`, // Truncate content for logging
      });

      const { data, error } = await supabase
        .from("contract_templates")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Supabase error creating contract template:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Enhance error with more context
        const enhancedError = new Error(
          error.message || "Erro desconhecido do banco de dados",
        );
        (enhancedError as any).code = error.code;
        (enhancedError as any).details = error.details;
        (enhancedError as any).hint = error.hint;
        throw enhancedError;
      }

      if (!data) {
        console.error("No data returned from template creation");
        throw new Error("Nenhum dado retornado após criação do modelo");
      }

      console.log("Template created successfully:", data);
      return data;
    } catch (error) {
      console.error(
        "Error in contractTemplateService.create - Full error:",
        error,
      );
      console.error("Error type:", typeof error);
      console.error("Error constructor:", error?.constructor?.name);

      // Re-throw the error preserving its type and properties
      if (error instanceof Error) {
        throw error;
      }

      // Handle Supabase error objects
      if (typeof error === "object" && error !== null) {
        const supabaseError = error as any;
        if (supabaseError.code || supabaseError.message) {
          const enhancedError = new Error(
            supabaseError.message || "Erro do banco de dados",
          );
          (enhancedError as any).code = supabaseError.code;
          (enhancedError as any).details = supabaseError.details;
          (enhancedError as any).hint = supabaseError.hint;
          throw enhancedError;
        }
      }

      // Handle unknown error types
      throw new Error(`Erro desconhecido ao criar modelo: ${String(error)}`);
    }
  },

  // Update template
  async update(
    id: number,
    updates: {
      name?: string;
      description?: string;
      content?: string;
      visibility?: "admin" | "all";
    },
  ) {
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating contract template:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in contractTemplateService.update:", error);
      throw error;
    }
  },

  // Delete template
  async delete(id: number) {
    try {
      const { error } = await supabase
        .from("contract_templates")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting contract template:", error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("Error in contractTemplateService.delete:", error);
      throw error;
    }
  },
};

// Auth functions
export const authService = {
  // Login representative
  async loginRepresentative(
    email: string,
    password: string,
  ): Promise<Representative | null> {
    return await representativeService.authenticate(email, password);
  },

  // Get current user from localStorage
  getCurrentUser(): Representative | null {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Set current user in localStorage
  setCurrentUser(user: Representative): void {
    localStorage.setItem("currentUser", JSON.stringify(user));
  },

  // Logout
  logout(): void {
    localStorage.removeItem("currentUser");
  },

  // Check if user's documents are approved
  async checkDocumentsApproved(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("documents_approved, status")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error checking document approval:", error);
        return false;
      }

      const isApproved =
        data?.documents_approved === true && data?.status === "Ativo";
      console.log(`Document approval check for ${userId}:`, {
        documents_approved: data?.documents_approved,
        status: data?.status,
        isApproved,
      });

      return isApproved;
    } catch (error) {
      console.error("Error in checkDocumentsApproved:", error);
      return false;
    }
  },

  // Get updated user data from database
  async refreshUserData(userId: string): Promise<Representative | null> {
    try {
      const representative = await representativeService.getById(userId);
      if (representative) {
        this.setCurrentUser(representative);
      }
      return representative;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return null;
    }
  },
};

// Signature service
export const signatureService = {
  // Get contract for public signature
  async getContractForSignature(contractId: string) {
    try {
      const { data, error } = await supabase
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

      if (error) {
        console.error("Error fetching contract for signature:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(
        "Error in signatureService.getContractForSignature:",
        error,
      );
      throw error;
    }
  },

  // Save signature data
  async saveSignature(signatureData: {
    contract_id: number;
    signer_name: string;
    signer_cpf: string;
    signature_image_url: string;
    client_ip: string;
  }) {
    try {
      const { data, error } = await supabase
        .from("contract_signatures")
        .insert({
          ...signatureData,
          signed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving signature:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in signatureService.saveSignature:", error);
      throw error;
    }
  },

  // Save contract document
  async saveContractDocument(documentData: {
    contract_id: number;
    document_type: string;
    document_url: string;
  }) {
    try {
      const { data, error } = await supabase
        .from("contract_documents")
        .insert({
          ...documentData,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving contract document:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in signatureService.saveContractDocument:", error);
      throw error;
    }
  },

  // Update contract status after signature
  async updateContractStatusAfterSignature(contractId: number) {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .update({
          status:
            "Em Análise" as Database["public"]["Enums"]["contract_status"],
          updated_at: new Date().toISOString(),
        })
        .eq("id", contractId)
        .select()
        .single();

      if (error) {
        console.error("Error updating contract status after signature:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(
        "Error in signatureService.updateContractStatusAfterSignature:",
        error,
      );
      throw error;
    }
  },
};
