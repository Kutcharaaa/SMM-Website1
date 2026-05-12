import { supabase } from "@/lib/supabase";

export default async function TestPage() {
  const { data, error } = await supabase
    .from("test")
    .select("*");

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-black mb-6">
        Supabase Test
      </h1>

      {error ? (
        <p className="text-red-400">
          Error: {error.message}
        </p>
      ) : (
        <pre className="text-green-400">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}