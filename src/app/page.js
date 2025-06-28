"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Play,
  BarChart3,
  Settings,
  FileText,
  Cpu,
  Zap,
  Target,
  Timer,
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: <Cpu className="w-8 h-8 text-blue-600" />,
      title: "Simulação Completa",
      description:
        "Simule cache associativa por conjunto com configurações personalizáveis",
    },
    {
      icon: <Target className="w-8 h-8 text-green-600" />,
      title: "Múltiplas Políticas",
      description: "Write-through, write-back, LRU e substituição aleatória",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
      title: "Análises Automatizadas",
      description: "Execute experimentos conforme especificado no TDE 2",
    },
    {
      icon: <Timer className="w-8 h-8 text-orange-600" />,
      title: "Visualização em Tempo Real",
      description: "Veja o estado da cache e estatísticas durante a simulação",
    },
  ];

  const experiments = [
    {
      title: "Impacto do Tamanho da Cache",
      description: "Analise como diferentes tamanhos afetam a taxa de acerto",
      config: "128 bytes/linha • Write-through • LRU • 4-way",
    },
    {
      title: "Impacto do Tamanho do Bloco",
      description:
        "Estude a localidade espacial com diferentes tamanhos de bloco",
      config: "8KB cache • Write-through • LRU • 2-way",
    },
    {
      title: "Impacto da Associatividade",
      description: "Compare diferentes níveis de associatividade",
      config: "128 bytes/linha • Write-back • LRU • 8KB cache",
    },
    {
      title: "Políticas de Substituição",
      description: "Compare LRU vs substituição aleatória",
      config: "128 bytes/linha • Write-through • 4-way",
    },
    {
      title: "Largura de Banda da Memória",
      description: "Analise tráfego entre write-through e write-back",
      config: "Múltiplas configurações • LRU",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4" />
            TDE 2 - Fundamentos de Arquitetura de Computadores
          </div>

          <h1 className="text-5xl font-bold text-gray-900">
            Simulador de <span className="text-blue-600">Memória Cache</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore o comportamento de diferentes configurações de cache através
            de simulações interativas e análises automatizadas baseadas nos
            conceitos da arquitetura Z70.
          </p>

          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <Link href="/simulator">
              <Button size="lg" className="px-8">
                <Play className="w-5 h-5 mr-2" />
                Iniciar Simulação
              </Button>
            </Link>

            <Link href="/analysis">
              <Button variant="outline" size="lg" className="px-8">
                <BarChart3 className="w-5 h-5 mr-2" />
                Ver Análises
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="text-center p-6 hover:shadow-lg transition-shadow"
            >
              <CardContent className="space-y-4">
                <div className="flex justify-center">{feature.icon}</div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Start */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Simulator Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Simulador Interativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Configure parâmetros da cache e execute acessos individuais ou
                carregue arquivos de trace para análise completa.
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Políticas de Escrita:</span>
                  <span>Write-through, Write-back</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Substituição:</span>
                  <span>LRU, Aleatória</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Associatividade:</span>
                  <span>1-way até 64-way</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tamanho do Bloco:</span>
                  <span>8B até 4KB</span>
                </div>
              </div>

              <Link href="/simulator">
                <Button className="w-full mt-4">
                  <Play className="w-4 h-4 mr-2" />
                  Abrir Simulador
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Analysis Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Análises Automatizadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Execute os experimentos especificados no TDE 2 automaticamente e
                gere gráficos e relatórios detalhados.
              </p>

              <div className="space-y-2">
                {[
                  "Tamanho da Cache",
                  "Tamanho do Bloco",
                  "Associatividade",
                  "Política de Substituição",
                ].map((analysis, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>{analysis}</span>
                  </div>
                ))}
              </div>

              <Link href="/analysis">
                <Button variant="outline" className="w-full mt-4">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Ver Análises
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Experiments Overview */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8">
            Experimentos do TDE 2
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiments.map((experiment, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {experiment.title}
                    </CardTitle>
                    <Badge variant="secondary">{index + 1}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-600 text-sm">
                    {experiment.description}
                  </p>
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <strong>Configuração:</strong> {experiment.config}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Como Começar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-semibold">Configure a Cache</h3>
                <p className="text-sm text-gray-600">
                  Defina tamanho da linha, número de linhas, associatividade e
                  políticas de escrita e substituição.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-semibold">Carregue os Dados</h3>
                <p className="text-sm text-gray-600">
                  Use arquivos de trace (teste.cache ou oficial.cache) ou insira
                  endereços manualmente.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-semibold">Analise Resultados</h3>
                <p className="text-sm text-gray-600">
                  Visualize estatísticas, gráficos e exporte relatórios
                  detalhados para seu TDE.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 border-t flex flex-col items-center justify-center">
          <p className="text-gray-600">
            Desenvolvido para a disciplina{" "}
            <strong>
              FBI4019 - Fundamentos de Arquitetura de Computadores
            </strong>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Baseado na Arquitetura Hipotética Z70 e especificações do TDE 2
          </p>
          <div className="text-center text-sm text-gray-500 mt-4 flex flex-col md:flex-row md:gap-2">
            Desenvolvido por{" "}
            <p className="text-gray-600 font-bold hover:text-gray-700 duration-300">
              Douglas Marcon Zamboni
            </p>{" "}
            e{" "}
            <p className="text-gray-600 font-bold hover:text-gray-700 duration-300">
              Johan David Cedeno Gonzalez
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
