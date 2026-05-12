import Navbar from "../components/Navbar";
import Footer from "@/components/Footer";
export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navbar */}

      <Navbar />
      {/* Hero */}
      <section className="relative overflow-hidden">

        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px]" />

        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px]" />

        <div className="max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-14 items-center relative z-10">
          <div>
            <p className="text-blue-500 font-semibold mb-4">
              #1 Social Media Growth Platform
            </p>

            <h1 className="text-6xl lg:text-7xl font-black leading-tight mb-6">
              Grow Your Social Media Presence Faster
            </h1>

            <p className="text-zinc-400 text-lg mb-10">
              Professional SMM panel for TikTok, Instagram,
              YouTube, Facebook, Telegram, Twitch, Shopee,
              and more.
            </p>

            <div className="flex gap-4">
              <a
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition"
              >
                Get Started
              </a>

              <a
                href="/services"
                className="border border-zinc-700 hover:border-blue-500 px-6 py-3 rounded-xl font-semibold transition"
              >
                View Services
              </a>
            </div>
          </div>

          {/* Right Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-black rounded-2xl p-6 border border-zinc-800">
                <p className="text-zinc-400 text-sm">
                  Total Orders
                </p>

                <h2 className="text-3xl font-bold mt-2">
                  12M+
                </h2>
              </div>

              <div className="bg-black rounded-2xl p-6 border border-zinc-800">
                <p className="text-zinc-400 text-sm">
                  Active Users
                </p>

                <h2 className="text-3xl font-bold mt-2">
                  95K+
                </h2>
              </div>

              <div className="bg-black rounded-2xl p-6 border border-zinc-800">
                <p className="text-zinc-400 text-sm">
                  Services
                </p>

                <h2 className="text-3xl font-bold mt-2">
                  8,500+
                </h2>
              </div>

              <div className="bg-black rounded-2xl p-6 border border-zinc-800">
                <p className="text-zinc-400 text-sm">
                  Uptime
                </p>

                <h2 className="text-3xl font-bold mt-2">
                  99.9%
                </h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-4xl font-bold mb-12 text-center">
          Supported Platforms
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            "TikTok",
            "Instagram",
            "YouTube",
            "Facebook",
            "Telegram",
            "Twitch",
            "Shopee",
            "Twitter/X",
          ].map((platform) => (
            <div
              key={platform}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center hover:border-blue-500 transition"
            >
              <h3 className="font-semibold text-lg">
                {platform}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-4xl font-bold text-center mb-14">
            Why Choose Us
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Instant Delivery",
                desc: "Fast order processing with stable delivery speed.",
              },
              {
                title: "API Support",
                desc: "Integrate directly with our professional API.",
              },
              {
                title: "24/7 Support",
                desc: "Live chat and ticket support available anytime.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-black border border-zinc-800 rounded-3xl p-8"
              >
                <h3 className="text-2xl font-bold mb-4">
                  {feature.title}
                </h3>

                <p className="text-zinc-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
<Footer />
    </main>
  );
}