"use client";

import * as React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ colors, selected, onSelect }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <Button
          key={color}
          type="button"
          variant="outline"
          className={cn(
            "h-8 w-8 rounded-full p-0",
            selected === color && "ring-2 ring-offset-2"
          )}
          style={{ backgroundColor: color }}
          onClick={() => onSelect(color)}
        />
      ))}
    </div>
  );
}