// src/components/simulator/MemoryAddressInput.jsx
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
    if (!fileContent.trim()) {
      setError("Arquivo não pode estar vazio");
      return;
    }

    try {
      onFileLoad(fileContent);
      setFileContent("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
    };
    reader.readAsText(file);
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

          <div className="flex gap-2">
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

            <div className="w-32">
              <Label htmlFor="operation">Operação</Label>
              <Select
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

        {/* Upload de Arquivo */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Arquivo de Trace</h4>

          <div>
            <Label htmlFor="file-upload">Carregar Arquivo</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".cache,.txt,.trace"
              onChange={handleFileUpload}
              disabled={disabled}
            />
          </div>

          <div>
            <Label htmlFor="file-content">Conteúdo do Arquivo</Label>
            <textarea
              id="file-content"
              className="w-full h-32 p-2 border rounded-md text-sm font-mono"
              placeholder="Cole o conteúdo do arquivo aqui ou use o botão acima..."
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="flex gap-2">
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
        </div>

        {/* Histórico de Acessos */}
        {accessHistory.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">
                Histórico ({accessHistory.length} acessos)
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearHistory}
                disabled={disabled}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            </div>

            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {accessHistory.slice(-10).map((access, index) => (
                <div
                  key={index}
                  className="text-sm font-mono py-1 flex justify-between"
                >
                  <span>0x{access.address}</span>
                  <span
                    className={
                      access.operation === "R"
                        ? "text-blue-600"
                        : "text-green-600"
                    }
                  >
                    {access.operation}
                  </span>
                  <span
                    className={access.hit ? "text-green-600" : "text-red-600"}
                  >
                    {access.hit ? "HIT" : "MISS"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
