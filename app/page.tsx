import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="px-6 py-24 text-center">
        <h1 className="mx-auto max-w-5xl text-5xl md:text-7xl font-black">
          Grow Your Social Media Faster with Ascend Service
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-zinc-400 text-lg">
          Boost followers, likes, views, subscribers, engagement, and more
          across top social platforms.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/register"
            className="rounded-2xl bg-blue-600 px-8 py-4 font-bold hover:bg-blue-700 transition"
          >
            Get Started
          </Link>

          <Link
            href="/services"
            className="rounded-2xl border border-zinc-800 px-8 py-4 font-bold hover:border-blue-500 transition"
          >
            View Services
          </Link>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl md:grid-cols-3 gap-6">
          {[
            ["⚡", "Fast Delivery", "Quick and reliable social media boosting services."],
            ["🔒", "Secure Platform", "Wallet, orders, and payments built with account safety in mind."],
            ["🌍", "Multi-Platform", "Facebook, TikTok, YouTube, Instagram, Telegram, Spotify, and more."],
          ].map((item) => (
            <div
              key={item[1]}
              className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8"
            >
              <div className="text-4xl">{item[0]}</div>
              <h3 className="mt-5 text-2xl font-black">{item[1]}</h3>
              <p className="mt-3 text-zinc-500">{item[2]}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}