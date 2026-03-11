import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard = ({ className }: SkeletonCardProps) => (
  <div className={cn("rounded-xl border border-border bg-card p-4 shadow-soft animate-pulse", className)}>
    <div className="aspect-[4/3] w-full rounded-lg bg-muted mb-4" />
    <div className="h-5 w-3/4 rounded bg-muted mb-2" />
    <div className="h-4 w-1/2 rounded bg-muted mb-3" />
    <div className="h-3 w-full rounded bg-muted mb-1" />
    <div className="h-3 w-2/3 rounded bg-muted" />
  </div>
);

export const SkeletonMemorialDetail = () => (
  <div className="animate-pulse">
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 h-40 w-40 rounded-full bg-muted md:h-52 md:w-52" />
      <div className="mb-2 h-8 w-64 rounded bg-muted" />
      <div className="mb-4 h-4 w-40 rounded bg-muted" />
      <div className="mb-6 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-muted" />
        <div className="h-6 w-20 rounded-full bg-muted" />
      </div>
      <div className="space-y-2 w-full max-w-xl">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-4 w-4/6 rounded bg-muted" />
      </div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="animate-pulse space-y-3">
    <div className="h-10 w-full rounded bg-muted" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 w-full rounded bg-muted/60" />
    ))}
  </div>
);

export const SkeletonLine = ({ width = "w-full" }: { width?: string }) => (
  <div className={`h-4 ${width} rounded bg-muted animate-pulse`} />
);
