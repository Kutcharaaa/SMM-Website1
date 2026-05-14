type LoadingCardsProps = {
  count?: number;
};

export default function LoadingCards({ count = 3 }: LoadingCardsProps) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6"
        >
          <div className="h-4 w-24 rounded bg-zinc-800" />
          <div className="mt-5 h-8 w-32 rounded bg-zinc-800" />
          <div className="mt-4 h-3 w-full rounded bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}