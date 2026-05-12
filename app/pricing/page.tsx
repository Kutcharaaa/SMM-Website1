import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <Navbar />

      <section className="relative max-w-7xl mx-auto px-6 py-28">
        <div className="absolute top-10 left-0 w-[500px] h-[500px] bg-blue-600/20 blur-[140px]" />

        <div className="relative z-10 text-center max-w-4xl mx-auto mb-16">
          <p className="text-blue-400 font-semibold mb-4">
            SIMPLE RESELLER PRICING
          </p>

          <h1 className="text-6xl lg:text-7xl font-black mb-6">
            Choose Your Growth Level
          </h1>

          <p className="text-zinc-400 text-xl">
            Flexible plans for creators, resellers, agencies, and businesses.
          </p>
        </div>

        <div className="relative z-10 grid lg:grid-cols-3 gap-8">
          {[
            {
              name: "Starter",
              price: "$0",
              desc: "For new users testing services.",
              features: ["Basic dashboard", "Manual orders", "Ticket support", "Standard rates"],
            },
            {
              name: "Reseller",
              price: "$25+",
              desc: "For active sellers and small agencies.",
              features: ["Lower rates", "API access", "Priority support", "Order tracking"],
              popular: true,
            },
            {
              name: "Agency",
              price: "Custom",
              desc: "For high-volume businesses.",
              features: ["Custom pricing", "Bulk orders", "Dedicated support", "Advanced API"],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border p-8 bg-zinc-900/60 backdrop-blur-xl ${
                plan.popular ? "border-blue-500" : "border-zinc-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-8 bg-blue-600 px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}

              <h2 className="text-3xl font-bold mb-3">{plan.name}</h2>
              <p className="text-zinc-400 mb-8">{plan.desc}</p>

              <div className="text-5xl font-black mb-8">
                {plan.price}
              </div>

              <div className="flex flex-col gap-4 mb-8">
                {plan.features.map((feature) => (
                  <p key={feature} className="text-zinc-300">
                    ✓ {feature}
                  </p>
                ))}
              </div>

              <a
                href="/register"
                className={`block text-center rounded-xl px-6 py-3 font-semibold transition ${
                  plan.popular
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "border border-zinc-700 hover:border-blue-500"
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}