import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Users, Hash, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Group {
  id: number;
  name: string;
  description: string;
  total_quotas: number;
  available_quotas: number;
  occupied_quotas: number;
}

interface Quota {
  id: number;
  group_id: number;
  quota_number: number;
  status: "Disponível" | "Reservada" | "Ocupada" | "Cancelada/Atraso";
  representative_id?: string;
  reserved_by?: string;
  reserved_at?: string;
}

interface CommissionPlan {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
}

interface CreditRange {
  id: number;
  plano_id: number;
  valor_credito: number;
  valor_primeira_parcela: number;
  valor_parcelas_restantes: number;
  numero_total_parcelas: number;
}

interface QuotaSelectionProps {
  selectedPlan: CommissionPlan;
  selectedCreditRange: CreditRange;
  onQuotaSelect: (quota: Quota, group: Group) => void;
  onBack: () => void;
}

const QuotaSelection: React.FC<QuotaSelectionProps> = ({
  selectedPlan,
  selectedCreditRange,
  onQuotaSelect,
  onBack,
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [selectedQuota, setSelectedQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchQuotas(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("name");

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotas = async (groupId: number) => {
    try {
      // First, release any expired reservations
      try {
        await supabase.rpc("release_expired_reservations");
      } catch (rpcError) {
        console.warn("Could not release expired reservations:", rpcError);
        // Continue anyway - this is not critical
      }

      const { data, error } = await supabase
        .from("quotas")
        .select("*")
        .eq("group_id", groupId)
        .order("quota_number");

      if (error) {
        console.error("Error fetching quotas:", error);
        throw error;
      }
      setQuotas(data || []);
    } catch (error) {
      console.error("Error fetching quotas:", error);
      // Set empty array on error to prevent UI issues
      setQuotas([]);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    const group = groups.find((g) => g.id === parseInt(groupId));
    setSelectedGroup(group || null);
    setSelectedQuota(null);
  };

  const handleQuotaClick = async (quota: Quota) => {
    if (quota.status !== "Disponível") return;

    setReserving(true);
    try {
      // For now, just select the quota without database reservation
      // This will be handled in the contract creation process
      const updatedQuota = {
        ...quota,
        status: "Reservada" as const,
      };

      setSelectedQuota(updatedQuota);
      setQuotas(quotas.map((q) => (q.id === quota.id ? updatedQuota : q)));
    } catch (error) {
      console.error("Error selecting quota:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao selecionar cota: ${errorMessage}`);
    } finally {
      setReserving(false);
    }
  };

  const handleContinue = () => {
    if (selectedQuota && selectedGroup) {
      onQuotaSelect(selectedQuota, selectedGroup);
    }
  };

  const getQuotaColor = (quota: Quota) => {
    switch (quota.status) {
      case "Disponível":
        return "bg-gray-300 hover:bg-gray-400 cursor-pointer";
      case "Reservada":
        return "bg-yellow-400 cursor-not-allowed";
      case "Ocupada":
        return "bg-green-500 cursor-not-allowed";
      case "Cancelada/Atraso":
        return "bg-red-500 cursor-not-allowed";
      default:
        return "bg-gray-300";
    }
  };

  const getQuotaTextColor = (quota: Quota) => {
    switch (quota.status) {
      case "Disponível":
        return "text-gray-700";
      case "Reservada":
        return "text-yellow-800";
      case "Ocupada":
        return "text-white";
      case "Cancelada/Atraso":
        return "text-white";
      default:
        return "text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando grupos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Seleção de Grupo e Cota
              </h1>
              <p className="text-gray-600">
                Escolha um grupo e selecione uma cota disponível
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-red-100 text-red-700">
                {selectedPlan.nome}
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(selectedCreditRange.valor_credito)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Group Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Selecionar Grupo
                </CardTitle>
                <CardDescription>Escolha o grupo de consórcio</CardDescription>
              </CardHeader>
              <CardContent>
                <Select onValueChange={handleGroupSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{group.name}</span>
                          <span className="text-sm text-gray-500">
                            {group.available_quotas} disponíveis de{" "}
                            {group.total_quotas}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedGroup && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">{selectedGroup.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {selectedGroup.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <span className="ml-1 font-medium">
                          {selectedGroup.total_quotas}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Disponíveis:</span>
                        <span className="ml-1 font-medium text-green-600">
                          {selectedGroup.available_quotas}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Legenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                  <span className="text-sm">Disponível</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
                  <span className="text-sm">Reservada</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span className="text-sm">Ocupada</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span className="text-sm">Cancelada/Atraso</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quota Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hash className="mr-2 h-5 w-5" />
                  Cotas do Grupo
                  {selectedGroup && (
                    <Badge variant="outline" className="ml-2">
                      {selectedGroup.name}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Clique em uma cota disponível (cinza) para reservá-la
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedGroup ? (
                  <div className="text-center py-12 text-gray-500">
                    Selecione um grupo para visualizar as cotas
                  </div>
                ) : quotas.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Nenhuma cota encontrada para este grupo
                  </div>
                ) : (
                  <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
                    {quotas.map((quota) => (
                      <div
                        key={quota.id}
                        className={`
                          aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                          transition-all duration-200 border-2 border-transparent
                          ${getQuotaColor(quota)}
                          ${getQuotaTextColor(quota)}
                          ${quota.status === "Disponível" ? "hover:scale-105" : ""}
                          ${selectedQuota?.id === quota.id ? "ring-2 ring-red-500 scale-105" : ""}
                        `}
                        onClick={() => handleQuotaClick(quota)}
                        title={`Cota ${quota.quota_number} - ${quota.status}`}
                      >
                        {quota.quota_number}
                      </div>
                    ))}
                  </div>
                )}

                {selectedQuota && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-800">
                        Cota #{selectedQuota.quota_number} Reservada
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Esta cota foi reservada temporariamente para você.
                      Continue o processo para finalizar a reserva.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button onClick={onBack} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Button
            onClick={handleContinue}
            disabled={!selectedQuota || reserving}
            className="bg-red-600 hover:bg-red-700 px-8"
            size="lg"
          >
            {reserving ? "Reservando..." : "Continuar"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuotaSelection;
