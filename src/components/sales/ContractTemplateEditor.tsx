import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, Upload, FileText, Users, Lock } from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import mammoth from "mammoth";

interface ContractTemplate {
  id: number;
  name: string;
  description: string | null;
  content: string;
  visibility: "admin" | "all";
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ContractTemplateEditorProps {
  template: ContractTemplate;
  onSave: (
    content: string,
    metadata: {
      name: string;
      description: string;
      visibility: "admin" | "all";
    },
  ) => void;
  onCancel: () => void;
}

const ContractTemplateEditor: React.FC<ContractTemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
}) => {
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [metadata, setMetadata] = useState({
    name: template.name,
    description: template.description || "",
    visibility: template.visibility,
  });
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleSave = () => {
    if (!metadata.name.trim()) {
      setAlert({ type: "error", message: "Nome do modelo é obrigatório" });
      return;
    }

    if (editorRef.current) {
      const editorContent = editorRef.current.getContent();
      if (!editorContent.trim()) {
        setAlert({
          type: "error",
          message: "Conteúdo do modelo é obrigatório",
        });
        return;
      }
      onSave(editorContent, metadata);
    }
  };

  const handleWordUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      setAlert({
        type: "error",
        message: "Por favor, selecione um arquivo .docx",
      });
      return;
    }

    setIsUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      if (result.value) {
        // Insert the converted HTML into the editor
        if (editorRef.current) {
          editorRef.current.setContent(result.value);
        }
        setAlert({
          type: "success",
          message: "Documento Word convertido com sucesso!",
        });
      }

      if (result.messages.length > 0) {
        console.warn("Mammoth conversion warnings:", result.messages);
      }
    } catch (error) {
      console.error("Error converting Word document:", error);
      setAlert({ type: "error", message: "Erro ao converter documento Word" });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-gray-50 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>

            <div className="flex items-center space-x-8">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Modelo:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {metadata.name}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Visibilidade:
                </span>
                <span className="ml-2 text-sm text-gray-900 flex items-center">
                  {metadata.visibility === "all" ? (
                    <>
                      <Users className="mr-1 h-3 w-3" />
                      Todos
                    </>
                  ) : (
                    <>
                      <Lock className="mr-1 h-3 w-3" />
                      Admin
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={handleWordUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? "Convertendo..." : "Importar Word"}</span>
            </Button>
            <Button
              onClick={handleSave}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Modelo</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Metadata Section */}
      <div className="bg-white border-b px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="template-name">Nome do Modelo *</Label>
            <Input
              id="template-name"
              value={metadata.name}
              onChange={(e) =>
                setMetadata({ ...metadata, name: e.target.value })
              }
              placeholder="Nome do modelo"
            />
          </div>
          <div>
            <Label htmlFor="template-description">Descrição</Label>
            <Input
              id="template-description"
              value={metadata.description}
              onChange={(e) =>
                setMetadata({ ...metadata, description: e.target.value })
              }
              placeholder="Descrição do modelo"
            />
          </div>
          <div>
            <Label htmlFor="template-visibility">Visibilidade</Label>
            <Select
              value={metadata.visibility}
              onValueChange={(value: "admin" | "all") =>
                setMetadata({ ...metadata, visibility: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4" />
                    Apenas Administradores
                  </div>
                </SelectItem>
                <SelectItem value="all">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Todos os Usuários
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className="px-6 py-2">
          <Alert
            className={
              alert.type === "error"
                ? "border-red-200 bg-red-50"
                : "border-green-200 bg-green-50"
            }
          >
            <AlertDescription
              className={
                alert.type === "error" ? "text-red-800" : "text-green-800"
              }
            >
              {alert.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Editor */}
      <div className="h-[calc(100vh-200px)] p-6">
        <div className="h-full">
          <Editor
            apiKey="8b0xydth3kx0va6g1ekaakj4p0snbelodd1df6m9ps5u6rnn"
            onInit={(evt, editor) => (editorRef.current = editor)}
            initialValue={template.content}
            init={{
              height: "calc(100vh - 300px)",
              menubar: true,
              promotion: false,
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "help",
                "wordcount",
                "emoticons",
                "template",
                "codesample",
              ],
              toolbar:
                "undo redo | blocks | bold italic underline strikethrough | " +
                "alignleft aligncenter alignright alignjustify | " +
                "bullist numlist outdent indent | removeformat | help | " +
                "table tabledelete | tableprops tablerowprops tablecellprops | " +
                "tableinsertrowbefore tableinsertrowafter tabledeleterow | " +
                "tableinsertcolbefore tableinsertcolafter tabledeletecol | " +
                "link image media | signature | variables | code preview fullscreen",
              content_style:
                "body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; line-height: 1.4; } .tox-promotion { display: none !important; } .variable-placeholder { background-color: #e3f2fd; padding: 2px 6px; border-radius: 3px; border: 1px solid #2196f3; color: #1976d2; font-weight: bold; }",
              language: "pt_BR",
              branding: false,
              resize: false,
              statusbar: true,
              elementpath: false,
              setup: (editor) => {
                // Function to insert signature
                const insertSignature = () => {
                  const signerName = prompt("Nome do signatário:");
                  if (!signerName) return;

                  const signerCPF = prompt("CPF do signatário:");
                  if (!signerCPF) return;

                  const signatureId = "signature_" + Date.now();
                  const signatureHtml = `
                        <div class="signature-field" data-signature-id="${signatureId}" style="border: 2px dashed #ccc; padding: 20px; margin: 20px 0; background-color: #f9f9f9; text-align: center;">
                          <div style="margin-bottom: 10px;">
                            <strong>Campo de Assinatura</strong>
                          </div>
                          <div style="margin-bottom: 15px;">
                            <div style="border-bottom: 1px solid #000; width: 300px; height: 40px; margin: 0 auto; display: inline-block;"></div>
                          </div>
                          <div style="font-size: 12px; color: #666;">
                            <div><strong>Nome:</strong> ${signerName}</div>
                            <div><strong>CPF:</strong> ${signerCPF}</div>
                          </div>
                        </div>
                      `;

                  editor.insertContent(signatureHtml);
                };

                // Function to insert variables
                const insertVariable = () => {
                  const variables = [
                    { label: "Nome do Cliente", value: "{{CLIENTE_NOME}}" },
                    { label: "Email do Cliente", value: "{{CLIENTE_EMAIL}}" },
                    {
                      label: "Telefone do Cliente",
                      value: "{{CLIENTE_TELEFONE}}",
                    },
                    {
                      label: "CPF/CNPJ do Cliente",
                      value: "{{CLIENTE_CPF_CNPJ}}",
                    },
                    {
                      label: "Endereço do Cliente",
                      value: "{{CLIENTE_ENDERECO}}",
                    },
                    { label: "Nome do Grupo", value: "{{GRUPO_NOME}}" },
                    {
                      label: "Descrição do Grupo",
                      value: "{{GRUPO_DESCRICAO}}",
                    },
                    { label: "Número da Cota", value: "{{COTA_NUMERO}}" },
                    {
                      label: "Nome da Tabela de Comissão",
                      value: "{{TABELA_NOME}}",
                    },
                    {
                      label: "Percentual de Comissão",
                      value: "{{TABELA_PERCENTUAL}}",
                    },
                    {
                      label: "Detalhes de Pagamento",
                      value: "{{TABELA_DETALHES}}",
                    },
                    { label: "Data Atual", value: "{{DATA_ATUAL}}" },
                    { label: "Valor do Crédito", value: "{{CREDITO_VALOR}}" },
                    {
                      label: "Prazo de Pagamento",
                      value: "{{PRAZO_PAGAMENTO}}",
                    },
                  ];

                  const variableList = variables
                    .map((v, i) => `${i + 1}. ${v.label} - ${v.value}`)
                    .join("\n");
                  const selectedVariable = prompt(
                    `Selecione uma variável (digite o número):\n\n${variableList}`,
                  );

                  if (selectedVariable) {
                    const index = parseInt(selectedVariable) - 1;
                    if (index >= 0 && index < variables.length) {
                      const variable = variables[index];
                      const variableHtml = `<span class="variable-placeholder">${variable.value}</span>`;
                      editor.insertContent(variableHtml);
                    }
                  }
                };

                // Add custom buttons
                editor.ui.registry.addButton("signature", {
                  text: "Assinatura",
                  tooltip: "Inserir campo de assinatura",
                  onAction: insertSignature,
                });

                editor.ui.registry.addButton("variables", {
                  text: "Variáveis",
                  tooltip: "Inserir variável do contrato",
                  onAction: insertVariable,
                });
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ContractTemplateEditor;
