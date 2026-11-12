// The photo or the answer of a submission. `photoUrl` is a signed URL.
export function SubmissionContent({
  submission,
  photoUrl,
  alt,
  compact = false,
}: {
  submission: {
    textAnswer: string | null;
    caption: string | null;
  };
  photoUrl?: string;
  alt: string;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
        <img
          src={photoUrl}
          alt={submission.caption ?? alt}
          loading="lazy"
          className={
            compact
              ? "aspect-square w-full rounded-lg object-cover"
              : "max-h-[60vh] w-full rounded-lg object-contain"
          }
        />
      )}
      {submission.textAnswer && (
        <p className="bg-muted rounded-lg p-3 whitespace-pre-line">
          {submission.textAnswer}
        </p>
      )}
      {submission.caption && (
        <p className="text-muted-foreground text-sm">{submission.caption}</p>
      )}
    </div>
  );
}
