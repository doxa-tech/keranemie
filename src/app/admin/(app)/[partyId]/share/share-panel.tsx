"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Code, link and QR code, with a full-screen mode for projection.
export function SharePanel({
  code,
  url,
  qrSvg,
  partyName,
}: {
  code: string;
  url: string;
  qrSvg: string;
  partyName: string;
}) {
  const t = useTranslations("Share");
  const panelRef = useRef<HTMLDivElement>(null);
  const isFullScreen = useSyncExternalStore(
    subscribeFullScreen,
    () => document.fullscreenElement !== null,
    () => false,
  );
  const [copying, setCopying] = useState(false);

  async function copyLink() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied"));
    } finally {
      setCopying(false);
    }
  }

  return (
    <div
      ref={panelRef}
      className="bg-background flex flex-col items-center gap-6 rounded-xl border p-6 text-center data-[fullscreen=true]:justify-center data-[fullscreen=true]:border-0"
      data-fullscreen={isFullScreen}
    >
      {isFullScreen && (
        <p className="text-3xl font-semibold">{partyName}</p>
      )}
      <p className="text-muted-foreground">{t("instructions")}</p>
      <div
        role="img"
        aria-label={t("qrAlt")}
        className="w-full max-w-64 [&_svg]:h-auto [&_svg]:w-full data-[fullscreen=true]:max-w-[60vh]"
        data-fullscreen={isFullScreen}
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
      <p
        className="font-mono text-4xl font-bold tracking-[0.3em] data-[fullscreen=true]:text-7xl"
        data-fullscreen={isFullScreen}
        data-testid="join-code"
      >
        {code}
      </p>
      <p className="text-muted-foreground text-sm break-all">{url}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {!isFullScreen && (
          <Button variant="outline" onClick={copyLink} disabled={copying}>
            {t("copyLink")}
          </Button>
        )}
        <Button
          variant={isFullScreen ? "ghost" : "default"}
          onClick={() =>
            isFullScreen
              ? document.exitFullscreen()
              : panelRef.current?.requestFullscreen()
          }
        >
          {isFullScreen ? t("exitFullScreen") : t("fullScreen")}
        </Button>
      </div>
    </div>
  );
}

function subscribeFullScreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}
