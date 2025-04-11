import React from "react";
import { Input } from "./input";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  minTime?: string;
  maxTime?: string;
  step?: number;
}

export function TimePicker({
  value,
  onChange,
  minTime = "00:00",
  maxTime = "23:59",
  step = 30,
}: TimePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    if (time >= minTime && time <= maxTime) {
      onChange(time);
    }
  };

  return (
    <Input
      type="time"
      value={value}
      onChange={handleChange}
      min={minTime}
      max={maxTime}
      step={step}
      className="w-full"
    />
  );
}