import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentUploadProps {
  representativeName?: string;
  onComplete?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  representativeName = "Representante",
  onComplete = () => {},
}) => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: "Cartão do CNPJ",
      description: "Documento oficial do CNPJ da empresa",
      required: true,
      status: "pending", // pending, uploaded, approved, rejected
      file: null,
      rejectionReason: "",
    },
    {
      id: 2,
      name: "Comprovante de Endereço",
      description: "Comprovante de endereço da empresa (máximo 3 meses)",
      required: true,
      status: "pending",
      file: null,
      rejectionReason: "",
    },
    {
      id: 3,
      name: "Certidão de Antecedente Criminal",
      description: "Certidão negativa de antecedentes criminais do responsável",
      required: true,
      status: "pending",
      file: null,
      rejectionReason: "",
    },
    {
      id: 4,
      name: "Certidão Negativa Civil",
      description: "Certidão negativa de débitos civis do responsável",
      required: true,
      status: "pending",
      file: null,
      rejectionReason: "",
    },
  ]);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (documentId: number, file: File) => {
    setIsUploading(true);

    try {
      // Simulate file upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId ? { ...doc, file, status: "uploaded" } : doc,
        ),
      );

      console.log(`Document ${documentId} uploaded:`, file.name);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileRemove = (documentId: number) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId ? { ...doc, file: null, status: "pending" } : doc,
      ),
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "uploaded":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <Upload className="w-3 h-3 mr-1" />
            Enviado
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const uploadedCount = documents.filter(
    (doc) => doc.status === "uploaded" || doc.status === "approved",
  ).length;
  const totalRequired = documents.filter((doc) => doc.required).length;
  const progress = (uploadedCount / totalRequired) * 100;
  const allDocumentsUploaded = uploadedCount === totalRequired;

  const handleContinue = () => {
    if (allDocumentsUploaded) {
      onComplete();
      navigate("/representante");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-white shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-8 w-8 rounded-md bg-red-600 mr-2"></div>
            <h1 className="text-3xl font-bold text-red-600">CredCar</h1>
          </div>
          <CardTitle className="text-2xl font-bold">
            Bem-vindo, {representativeName}!
          </CardTitle>
          <CardDescription>
            Sua conta foi aprovada! Para liberar o acesso completo ao sistema, é
            necessário enviar os documentos abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Progresso do Envio</h3>
              <span className="text-sm text-muted-foreground">
                {uploadedCount} de {totalRequired} documentos enviados
              </span>
            </div>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {allDocumentsUploaded
                ? "Todos os documentos foram enviados! Aguarde a aprovação para acesso completo."
                : "Envie todos os documentos obrigatórios para liberar o acesso ao sistema."}
            </p>
          </div>

          {/* Documents List */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">
              Documentos Obrigatórios
            </h3>

            {documents.map((document) => (
              <Card
                key={document.id}
                className="border-2 border-dashed border-gray-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <h4 className="font-semibold">{document.name}</h4>
                        {document.required && (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 text-xs"
                          >
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {document.description}
                      </p>
                      {getStatusBadge(document.status)}
                    </div>
                  </div>

                  {document.status === "pending" && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-4">
                        Clique para selecionar o arquivo ou arraste e solte aqui
                      </p>
                      <input
                        type="file"
                        id={`file-${document.id}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(document.id, file);
                          }
                        }}
                        disabled={isUploading}
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          document
                            .getElementById(`file-${document.id}`)
                            ?.click()
                        }
                        disabled={isUploading}
                      >
                        {isUploading ? "Enviando..." : "Selecionar Arquivo"}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Formatos aceitos: PDF, JPG, PNG (máx. 5MB)
                      </p>
                    </div>
                  )}

                  {(document.status === "uploaded" ||
                    document.status === "approved") &&
                    document.file && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              {document.file.name}
                            </span>
                            <span className="text-xs text-green-600">
                              ({(document.file.size / 1024 / 1024).toFixed(2)}{" "}
                              MB)
                            </span>
                          </div>
                          {document.status === "uploaded" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFileRemove(document.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {document.status === "uploaded" && (
                          <p className="text-xs text-green-600 mt-1">
                            Documento enviado com sucesso! Aguardando aprovação.
                          </p>
                        )}
                        {document.status === "approved" && (
                          <p className="text-xs text-green-600 mt-1">
                            Documento aprovado!
                          </p>
                        )}
                      </div>
                    )}

                  {document.status === "rejected" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          Documento rejeitado
                        </span>
                      </div>
                      <p className="text-sm text-red-700 mb-3">
                        Motivo:{" "}
                        {document.rejectionReason ||
                          "Documento não atende aos requisitos."}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDocuments((prev) =>
                            prev.map((doc) =>
                              doc.id === document.id
                                ? { ...doc, status: "pending", file: null }
                                : doc,
                            ),
                          );
                        }}
                      >
                        Enviar Novamente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => navigate("/")}>
              Sair do Sistema
            </Button>

            <div className="flex gap-4">
              {!allDocumentsUploaded && (
                <Alert className="max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Envie todos os documentos obrigatórios para continuar.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleContinue}
                disabled={!allDocumentsUploaded}
                className="bg-red-600 hover:bg-red-700"
              >
                {allDocumentsUploaded
                  ? "Continuar para o Sistema"
                  : "Aguardando Documentos"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
