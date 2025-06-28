import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { Upload, Play, Trash2 } from "lucide-react";
import { Operation } from "../../core/types/cache.types.js";

export function MemoryAddressInput({
  onSingleAccess,
  onFileLoad,
  onClearHistory,
  disabled = false,
  accessHistory = [],
}) {
  const [address, setAddress] = useState("");
  const [operation, setOperation] = useState(Operation.READ);
  const [error, setError] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const validateAddress = (addr) => {
    const cleanAddr = addr.replace(/^0x/i, "").trim();

    if (!cleanAddr) {
      return "Endereço não pode estar vazio";
    }

    if (!/^[0-9a-fA-F]+$/.test(cleanAddr)) {
      return "Endereço deve ser hexadecimal válido";
    }

    if (cleanAddr.length > 8) {
      return "Endereço muito grande (máx 32 bits)";
    }

    return null;
  };

  const handleSingleAccess = () => {
    const addrError = validateAddress(address);
    if (addrError) {
      setError(addrError);
      return;
    }

    setError("");
    const cleanAddr = address.replace(/^0x/i, "").padStart(8, "0");

    try {
      onSingleAccess(cleanAddr, operation);
      setAddress("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileLoad = () => {
    const content = fileContent.trim();

    if (!content) {
      setError("Arquivo não pode estar vazio");
      return;
    }

    // Validação básica do formato
    const lines = content
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"));

    if (lines.length === 0) {
      setError("Nenhum acesso válido encontrado no arquivo");
      return;
    }

    try {
      onFileLoad(content);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setError(""); // Limpar erros anteriores

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setFileContent(content);

      // Validar e carregar imediatamente
      if (content && content.trim()) {
        const lines = content
          .split("\n")
          .filter((line) => line.trim() && !line.startsWith("#"));

        if (lines.length > 0) {
          try {
            onFileLoad(content);
            setError("");
          } catch (err) {
            setError(`Erro ao processar arquivo: ${err.message}`);
          }
        } else {
          setError("Arquivo não contém acessos válidos");
        }
      } else {
        setError("Arquivo está vazio ou corrompido");
      }
    };

    reader.onerror = () => {
      setError("Erro ao ler o arquivo");
    };

    reader.readAsText(file);
  };

  // Funções para drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      const validExtensions = [".cache", ".txt", ".trace"];
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();

      if (validExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        setError("");

        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          setFileContent(content);

          if (content && content.trim()) {
            try {
              onFileLoad(content);
              setError("");
            } catch (err) {
              setError(`Erro ao processar arquivo: ${err.message}`);
            }
          }
        };
        reader.readAsText(file);
      } else {
        setError(
          "Formato de arquivo não suportado. Use .cache, .txt ou .trace"
        );
      }
    }
  };

  const generateSampleData = () => {
    const sampleData = [
      "# Arquivo de exemplo",
      "0020a858 R",
      "05fea840 W",
      "001947a0 R",
      "0020a868 R",
      "001947c0 R",
      "FF00FF00 W",
      "12345678 R",
      "ABCDEF00 W",
    ].join("\n");

    setFileContent(sampleData);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileContent("");
    document.getElementById("file-upload").value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrada de Endereços</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Acesso Individual */}
        <div className="space-y-4">
          <h4 className="font-medium">Acesso Individual</h4>

          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1">
              <Label htmlFor="address">Endereço (hex)</Label>
              <Input
                id="address"
                placeholder="Ex: 1A2B3C4D ou 0x1A2B3C4D"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="w-full md:w-32">
              <Label htmlFor="operation">Operação</Label>
              <Select
                className="w-full"
                value={operation}
                onValueChange={setOperation}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Operation.READ}>Leitura (R)</SelectItem>
                  <SelectItem value={Operation.WRITE}>Escrita (W)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSingleAccess}
            disabled={disabled || !address.trim()}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Executar Acesso
          </Button>
        </div>

        {/* Upload de Arquivo Melhorado */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Arquivo de Trace</h4>

          {/* Área de Drag & Drop */}
          <div
            className={`
      border-2 border-dashed rounded-lg p-6 text-center transition-all
      ${
        dragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      }
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() =>
              !disabled && document.getElementById("file-upload").click()
            }
          >
            <input
              id="file-upload"
              type="file"
              accept=".cache,.txt,.trace"
              onChange={handleFileUpload}
              disabled={disabled}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">
                    {selectedFile.name}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Arquivo carregado com sucesso
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  disabled={disabled}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Clique para selecionar ou arraste o arquivo aqui
                  </p>
                  <p className="text-xs text-gray-500">
                    Suporta .cache, .txt, .trace
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Exemplo e textarea só aparecem se não há arquivo selecionado */}
          {!selectedFile && (
            <>
              <div>
                <Label htmlFor="file-content">
                  Ou cole o conteúdo manualmente
                </Label>
                <textarea
                  id="file-content"
                  className="w-full h-32 p-2 border rounded-md text-sm font-mono"
                  placeholder="Cole o conteúdo do arquivo aqui ou use o botão acima..."
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  disabled={disabled}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4 md:gap-2">
                <Button
                  onClick={handleFileLoad}
                  disabled={disabled || !fileContent.trim()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Carregar Trace
                </Button>

                <Button
                  variant="outline"
                  onClick={generateSampleData}
                  disabled={disabled}
                >
                  Exemplo
                </Button>
              </div>
            </>
          )}

          {/* Mostrar info do arquivo quando há arquivo carregado */}
          {selectedFile && fileContent && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Arquivo:</strong> {selectedFile.name}
                </div>
                <div>
                  <strong>Tamanho:</strong>{" "}
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
                <div>
                  <strong>Linhas:</strong>{" "}
                  {fileContent.split("\n").filter((line) => line.trim()).length}
                </div>
                <div>
                  <strong>Acessos:</strong>{" "}
                  {
                    fileContent
                      .split("\n")
                      .filter((line) => line.trim() && !line.startsWith("#"))
                      .length
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
