import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import GetStartedButton from "@/components/GetStartedButton";

const resellerLevels = [
  {
    name: "New Reseller",
    tag: "Starter Level",
    required: "$0",
    discount: "0%",
    points: "$1.00",
    accent: "from-slate-500 to-zinc-700",
    perks: ["Community based support"],
  },

  {
    name: "Power Reseller",
    tag: "Growing Reseller",
    required: "$500",
    discount: "1%",
    points: "$1.00",
    accent: "from-blue-500 to-cyan-500",
    perks: ["Priority ticket support by team"],
  },

  {
    name: "Pro Reseller",
    tag: "Advanced Reseller",
    required: "$5,000",
    discount: "2%",
    points: "$1.25",
    accent: "from-cyan-500 to-sky-500",
    perks: [
      "Whatsapp/Telegram support by team",
      "Free Child Panel - Lifetime",
    ],
  },

  {
    name: "Master Reseller",
    tag: "High Volume Reseller",
    required: "$15,000",
    discount: "3%",
    points: "$1.50",
    accent: "from-indigo-500 to-blue-500",
    perks: [
      "Top priority support",
      "Free Child Panel - Lifetime",
      "Early notification on new services",
    ],
  },

  {
    name: "Premium Partner",
    tag: "Premium Partner",
    required: "$30,000",
    discount: "4%",
    points: "$1.75",
    accent: "from-blue-400 to-cyan-400",
    perks: [
      "Dedicated account manager",
      "Free Child Panel - Lifetime",
      "Track and resolve issues systematically",
    ],
  },

  {
    name: "Elite Partner",
    tag: "Top Tier Partner",
    required: "$50,000",
    discount: "5%",
    points: "$2.00",
    accent: "from-cyan-400 to-blue-600",
    perks: [
      "Admin handled support",
      "Free Child Panel - Lifetime",
      "Early notification on new services",
      "Special discount by admin",
      "Hidden services access",
    ],
  },
];

export default function ResellerPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-400">
              Ascend Reseller Program
            </p>

            <h1 className="text-5xl font-black tracking-tight md:text-7xl">
              Unlock Higher Reseller Benefits
            </h1>

            <p className="mt-6 text-lg text-zinc-400">
              Grow your reseller level through lifetime spending and unlock
              better discounts, stronger support, exclusive perks, and reseller
              rewards.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <GetStartedButton className="rounded-2xl bg-blue-600 px-8 py-4 font-bold transition hover:bg-blue-700">
                Start Reselling
              </GetStartedButton>

              <Link
                href="/services"
                className="rounded-2xl border border-zinc-800 px-8 py-4 font-bold transition hover:border-blue-500"
              >
                View Services
              </Link>
            </div>
          </div>

          <div className="mt-20 grid gap-6 lg:grid-cols-3">
            {resellerLevels.map((level, index) => (
              <div
                key={level.name}
                className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-500/40"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${level.accent}`}
                />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-500">
                      Level {index + 1}
                    </p>

                    <h3 className="mt-2 text-3xl font-black">
                      {level.name}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-400">
                      {level.tag}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-right">
                    <p className="text-xs text-zinc-500">
                      Required Spent
                    </p>

                    <p className="text-2xl font-black text-blue-400">
                      {level.required}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-4">
                    <p className="text-xs text-zinc-500">
                      Discount
                    </p>

                    <p className="mt-2 text-2xl font-black text-cyan-400">
                      {level.discount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-4">
                    <p className="text-xs text-zinc-500">
                      Every 100 points
                    </p>

                    <p className="mt-2 text-2xl font-black text-blue-400">
                      {level.points}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {level.perks.map((perk) => (
                    <div
                      key={perk}
                      className="flex items-start gap-3 text-sm text-zinc-300"
                    >
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs text-blue-400">
                        ✓
                      </span>

                      <p>{perk}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 md:p-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
                  Point System
                </p>

                <h2 className="text-4xl font-black">
                  Earn Points From Orders
                </h2>

                <p className="mt-5 text-zinc-400">
                  Every completed order can earn reseller points depending on
                  your reseller level. Higher levels unlock better point
                  conversion rates and reseller benefits.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  "Points are stored in your account",
                  "Points are NOT automatically converted",
                  "You can manually convert points anytime",
                  "Converted points become wallet balance",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-black p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black">
                      ✓
                    </div>

                    <p className="font-semibold">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-20 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-black p-8 md:p-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-4xl font-black">
                  How reseller levels work
                </h2>

                <p className="mt-4 text-zinc-400">
                  Your reseller level is based on your lifetime spending on
                  Ascend Service. Higher spending unlocks stronger reseller
                  perks and better conversion rewards.
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  "Deposit funds into your wallet",
                  "Place orders for your clients",
                  "Earn reseller points from completed orders",
                  "Unlock higher reseller benefits",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-black p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black">
                      {index + 1}
                    </div>

                    <p className="font-semibold">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}