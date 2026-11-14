"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { splitMinutes } from "@/lib/time";

type Choice = number | "custom" | "none";

// A duration picked from quick choices or typed in hours and minutes.
// Submits the total in minutes under `name`, or an empty value for the
// "until stopped" choice (`allowNone`). The group is named by the element
// with id `labelId`.
export function DurationField({
  name,
  labelId,
  presets,
  defaultValue,
  maxMinutes,
  allowNone = false,
  onChange,
}: {
  name: string;
  labelId: string;
  // Quick choices, in minutes.
  presets: number[];
  defaultValue: number | null;
  maxMinutes: number;
  allowNone?: boolean;
  onChange?: (minutes: number | null) => void;
}) {
  const t = useTranslations("Duration");
  const [choice, setChoice] = useState<Choice>(
    defaultValue === null
      ? "none"
      : presets.includes(defaultValue)
        ? defaultValue
        : "custom",
  );
  const initial = splitMinutes(defaultValue ?? presets[0]);
  const [hours, setHours] = useState(String(initial.hours));
  const [minutes, setMinutes] = useState(String(initial.minutes));
  const hoursRef = useRef<HTMLInputElement>(null);

  const customTotal = Number(hours || 0) * 60 + Number(minutes || 0);
  const customValid =
    Number.isInteger(customTotal) && customTotal >= 1 && customTotal <= maxMinutes;
  const total =
    choice === "custom"
      ? customValid
        ? customTotal
        : null
      : choice === "none"
        ? null
        : choice;

  useEffect(() => {
    hoursRef.current?.setCustomValidity(
      choice === "custom" && !customValid
        ? t("outOfRange", { max: label(maxMinutes) })
        : "",
    );
  });

  function label(value: number) {
    const { hours, minutes } = splitMinutes(value);
    if (hours === 0) return t("minutes", { count: minutes });
    if (minutes === 0) return t("hours", { count: hours });
    return t("hoursMinutes", { hours, minutes: String(minutes).padStart(2, "0") });
  }

  function choose(next: Choice) {
    setChoice(next);
    if (next === "custom") {
      // Start from the duration chosen so far.
      const parts = splitMinutes(typeof choice === "number" ? choice : presets[0]);
      setHours(String(parts.hours));
      setMinutes(String(parts.minutes));
      onChange?.(parts.hours * 60 + parts.minutes);
    } else {
      onChange?.(next === "none" ? null : next);
    }
  }

  function changeCustom(nextHours: string, nextMinutes: string) {
    setHours(nextHours);
    setMinutes(nextMinutes);
    const next = Number(nextHours || 0) * 60 + Number(nextMinutes || 0);
    onChange?.(next >= 1 && next <= maxMinutes ? next : null);
  }

  const chip = (value: Choice, text: string) => (
    <Button
      key={String(value)}
      type="button"
      variant={choice === value ? "default" : "outline"}
      aria-pressed={choice === value}
      onClick={() => choose(value)}
    >
      {text}
    </Button>
  );

  return (
    <div className="space-y-2">
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
        {presets.map((value) => chip(value, label(value)))}
        {chip("custom", t("custom"))}
        {allowNone && chip("none", t("untilStopped"))}
      </div>
      {choice === "custom" && (
        <div className="flex items-center gap-2 text-sm">
          <Input
            ref={hoursRef}
            type="number"
            inputMode="numeric"
            min={0}
            max={Math.floor(maxMinutes / 60)}
            aria-label={t("customHours")}
            value={hours}
            onChange={(e) => changeCustom(e.target.value, minutes)}
            className="w-20 tabular-nums"
          />
          <span aria-hidden>h</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            aria-label={t("customMinutes")}
            value={minutes}
            onChange={(e) => changeCustom(hours, e.target.value)}
            className="w-20 tabular-nums"
          />
          <span aria-hidden>min</span>
        </div>
      )}
      <input type="hidden" name={name} value={total ?? ""} />
    </div>
  );
}
