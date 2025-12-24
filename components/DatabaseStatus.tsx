"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Database, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DatabaseStatusProps {
  variant?: "header" | "sidebar";
}

export default function DatabaseStatus({ variant = "header" }: DatabaseStatusProps) {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const response = await fetch('/api/database/status');
        if (response.ok) {
          const data = await response.json();
          setIsConfigured(data.configured);
        }
      } catch (error) {
        console.error('Failed to check database status:', error);
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDatabase();
  }, []);

  const handleOpenDrizzleStudio = () => {
    window.open('http://localhost:4984', '_blank');
    toast({
      description: "Opening Drizzle Studio...",
    });
  };

  if (isLoading) {
    return null;
  }

  // Sidebar variant
  if (variant === "sidebar") {
    if (!isConfigured) {
      return (
        <li className="sidebar-nav-item opacity-50 cursor-default">
          <Database className="w-6 h-6 nav-icon" />
          <p className="hidden lg:block">No Database</p>
        </li>
      );
    }

    return (
      <>
        <li className="sidebar-nav-item bg-brand/10">
          <Database className="w-6 h-6 nav-icon-active" />
          <p className="hidden lg:block">Database</p>
        </li>
        <li>
          <button
            onClick={handleOpenDrizzleStudio}
            className="sidebar-nav-item hover:bg-light-300 cursor-pointer"
            title="Open Drizzle Studio"
          >
            <ExternalLink className="w-6 h-6 nav-icon" />
            <p className="hidden lg:block">DB Studio</p>
          </button>
        </li>
      </>
    );
  }

  // Header variant
  if (!isConfigured) {
    return (
      <Button
        type="button"
        variant="outline"
        className="button h-[40px] px-4 rounded-full border border-light-300 bg-white text-light-200 hover:bg-light-300 shadow-drop-1"
        title="Database not configured. Add DATABASE_URL to .env.local"
      >
        <Database className="w-4 h-4 mr-2 opacity-50" />
        No DB
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="button h-[40px] px-4 rounded-full border border-light-300 bg-brand/10 text-brand hover:bg-brand/20 shadow-drop-1"
        title="Database is configured and connected"
      >
        <Database className="w-4 h-4 mr-2" />
        DB
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={handleOpenDrizzleStudio}
        className="button h-[40px] w-[40px] rounded-full border border-light-300 bg-white text-light-100 hover:bg-light-300 shadow-drop-1 flex-center p-0"
        title="Open Drizzle Studio to view database"
      >
        <ExternalLink className="w-4 h-4" />
      </Button>
    </div>
  );
}
