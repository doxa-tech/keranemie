"use client";

import { useState, useSyncExternalStore } from "react";
import { Input } from "@/components/ui/input";

// A local date and time picker that submits an ISO (UTC) value under `name`.
// `defaultValue` is "YYYY-MM-DDTHH:mm" in the user's time zone (see
// toLocalInputValue), computed on the server so both renders match.
export function DateTimeField({
  id,
  name,
  defaultValue = "",
  required,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [local, setLocal] = useState(defaultValue);
  // The UTC value depends on the device time zone: only computed in the
  // browser, after hydration.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  return (
    <>
      <Input
        id={id}
        type="datetime-local"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        required={required}
      />
      {mounted && (
        <input
          type="hidden"
          name={name}
          value={local ? new Date(local).toISOString() : ""}
        />
      )}
    </>
  );
}

function noopSubscribe() {
  return () => {};
}
