// src/components/layout/Header.jsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Cpu, Home, Settings, BarChart3, Github, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function Header() {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Simulador", href: "/simulator", icon: Settings },
    { name: "Análises", href: "/analysis", icon: BarChart3 },
  ];

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <Cpu className="h-8 w-8 text-blue-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">Cache Simulator</h1>
              <p className="text-xs text-gray-500">Arquitetura Z70</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                    size="sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-2">
            {/* TDE Badge */}
            <Badge variant="outline" className="hidden sm:flex">
              TDE 2
            </Badge>

            {/* GitHub Link */}
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">GitHub</span>
              </a>
            </Button>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          href={item.href}
                          className="flex items-center space-x-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
