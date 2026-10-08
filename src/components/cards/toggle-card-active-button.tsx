"use client";

import {useState} from "react";
import {toggleCardActive} from "@/app/[locale]/(app)/cards/toggle-active-action";
import {Button} from "@/components/ui/button";
import {PowerIcon} from "lucide-react";

interface ToggleCardActiveButtonProps {
  cardId: string;
  isActive: boolean;
}

export function ToggleCardActiveButton({cardId, isActive}: ToggleCardActiveButtonProps) {
  const [isToggling, setIsToggling] = useState(false);

  async function handleToggle() {
    try {
      setIsToggling(true);
      await toggleCardActive(cardId);
    } catch (error) {
      console.error("Erro ao alternar cartão:", error);
      alert("Erro ao alternar estado do cartão.");
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <Button
      variant={isActive ? "outline" : "secondary"}
      size="sm"
      onClick={handleToggle}
      disabled={isToggling}
      className={isActive ? "text-emerald-300" : "text-slate-400"}
    >
      <PowerIcon className="h-4 w-4 mr-2" />
      {isActive ? "Desativar" : "Ativar"}
    </Button>
  );
}