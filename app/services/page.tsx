import Navbar from "../../components/Navbar";
import Footer from "@/components/Footer";
export default function ServicesPage() {
    const services = [
        {
            title: "TikTok Growth",
            desc: "Followers, likes, shares, views, live viewers and engagement.",
            glow: "from-pink-500/20 to-cyan-500/20",
        },
        {
            title: "Instagram Growth",
            desc: "Premium followers, reels views, story views and likes.",
            glow: "from-purple-500/20 to-pink-500/20",
        },
        {
            title: "YouTube Promotion",
            desc: "Subscribers, watch hours, likes and video promotion.",
            glow: "from-red-500/20 to-orange-500/20",
        },
        {
            title: "Facebook Services",
            desc: "Page followers, reactions, post engagement and shares.",
            glow: "from-blue-500/20 to-cyan-500/20",
        },
        {
            title: "Telegram Growth",
            desc: "Members, post views and community engagement.",
            glow: "from-cyan-500/20 to-sky-500/20",
        },
        {
            title: "Twitch Promotion",
            desc: "Followers, viewers and stream engagement services.",
            glow: "from-violet-500/20 to-fuchsia-500/20",
        },
    ];

    return (
        <main className="min-h-screen bg-black text-white overflow-hidden">
            <Navbar />
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/20 blur-[140px]" />

            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[140px]" />

            {/* Hero */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="text-center max-w-4xl mx-auto">
                    <p className="text-blue-400 font-semibold mb-4">
                        PREMIUM SMM SERVICES
                    </p>

                    <h1 className="text-6xl lg:text-7xl font-black leading-tight mb-8">
                        Powerful Social Media Growth Solutions
                    </h1>

                    <p className="text-zinc-400 text-xl leading-relaxed">
                        Professional marketing services built for creators,
                        brands, agencies and resellers worldwide.
                    </p>
                </div>
            </section>

            {/* Services Grid */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
                <div className="grid lg:grid-cols-3 gap-8">
                    {services.map((service) => (
                        <div
                            key={service.title}
                            className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-8 hover:border-blue-500 transition duration-500"
                        >
                            {/* Glow */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${service.glow} opacity-0 group-hover:opacity-100 transition duration-500`}
                            />

                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6">
                                    <div className="w-6 h-6 rounded-full bg-blue-400" />
                                </div>

                                <h2 className="text-3xl font-bold mb-4">
                                    {service.title}
                                </h2>

                                <p className="text-zinc-400 leading-relaxed mb-8">
                                    {service.desc}
                                </p>

                                <a
                                    href="/register"
                                    className="inline-flex items-center gap-2 text-blue-400 font-semibold hover:text-blue-300 transition"
                                >
                                    Start Now →
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <Footer />
        </main>
    );
}