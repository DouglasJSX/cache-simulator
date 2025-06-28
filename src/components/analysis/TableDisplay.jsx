import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ChevronUp, ChevronDown, Search, Eye } from "lucide-react";
import {
  formatToFourDecimals,
  formatPercentage,
  formatTime,
  formatInteger,
  formatBytes,
  isValidNumber,
} from "../../core/utils/formatters.js";

export function TableDisplay({
  data = [],
  title = "Resultados da Simulação",
  columns = [],
  className = "",
  exportable = true,
  searchable = true,
  sortable = true,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Nenhum resultado disponível para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtragem por busca
  const filteredData = searchable
    ? data.filter((row) =>
        Object.values(row).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // Ordenação
  const extractNumericValue = (value) => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const cleanValue = value.toString().toLowerCase().trim();
      const numericMatch = cleanValue.match(/^(\d+(?:\.\d+)?)/);

      if (numericMatch) {
        const number = parseFloat(numericMatch[1]);

        if (cleanValue.includes("kb")) {
          return number * 1024;
        } else if (cleanValue.includes("mb")) {
          return number * 1024 * 1024;
        } else if (cleanValue.includes("gb")) {
          return number * 1024 * 1024 * 1024;
        } else if (cleanValue.includes("tb")) {
          return number * 1024 * 1024 * 1024 * 1024;
        } else if (cleanValue.includes("b") && !cleanValue.includes("kb")) {
          return number;
        } else if (cleanValue.includes("%")) {
          return number;
        } else if (cleanValue.includes("ns")) {
          return number;
        } else if (cleanValue.includes("ms")) {
          return number * 1000000;
        } else if (
          cleanValue.includes("s") &&
          !cleanValue.includes("ns") &&
          !cleanValue.includes("ms")
        ) {
          return number * 1000000000;
        }

        return number;
      }
    }

    return 0;
  };

  const sortedData =
    sortable && sortConfig.key
      ? [...filteredData].sort((a, b) => {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];

          const aNumeric = extractNumericValue(aValue);
          const bNumeric = extractNumericValue(bValue);

          if (
            aNumeric !== 0 ||
            bNumeric !== 0 ||
            (typeof aValue === "number" && typeof bValue === "number")
          ) {
            return sortConfig.direction === "asc"
              ? aNumeric - bNumeric
              : bNumeric - aNumeric;
          }

          const aStr = aValue.toString().toLowerCase();
          const bStr = bValue.toString().toLowerCase();

          if (sortConfig.direction === "asc") {
            return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
          } else {
            return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
          }
        })
      : filteredData;

  const handleSort = (key) => {
    if (!sortable) return;

    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const formatCellValue = (value, column) => {
    if (column.formatter) {
      return column.formatter(value);
    }

    if (!isValidNumber(value) && typeof value !== "string") {
      return value;
    }

    if (typeof value === "number") {
      if (column.key.includes("Rate") || column.key.includes("Percentage")) {
        return formatPercentage(value); // 4 casas decimais
      }
      if (column.key.includes("Time")) {
        return formatTime(value); // 4 casas decimais
      }
      if (
        column.key.includes("Size") ||
        column.key.includes("Cache") ||
        column.key.includes("Block") ||
        column.key.includes("Line") ||
        column.key.includes("Byte") ||
        column.key.includes("Tamanho") ||
        column.label?.includes("Tamanho") ||
        column.label?.includes("Cache") ||
        column.label?.includes("KB") ||
        column.label?.includes("MB")
      ) {
        return formatBytes(value); // SEM decimais -> 2KB, 4KB, 16KB
      }
      if (
        column.key.includes("Reads") ||
        column.key.includes("Writes") ||
        column.key.includes("Accesses") ||
        column.key.includes("Hits") ||
        column.key.includes("Misses") ||
        column.key.includes("Lines") ||
        column.key.includes("Count") ||
        column.key.includes("total") ||
        column.key.includes("Total") ||
        column.key.includes("Number") ||
        column.key.includes("Blocks")
      ) {
        return formatInteger(value); // SEM decimais
      }
      // Para outros números reais, 4 casas decimais
      return formatToFourDecimals(value);
    }

    return value;
  };

  const getCellClassName = (value, column) => {
    if (column.highlight) {
      return column.highlight(value);
    }

    // Destaque automático para valores extremos
    if (typeof value === "number" && column.key.includes("Rate")) {
      if (value >= 90) return "bg-green-50 text-green-800";
      if (value <= 50) return "bg-red-50 text-red-800";
      if (value <= 70) return "bg-yellow-50 text-yellow-800";
    }

    return "";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col md:flex-row gap-2 md:gap-0 justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            {/* Column visibility toggle */}
            <div className="relative group">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                Colunas
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 hidden group-hover:block z-10 w-48">
                {columns.map((column) => (
                  <label
                    key={column.key}
                    className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[column.key]}
                      onChange={() => toggleColumnVisibility(column.key)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {searchable && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar nos resultados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                {columns
                  .filter((col) => visibleColumns[col.key])
                  .map((column) => (
                    <th
                      key={column.key}
                      className={`text-left p-3 font-medium text-gray-900 ${
                        sortable ? "cursor-pointer hover:bg-gray-100" : ""
                      }`}
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        <span>{column.label}</span>
                        {sortable && (
                          <div className="flex flex-col">
                            <ChevronUp
                              className={`w-3 h-3 ${
                                sortConfig.key === column.key &&
                                sortConfig.direction === "asc"
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                            />
                            <ChevronDown
                              className={`w-3 h-3 -mt-1 ${
                                sortConfig.key === column.key &&
                                sortConfig.direction === "desc"
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {sortedData.map((row, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  {columns
                    .filter((col) => visibleColumns[col.key])
                    .map((column) => (
                      <td
                        key={column.key}
                        className={`p-3 ${getCellClassName(
                          row[column.key],
                          column
                        )}`}
                      >
                        {formatCellValue(row[column.key], column)}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center text-sm text-gray-600">
          <div>
            Mostrando {sortedData.length} de {data.length} resultados
            {searchTerm && ` (filtrado por "${searchTerm}")`}
          </div>

          {sortedData.length > 0 && (
            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
              {columns
                .filter(
                  (col) =>
                    visibleColumns[col.key] &&
                    typeof sortedData[0][col.key] === "number"
                )
                .map((column) => {
                  const values = sortedData.map((row) => row[column.key]);
                  const avg =
                    values.reduce((sum, val) => sum + val, 0) / values.length;

                  return (
                    <div key={column.key} className="text-center">
                      <div className="font-medium">
                        {formatCellValue(avg, column)}
                      </div>
                      <div className="text-xs">Média {column.label}</div>
                    </div>
                  );
                })
                .slice(0, 3)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
