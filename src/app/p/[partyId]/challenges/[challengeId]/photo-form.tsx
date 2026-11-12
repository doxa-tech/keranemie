"use client";

import imageCompression from "browser-image-compression";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { createUpload, submitPhoto } from "./actions";
import { showResult } from "./text-form";

export function PhotoForm({
  partyId,
  challengeId,
}: {
  partyId: string;
  challengeId: string;
}) {
  const t = useTranslations("Submit");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Frees the previous preview when it changes, and the last one on unmount.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // A submit handler rather than a form action: React resets forms after
  // actions, which would clear the chosen file if the upload fails.
  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    const caption = String(new FormData(event.currentTarget).get("caption") ?? "");
    startTransition(async () => {
      try {
        // Resized in the browser: faster uploads on mobile networks.
        const compressed = await imageCompression(file, {
          maxWidthOrHeight: 1600,
          maxSizeMB: 1,
          fileType: "image/jpeg",
          initialQuality: 0.8,
          useWebWorker: false,
        });
        const upload = await createUpload(partyId, challengeId);
        if (!upload) {
          toast.error(t("errors.unavailable"));
          return;
        }
        const { error } = await createClient()
          .storage.from("photos")
          .uploadToSignedUrl(upload.path, upload.token, compressed, {
            contentType: "image/jpeg",
          });
        if (error) throw error;
        showResult(
          await submitPhoto(partyId, challengeId, upload.path, caption),
          t,
        );
      } catch (error) {
        console.error(error);
        toast.error(t("errors.upload"));
      }
    });
  }

  return (
    <form onSubmit={send} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="photo">{t("photo")}</Label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          required
          onChange={(e) => {
            const selected = e.target.files?.[0] ?? null;
            setFile(selected);
            setPreview(selected ? URL.createObjectURL(selected) : null);
          }}
          className="h-auto py-2"
        />
      </div>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview
        <img
          src={preview}
          alt={t("preview")}
          className="max-h-80 w-full rounded-lg object-contain"
        />
      )}
      <div className="space-y-2">
        <Label htmlFor="caption">{t("caption")}</Label>
        <Input id="caption" name="caption" maxLength={300} />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || !file}
      >
        {pending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
