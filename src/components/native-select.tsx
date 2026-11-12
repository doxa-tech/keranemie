import { cn } from "@/lib/utils";

// A styled native <select>: works in plain forms and on every phone.
export function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 text-base outline-none focus-visible:ring-3 disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
