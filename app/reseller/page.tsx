import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const resellerLevels = [
  {
    name: "Starter",
    tag: "Beginner Reseller",
    required: "$0",
    discount: "0%",
    accent: "from-zinc-700 to-zinc-900",
    perks: [
      "Access to all public services",
      "Standard support queue",
      "Basic reseller dashboard access",
    ],
  },
  {
    name: "Builder",
    tag: "Growing Reseller",
    required: "$500",
    discount: "1%",
    accent: "from-blue-600 to-cyan-600",
    perks: [
      "Small reseller discount",
      "Faster ticket handling",
      "Better order monitoring priority",
    ],
  },
  {
    name: "Operator",
    tag: "Active Reseller",
    required: "$5,000",
    discount: "2%",
    accent: "from-purple-600 to-fuchsia-600",
    perks: [
      "Priority support access",
      "Eligible for child panel setup",
      "Early service update notices",
    ],
  },
  {
    name: "Partner",
    tag: "High Volume Reseller",
    required: "$15,000",
    discount: "3%",
    accent: "from-amber-500 to-orange-600",
    perks: [
      "Higher discount rate",
      "Priority issue checking",
      "Private service recommendations",
    ],
  },
  {
    name: "Executive",
    tag: "Premium Partner",
    required: "$30,000",
    discount: "4%",
    accent: "from-emerald-500 to-teal-600",
    perks: [
      "Dedicated business support",
      "Advanced reseller guidance",
      "Access to selected private offers",
    ],
  },
  {
    name: "Ascend Elite",
    tag: "Top Tier Partner",
    required: "$50,000",
    discount: "5%",
    accent: "from-red-600 to-pink-600",
    perks: [
      "Highest reseller discount",
      "Elite priority support",
      "Exclusive hidden service access",
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
              Scale More. Spend Smarter. Unlock Better Rates.
            </h1>

            <p className="mt-6 text-lg text-zinc-400">
              Your reseller level grows with your total spending. Higher levels
              unlock better discounts, stronger support, and exclusive platform
              advantages.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="rounded-2xl bg-blue-600 px-8 py-4 font-bold transition hover:bg-blue-700"
              >
                Start Reselling
              </Link>

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
                className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 transition hover:-translate-y-1 hover:border-blue-500/40"
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
                    <p className="text-xs text-zinc-500">Discount</p>
                    <p className="text-2xl font-black text-blue-400">
                      {level.discount}
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-zinc-800 bg-black/60 p-5">
                  <p className="text-sm text-zinc-500">
                    Required total spending
                  </p>

                  <p className="mt-2 text-4xl font-black">
                    {level.required}
                  </p>
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

          <div className="mt-20 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-black p-8 md:p-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-4xl font-black">
                  How reseller levels work
                </h2>

                <p className="mt-4 text-zinc-400">
                  Your level is based on your lifetime spending on Ascend
                  Service. As your volume grows, your account can unlock better
                  rates and priority benefits.
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  "Deposit funds into your wallet",
                  "Place orders for your clients",
                  "Grow your total spending volume",
                  "Unlock higher reseller benefits",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-black p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black">
                      {index + 1}
                    </div>

                    <p className="font-semibold">{step}</p>
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