import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const resellerLevels = [
  {
    level: "01",
    name: "New Reseller",
    spent: "0$",
    discount: "0%",
    reward: "1.00$",
    perks: ["Community based support"],
  },
  {
    level: "02",
    name: "Power Reseller",
    spent: "500$",
    discount: "1%",
    reward: "1.00$",
    perks: ["Priority ticket support by team"],
  },
  {
    level: "03",
    name: "Pro Reseller",
    spent: "5000$",
    discount: "2%",
    reward: "1.25$",
    perks: [
      "Whatsapp/Telegram support by team",
      "Free Child Panel - Lifetime",
    ],
  },
  {
    level: "04",
    name: "Master Reseller",
    spent: "15000$",
    discount: "3%",
    reward: "1.50$",
    perks: [
      "Top priority support",
      "Free Child Panel - Lifetime",
      "Early notification on new services",
    ],
  },
  {
    level: "05",
    name: "Premium Partner",
    spent: "30000$",
    discount: "4%",
    reward: "1.75$",
    perks: [
      "Dedicated account manager",
      "Free Child Panel - Lifetime",
      "Track and resolve issues systematically",
    ],
  },
  {
    level: "06",
    name: "Elite Partner",
    spent: "50000$",
    discount: "5%",
    reward: "2.00$",
    perks: [
      "Admin handled support",
      "Free Child Panel - Lifetime",
      "Early access to new services",
      "Hidden exclusive services",
    ],
  },
];

export default function ResellerPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black">
              Reseller Levels
            </h1>

            <p className="mt-6 text-zinc-400 max-w-2xl mx-auto text-lg">
              Unlock higher reseller ranks, bigger discounts, exclusive
              features, and priority support as your total spending grows.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {resellerLevels.map((level, index) => (
              <div
                key={level.level}
                className={`rounded-3xl border p-8 transition duration-300 hover:-translate-y-1 ${
                  index === 0
                    ? "border-fuchsia-500/40 bg-fuchsia-500/5"
                    : "border-zinc-800 bg-zinc-950/80"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-black ${
                        index === 0
                          ? "bg-fuchsia-500 text-white"
                          : "bg-zinc-900 text-white"
                      }`}
                    >
                      {level.level}
                    </div>

                    <div>
                      <h3 className="text-3xl font-black leading-tight">
                        {level.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400">
                    From {level.spent} Spent
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-zinc-500 text-sm">Discount</p>

                    <h4 className="mt-2 text-4xl font-black">
                      {level.discount}
                    </h4>
                  </div>

                  <div className="border-l border-zinc-800 pl-6">
                    <p className="text-zinc-500 text-sm">
                      Each 100 points
                    </p>

                    <h4 className="mt-2 text-4xl font-black">
                      {level.reward}
                    </h4>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {level.perks.map((perk) => (
                    <div
                      key={perk}
                      className="flex items-start gap-3 text-zinc-300"
                    >
                      <div className="mt-2 h-2 w-2 rounded-full bg-fuchsia-400" />

                      <p>{perk}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}