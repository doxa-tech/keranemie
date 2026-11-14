"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { parseTime } from "@/lib/time";

// A local date and time picker that submits an ISO (UTC) value under `name`.
// The date uses the device's picker; the time is typed in 24-hour format,
// because the native time pickers follow the device's 12/24h setting.
// `defaultValue` is "YYYY-MM-DDTHH:mm" in the user's time zone (see
// toLocalInputValue), computed on the server so both renders match. `id`
// goes to the date input (for its <Label>); `label` names the time input.
export function DateTimeField({
  id,
  name,
  label,
  defaultValue = "",
  required,
  onLocalChange,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  onLocalChange?: (local: string) => void;
}) {
  const t = useTranslations("Common");
  const [date, setDate] = useState(defaultValue.slice(0, 10));
  const [time, setTime] = useState(defaultValue.slice(11, 16));
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const parsedTime = parseTime(time);
  const local = date && parsedTime ? `${date}T${parsedTime}` : "";
  // The UTC value depends on the device time zone: only computed in the
  // browser, after hydration.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  // An optional field is either empty or complete: half of it would be
  // submitted as no value at all.
  useEffect(() => {
    timeRef.current?.setCustomValidity(
      time && !parsedTime
        ? t("invalidTime")
        : date && !time
          ? t("dateAndTime")
          : "",
    );
    dateRef.current?.setCustomValidity(time && !date ? t("dateAndTime") : "");
  }, [date, time, parsedTime, t]);

  function update(nextDate: string, nextTime: string) {
    setDate(nextDate);
    setTime(nextTime);
    const nextParsed = parseTime(nextTime);
    onLocalChange?.(nextDate && nextParsed ? `${nextDate}T${nextParsed}` : "");
  }

  return (
    <div className="flex gap-2">
      <Input
        ref={dateRef}
        id={id}
        type="date"
        value={date}
        onChange={(e) => update(e.target.value, time)}
        required={required}
        className="min-w-0 flex-1"
      />
      <Input
        ref={timeRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={t("timePlaceholder")}
        maxLength={5}
        aria-label={t("timeOf", { field: label })}
        value={time}
        onChange={(e) => update(date, e.target.value)}
        // Tidies "1830" or "18h30" into "18:30".
        onBlur={() => parsedTime && update(date, parsedTime)}
        required={required}
        className="w-20 text-center tabular-nums"
      />
      {mounted && (
        <input
          type="hidden"
          name={name}
          value={local ? new Date(local).toISOString() : ""}
        />
      )}
    </div>
  );
}

function noopSubscribe() {
  return () => {};
}
