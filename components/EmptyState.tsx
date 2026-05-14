type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
};

export default function EmptyState({
  title,
  description,
  icon = "📭",
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/50 p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-black text-3xl">
        {icon}
      </div>

      <h3 className="text-xl font-black text-white">{title}</h3>

      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}