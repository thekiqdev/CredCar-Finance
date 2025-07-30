import React, { useState } from "react";
import { supabase, authService, representativeService } from "@/lib/supabase";
import CommissionTableSelection from "./CommissionTableSelection";
import QuotaSelection from "./QuotaSelection";
import ClientRegistration from "./ClientRegistration";
import ContractContentEditor from "./ContractContentEditor";
import RepresentativeSelection from "./RepresentativeSelection";

interface CommissionTable {
  id: number;
  name: string;
  commission_percentage: number;
  payment_details: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
}

interface Quota {
  id: number;
  group_id: number;
  quota_number: number;
  status: string;
}

interface ClientData {
  full_name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  address: string;
}

type FlowStep =
  | "representative-selection"
  | "table-selection"
  | "quota-selection"
  | "client-registration"
  | "contract-content"
  | "completed";

interface ContractCreationFlowProps {
  onComplete?: () => void;
  isAdminMode?: boolean;
}

const ContractCreationFlow: React.FC<ContractCreationFlowProps> = ({
  onComplete,
  isAdminMode = false,
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>(
    isAdminMode ? "representative-selection" : "table-selection",
  );
  const [selectedRepresentative, setSelectedRepresentative] =
    useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<CommissionTable | null>(
    null,
  );
  const [selectedQuota, setSelectedQuota] = useState<Quota | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [contractContent, setContractContent] = useState<string>("");

  const handleRepresentativeSelect = (representative: any) => {
    setSelectedRepresentative(representative);
    setCurrentStep("table-selection");
  };

  const handleTableSelect = (table: CommissionTable) => {
    setSelectedTable(table);
    setCurrentStep("quota-selection");
  };

  const handleQuotaSelect = (quota: Quota, group: Group) => {
    setSelectedQuota(quota);
    setSelectedGroup(group);
    setCurrentStep("client-registration");
  };

  const handleClientSubmit = (clientData: ClientData) => {
    setClientData(clientData);
    setCurrentStep("contract-content");
  };

  const handleContractContentSubmit = (content: string) => {
    setContractContent(content);
    createContract(content);
  };

  const createContract = async (contentToSave?: string) => {
    try {
      if (!clientData) {
        throw new Error("Dados do cliente não encontrados");
      }

      // Get current user from localStorage (custom auth)
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error("User not authenticated");

      // Determine the representative for the contract
      let contractRepresentativeId = currentUser.id;

      if (isAdminMode) {
        // If admin mode and a representative is selected, use that representative
        if (selectedRepresentative) {
          contractRepresentativeId = selectedRepresentative.id;
        }
        // If no representative selected, admin creates contract under their own name
      } else {
        // For regular representatives, verify documents and status
        const documentsApproved = await authService.checkDocumentsApproved(
          currentUser.id,
        );

        console.log("Contract creation - user status check:", {
          userId: currentUser.id,
          userStatus: currentUser.status,
          documentsApproved,
        });

        // Allow contract creation for active users with approved documents
        if (!documentsApproved && currentUser.status !== "Ativo") {
          throw new Error(
            "Documentos não aprovados ou perfil inativo. Entre em contato com o administrador.",
          );
        }

        // Additional check: if user status is active, allow contract creation even if documents_approved flag is not set
        if (currentUser.status !== "Ativo") {
          throw new Error(
            "Perfil não está ativo. Entre em contato com o administrador.",
          );
        }
      }

      // Parse address components from the full address string
      const addressParts = clientData.address.split(", ");
      const [street, number, complement, neighborhood, cityState, zip] =
        addressParts;
      const [city, state] = cityState ? cityState.split(" - ") : ["", ""];

      // Check if client already exists
      let clientId: string;
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("email", clientData.email)
        .single();

      if (existingClient) {
        // Update existing client - using correct column names from database schema
        const { error: updateError } = await supabase
          .from("clients")
          .update({
            full_name: clientData.full_name, // Using correct column name from schema
            phone: clientData.phone,
            cpf_cnpj: clientData.cpf_cnpj,
            address: clientData.address, // Using single address field as per schema
          })
          .eq("id", existingClient.id);

        if (updateError) throw updateError;
        clientId = existingClient.id.toString();
      } else {
        // Create new client - using correct column names from database schema
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert([
            {
              full_name: clientData.full_name, // Using correct column name from schema
              email: clientData.email,
              phone: clientData.phone,
              cpf_cnpj: clientData.cpf_cnpj,
              address: clientData.address, // Using single address field as per schema
            },
          ])
          .select("id")
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id.toString();
      }

      // Generate contract number
      const contractNumber = `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create contract using the correct schema from the migration
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .insert([
          {
            contract_code: contractNumber, // Using 'contract_code' as per schema
            representative_id: contractRepresentativeId,
            client_id: parseInt(clientId), // Convert to number as per schema
            commission_table_id: selectedTable!.id,
            quota_id: selectedQuota!.id, // Add quota_id to link the contract to the quota
            total_value: 50000.0, // Sample amount
            remaining_value: 49000.0, // Sample remaining amount
            total_installments: 80, // 80 months
            paid_installments: 0,
            status: "Pendente",
            contract_content: contentToSave || contractContent, // Save the HTML content
          },
        ])
        .select("id")
        .single();

      if (contractError) {
        console.error("Contract creation error:", contractError);
        throw contractError;
      }

      // Update quota status to 'Ocupada' and link to contract
      const { error: quotaError } = await supabase
        .from("quotas")
        .update({
          status: "Ocupada",
          contract_id: contract.id,
          representative_id: contractRepresentativeId,
          assigned_at: new Date().toISOString(),
          reserved_at: null,
          reserved_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedQuota!.id);

      if (quotaError) {
        console.error("Quota update error:", quotaError);
        throw quotaError;
      }

      setCurrentStep("completed");

      // Show success message
      alert(`Contrato ${contractNumber} criado com sucesso!`);

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      alert(`Erro ao criar contrato: ${error.message || "Tente novamente."}`);
    }
  };

  const handleBackToRepresentativeSelection = () => {
    setCurrentStep("representative-selection");
    setSelectedRepresentative(null);
  };

  const handleBackToTableSelection = () => {
    if (isAdminMode) {
      setCurrentStep("representative-selection");
    } else {
      setCurrentStep("table-selection");
    }
    setSelectedTable(null);
  };

  const handleBackToQuotaSelection = () => {
    setCurrentStep("quota-selection");
  };

  const handleBackToClientRegistration = () => {
    setCurrentStep("client-registration");
  };

  if (currentStep === "completed") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Contrato Criado com Sucesso!
          </h2>
          <p className="text-gray-600 mb-6">
            O contrato foi registrado no sistema e está aguardando aprovação.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {currentStep === "representative-selection" && isAdminMode && (
        <div className="p-6">
          <RepresentativeSelection
            onRepresentativeSelect={handleRepresentativeSelect}
            onSkip={() => setCurrentStep("table-selection")}
          />
        </div>
      )}

      {currentStep === "table-selection" && (
        <div className="p-6">
          <CommissionTableSelection
            onTableSelect={handleTableSelect}
            onBack={
              isAdminMode ? handleBackToRepresentativeSelection : undefined
            }
          />
        </div>
      )}

      {currentStep === "quota-selection" && selectedTable && (
        <div className="p-6">
          <QuotaSelection
            selectedTable={selectedTable}
            onQuotaSelect={handleQuotaSelect}
            onBack={handleBackToTableSelection}
          />
        </div>
      )}

      {currentStep === "client-registration" &&
        selectedTable &&
        selectedQuota &&
        selectedGroup && (
          <div className="p-6">
            <ClientRegistration
              selectedTable={selectedTable}
              selectedQuota={selectedQuota}
              selectedGroup={selectedGroup}
              onClientSubmit={handleClientSubmit}
              onBack={handleBackToQuotaSelection}
            />
          </div>
        )}

      {currentStep === "contract-content" &&
        selectedTable &&
        selectedQuota &&
        selectedGroup &&
        clientData && (
          <div className="p-6">
            <ContractContentEditor
              selectedTable={selectedTable}
              selectedQuota={selectedQuota}
              selectedGroup={selectedGroup}
              clientData={clientData}
              onContentSubmit={handleContractContentSubmit}
              onBack={handleBackToClientRegistration}
            />
          </div>
        )}
    </div>
  );
};

export default ContractCreationFlow;
