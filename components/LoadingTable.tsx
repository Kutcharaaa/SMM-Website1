type LoadingTableProps = {
  rows?: number;
};

export default function LoadingTable({ rows = 5 }: LoadingTableProps) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
      <div className="animate-pulse">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-4 gap-6 border-b border-zinc-900 p-5"
          >
            <div className="h-4 rounded bg-zinc-800" />
            <div className="h-4 rounded bg-zinc-800" />
            <div className="h-4 rounded bg-zinc-800" />
            <div className="h-4 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}