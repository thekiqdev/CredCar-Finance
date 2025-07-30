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
import { ArrowRight, ArrowLeft, Percent, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CommissionTable {
  id: number;
  name: string;
  commission_percentage: number;
  payment_details: string;
}

interface CommissionTableSelectionProps {
  onTableSelect: (table: CommissionTable) => void;
  onBack?: () => void;
}

const CommissionTableSelection: React.FC<CommissionTableSelectionProps> = ({
  onTableSelect,
  onBack,
}) => {
  const [tables, setTables] = useState<CommissionTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<CommissionTable | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommissionTables();
  }, []);

  const fetchCommissionTables = async () => {
    try {
      const { data, error } = await supabase
        .from("commission_tables")
        .select("*")
        .order("name");

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error("Error fetching commission tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (table: CommissionTable) => {
    setSelectedTable(table);
  };

  const handleContinue = () => {
    if (selectedTable) {
      onTableSelect(selectedTable);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando tabelas de comissão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Seleção da Tabela de Comissão
          </h1>
          <p className="text-gray-600">
            Escolha a tabela de comissão que será aplicada a este contrato
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedTable?.id === table.id
                  ? "ring-2 ring-red-500 bg-red-50"
                  : "hover:shadow-md"
              }`}
              onClick={() => handleTableSelect(table)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {table.name}
                  </CardTitle>
                  <Badge variant="outline" className="bg-red-100 text-red-700">
                    <Percent className="w-3 h-3 mr-1" />
                    {table.commission_percentage}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CreditCard className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {table.payment_details ||
                        "Detalhes de pagamento não especificados"}
                    </p>
                  </div>

                  <div className="pt-2">
                    {selectedTable?.id === table.id ? (
                      <div className="flex items-center text-red-600 text-sm font-medium">
                        <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                        Selecionada
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        Clique para selecionar
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tables.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 mb-4">
                Nenhuma tabela de comissão encontrada
              </p>
              <p className="text-sm text-gray-400">
                Entre em contato com o administrador para configurar as tabelas
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          {onBack && (
            <Button onClick={onBack} variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          )}
          {!onBack && <div></div>}
          <Button
            onClick={handleContinue}
            disabled={!selectedTable}
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

export default CommissionTableSelection;
