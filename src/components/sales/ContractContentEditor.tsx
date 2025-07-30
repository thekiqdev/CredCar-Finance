import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, FileText } from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import { contractTemplateService } from "../../lib/supabase";

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

interface ContractContentEditorProps {
  selectedTable: CommissionTable;
  selectedQuota: Quota;
  selectedGroup: Group;
  clientData: ClientData;
  onContentSubmit: (content: string) => void;
  onBack: () => void;
}

const ContractContentEditor: React.FC<ContractContentEditorProps> = ({
  selectedTable,
  selectedQuota,
  selectedGroup,
  clientData,
  onContentSubmit,
  onBack,
}) => {
  const editorRef = useRef<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const getDefaultContent = () =>
    `
<h1>CONTRATO DE CONSÓRCIO</h1>

<h2>DADOS DO CLIENTE</h2>
<p><strong>Nome:</strong> ${clientData.full_name}</p>
<p><strong>Email:</strong> ${clientData.email}</p>
<p><strong>Telefone:</strong> ${clientData.phone}</p>
<p><strong>CPF/CNPJ:</strong> ${clientData.cpf_cnpj}</p>
<p><strong>Endereço:</strong> ${clientData.address}</p>

<h2>DADOS DO GRUPO</h2>
<p><strong>Grupo:</strong> ${selectedGroup.name}</p>
<p><strong>Descrição:</strong> ${selectedGroup.description}</p>
<p><strong>Cota:</strong> ${selectedQuota.quota_number}</p>

<h2>TABELA DE COMISSÃO</h2>
<p><strong>Tabela:</strong> ${selectedTable.name}</p>
<p><strong>Percentual de Comissão:</strong> ${selectedTable.commission_percentage}%</p>
<p><strong>Detalhes de Pagamento:</strong> ${selectedTable.payment_details}</p>

<h2>TERMOS E CONDIÇÕES</h2>
<p>Este contrato estabelece os termos e condições para participação no consórcio...</p>

<h3>CLÁUSULA 1 - DO OBJETO</h3>
<p>O presente contrato tem por objeto a participação do cliente no grupo de consórcio...</p>

<h3>CLÁUSULA 2 - DAS OBRIGAÇÕES</h3>
<p>São obrigações do consorciado:</p>
<ul>
  <li>Efetuar o pagamento das parcelas mensais;</li>
  <li>Manter seus dados atualizados;</li>
  <li>Cumprir as normas do grupo;</li>
</ul>

<h3>CLÁUSULA 3 - DA CONTEMPLAÇÃO</h3>
<p>A contemplação poderá ocorrer por sorteio ou lance...</p>

<p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
<p><strong>Assinatura do Cliente:</strong> _________________________</p>
<p><strong>Assinatura do Representante:</strong> _________________________</p>
  `.trim();

  const handleSubmit = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      if (content.trim()) {
        onContentSubmit(content);
      } else {
        alert("Por favor, insira o conteúdo do contrato.");
      }
    }
  };

  // Removido o handleEditorChange para evitar re-renderizações desnecessárias
  // O TinyMCE gerencia seu próprio estado interno

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const data = await contractTemplateService.getAll(true); // Load all templates including admin ones
        console.log("Loaded templates:", data);
        setTemplates(data);
      } catch (error) {
        console.error("Error loading templates:", error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  // Handle template selection
  const handleTemplateSelect = async (templateId: string) => {
    if (
      !templateId ||
      templateId === "blank" ||
      templateId === "no-templates"
    ) {
      if (templateId === "blank" && editorRef.current) {
        // Reset to default content for blank template
        editorRef.current.setContent(getDefaultContent());
      }
      return;
    }

    try {
      console.log("Loading template with ID:", templateId);
      const template = await contractTemplateService.getById(
        parseInt(templateId),
      );
      console.log("Loaded template:", template);

      if (template && editorRef.current) {
        // Replace variables in template content
        let content = template.content;

        // Replace client variables
        content = content.replace(/{{CLIENTE_NOME}}/g, clientData.full_name);
        content = content.replace(/{{CLIENTE_EMAIL}}/g, clientData.email);
        content = content.replace(/{{CLIENTE_TELEFONE}}/g, clientData.phone);
        content = content.replace(/{{CLIENTE_CPF_CNPJ}}/g, clientData.cpf_cnpj);
        content = content.replace(/{{CLIENTE_ENDERECO}}/g, clientData.address);

        // Replace group variables
        content = content.replace(/{{GRUPO_NOME}}/g, selectedGroup.name);
        content = content.replace(
          /{{GRUPO_DESCRICAO}}/g,
          selectedGroup.description,
        );

        // Replace quota variables
        content = content.replace(
          /{{COTA_NUMERO}}/g,
          selectedQuota.quota_number.toString(),
        );

        // Replace commission table variables
        content = content.replace(/{{TABELA_NOME}}/g, selectedTable.name);
        content = content.replace(
          /{{TABELA_PERCENTUAL}}/g,
          selectedTable.commission_percentage.toString(),
        );
        content = content.replace(
          /{{TABELA_DETALHES}}/g,
          selectedTable.payment_details,
        );

        // Replace date variables
        content = content.replace(
          /{{DATA_ATUAL}}/g,
          new Date().toLocaleDateString("pt-BR"),
        );

        console.log("Setting template content in editor");
        editorRef.current.setContent(content);
      }
    } catch (error) {
      console.error("Error loading template:", error);
      alert("Erro ao carregar modelo. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Template Selection Bar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <Label htmlFor="template-select" className="text-sm font-medium">
                Modelo de Contrato:
              </Label>
            </div>
            <Select
              value={selectedTemplateId}
              onValueChange={(value) => {
                setSelectedTemplateId(value);
                handleTemplateSelect(value);
              }}
              disabled={isLoadingTemplates}
            >
              <SelectTrigger className="w-64">
                <SelectValue
                  placeholder={
                    isLoadingTemplates
                      ? "Carregando modelos..."
                      : "Selecione um modelo"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">
                  <span className="text-gray-500">Modelo em branco</span>
                </SelectItem>
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <SelectItem
                      key={template.id}
                      value={template.id.toString()}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{template.name}</span>
                        {template.description && (
                          <span className="text-xs text-gray-500">
                            - {template.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-templates" disabled>
                    <span className="text-gray-400">
                      Nenhum modelo disponível
                    </span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Top Information Bar */}
      <div className="bg-gray-50 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>

            <div className="flex items-center space-x-8">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Cliente:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {clientData.full_name}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Grupo:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {selectedGroup.name}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Cota:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {selectedQuota.quota_number}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Comissão:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {selectedTable.name} ({selectedTable.commission_percentage}%)
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar e Continuar</span>
          </Button>
        </div>
      </div>

      {/* Full Screen Editor */}
      <div className="h-[calc(100vh-140px)] p-6">
        <div className="h-full">
          <Editor
            apiKey="8b0xydth3kx0va6g1ekaakj4p0snbelodd1df6m9ps5u6rnn"
            onInit={(evt, editor) => (editorRef.current = editor)}
            initialValue={getDefaultContent()}
            init={{
              height: "calc(100vh - 260px)",
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
                "link image media | signature | code preview fullscreen",
              content_style:
                "body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; line-height: 1.4; } .tox-promotion { display: none !important; }",
              language: "pt_BR",
              branding: false,
              resize: false,
              statusbar: true,
              elementpath: false,
              setup: (editor) => {
                // Removido o listener de 'change' que causava re-renderizações

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

                // Add custom signature button
                editor.ui.registry.addButton("signature", {
                  text: "Assinatura",
                  tooltip: "Inserir campo de assinatura",
                  onAction: insertSignature,
                });

                // Add context menu item for inserting signature
                editor.ui.registry.addMenuItem("insertsignature", {
                  text: "Inserir Assinatura",
                  icon: "edit-block",
                  onAction: insertSignature,
                });

                // Add context menu
                editor.ui.registry.addContextMenu("insertsignature", {
                  update: (element) => {
                    return "insertsignature";
                  },
                });

                // Add context menu for editing signature fields
                editor.ui.registry.addContextMenu("signature", {
                  update: (element) => {
                    const signatureField = element.closest(".signature-field");
                    if (signatureField) {
                      return "editsignature";
                    }
                    return "";
                  },
                });

                // Add edit signature menu item
                editor.ui.registry.addMenuItem("editsignature", {
                  text: "Editar Assinatura",
                  onAction: () => {
                    const selectedElement = editor.selection.getNode();
                    const signatureField =
                      selectedElement.closest(".signature-field");

                    if (signatureField) {
                      const currentName = signatureField
                        .querySelector("div:last-child div:first-child")
                        .textContent.replace("Nome: ", "");
                      const currentCPF = signatureField
                        .querySelector("div:last-child div:last-child")
                        .textContent.replace("CPF: ", "");

                      const newName = prompt(
                        "Nome do signatário:",
                        currentName,
                      );
                      if (newName === null) return;

                      const newCPF = prompt("CPF do signatário:", currentCPF);
                      if (newCPF === null) return;

                      signatureField.querySelector(
                        "div:last-child div:first-child",
                      ).innerHTML = `<strong>Nome:</strong> ${newName}`;
                      signatureField.querySelector(
                        "div:last-child div:last-child",
                      ).innerHTML = `<strong>CPF:</strong> ${newCPF}`;
                    }
                  },
                });
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ContractContentEditor;
