export function LoadingSpinnerCard({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 shadow-lg">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {message}
        </span>
      </div>
    </div>
  );
}
