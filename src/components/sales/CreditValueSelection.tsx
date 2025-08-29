import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Calendar,
  Calculator,
} from "lucide-react";
import { commissionPlansService } from "@/lib/supabase";

interface CustomInstallment {
  id: number;
  faixa_credito_id: number;
  numero_parcela: number;
  valor_parcela: number;
  created_at: string | null;
  updated_at: string | null;
}

interface CreditRange {
  id: number;
  plano_id: number;
  valor_credito: number;
  valor_primeira_parcela: number;
  valor_parcelas_restantes: number;
  numero_total_parcelas: number;
  customInstallments?: CustomInstallment[];
}

interface CommissionPlan {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
}

interface CreditValueSelectionProps {
  selectedPlan: CommissionPlan;
  onCreditSelect: (creditRange: CreditRange) => void;
  onBack: () => void;
}

const CreditValueSelection: React.FC<CreditValueSelectionProps> = ({
  selectedPlan,
  onCreditSelect,
  onBack,
}) => {
  const [creditRanges, setCreditRanges] = useState<CreditRange[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<CreditRange | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreditRanges();
  }, [selectedPlan.id]);

  const fetchCreditRanges = async () => {
    try {
      setLoading(true);
      const planData = await commissionPlansService.getById(selectedPlan.id);
      setCreditRanges(planData.creditRanges || []);
    } catch (error) {
      console.error("Error fetching credit ranges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreditSelect = (creditRange: CreditRange) => {
    setSelectedCredit(creditRange);
  };

  const handleContinue = () => {
    if (selectedCredit) {
      onCreditSelect(selectedCredit);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const renderInstallments = (creditRange: CreditRange) => {
    const customInstallments = creditRange.customInstallments || [];
    const installmentElements = [];

    // If there are custom installments, render them individually
    if (customInstallments.length > 0) {
      // Sort custom installments by installment number
      const sortedCustom = [...customInstallments].sort(
        (a, b) => a.numero_parcela - b.numero_parcela,
      );

      // Render each custom installment
      sortedCustom.forEach((installment) => {
        installmentElements.push(
          <div
            key={`custom-${installment.id}`}
            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
          >
            <div className="flex items-center">
              <Calculator className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                {installment.numero_parcela}ª Parcela
              </span>
            </div>
            <span className="text-sm font-semibold text-blue-600">
              {formatCurrency(installment.valor_parcela)}
            </span>
          </div>,
        );
      });

      // Calculate remaining installments
      const customInstallmentCount = customInstallments.length;
      const remainingInstallments =
        creditRange.numero_total_parcelas - customInstallmentCount;

      if (remainingInstallments > 0) {
        installmentElements.push(
          <div
            key="remaining"
            className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
          >
            <div className="flex items-center">
              <Calculator className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Demais Parcelas ({remainingInstallments}x)
              </span>
            </div>
            <span className="text-sm font-semibold text-purple-600">
              {formatCurrency(creditRange.valor_parcelas_restantes)}
            </span>
          </div>,
        );
      }
    } else {
      // Default behavior: show first installment and remaining installments
      installmentElements.push(
        <div
          key="first"
          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
        >
          <div className="flex items-center">
            <Calculator className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              1ª Parcela
            </span>
          </div>
          <span className="text-sm font-semibold text-blue-600">
            {formatCurrency(creditRange.valor_primeira_parcela)}
          </span>
        </div>,
      );

      const remainingInstallments = creditRange.numero_total_parcelas - 1;
      if (remainingInstallments > 0) {
        installmentElements.push(
          <div
            key="remaining"
            className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
          >
            <div className="flex items-center">
              <Calculator className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Demais Parcelas ({remainingInstallments}x)
              </span>
            </div>
            <span className="text-sm font-semibold text-purple-600">
              {formatCurrency(creditRange.valor_parcelas_restantes)}
            </span>
          </div>,
        );
      }
    }

    // Always show total installments
    installmentElements.push(
      <div
        key="total"
        className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
      >
        <div className="flex items-center">
          <Calendar className="w-4 h-4 text-orange-600 mr-2" />
          <span className="text-sm font-medium text-gray-700">
            Total de Parcelas
          </span>
        </div>
        <span className="text-sm font-semibold text-orange-600">
          {creditRange.numero_total_parcelas}x
        </span>
      </div>,
    );

    return installmentElements;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando valores de crédito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Seleção do Valor de Crédito
              </h1>
              <p className="text-gray-600">
                Escolha o valor de crédito disponível no plano selecionado
              </p>
            </div>
            <Badge variant="outline" className="bg-red-100 text-red-700">
              {selectedPlan.nome}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {creditRanges.map((creditRange) => (
            <Card
              key={creditRange.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedCredit?.id === creditRange.id
                  ? "ring-2 ring-red-500 bg-red-50"
                  : "hover:shadow-md"
              }`}
              onClick={() => handleCreditSelect(creditRange)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    {formatCurrency(creditRange.valor_credito)}
                  </CardTitle>
                  {selectedCredit?.id === creditRange.id && (
                    <Badge
                      variant="outline"
                      className="bg-red-100 text-red-700"
                    >
                      Selecionado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {renderInstallments(creditRange)}
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-500 text-center">
                      {selectedCredit?.id === creditRange.id
                        ? "✓ Valor selecionado"
                        : "Clique para selecionar"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {creditRanges.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 mb-4">
                Nenhum valor de crédito encontrado para este plano
              </p>
              <p className="text-sm text-gray-400">
                Entre em contato com o administrador para configurar os valores
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button onClick={onBack} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Button
            onClick={handleContinue}
            disabled={!selectedCredit}
            className="bg-red-600 hover:bg-red-700 px-8"
            size="lg"
          >
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreditValueSelection;
