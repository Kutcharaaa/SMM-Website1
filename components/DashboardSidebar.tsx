import Link from "next/link";
import WalletBalance from "@/components/WalletBalance";


export default function DashboardSidebar() {
  const menu = [
    { name: "Overview", href: "/dashboard" },
    { name: "New Order", href: "/dashboard/new-order" },
    { name: "Orders", href: "/dashboard/orders" },
    { name: "Wallet", href: "/dashboard/wallet" },
    { name: "Services", href: "/dashboard/services" },
    { name: "Tickets", href: "/dashboard/tickets" },
    { name: "API Access", href: "/dashboard/api" },
    { name: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 flex-col border-r border-zinc-800 bg-zinc-950 text-white">
      <div className="px-6 py-6 border-b border-zinc-800">
        <img src="/logo.png" alt="Ascend Service" className="h-14 w-auto" />
      </div>

      <div className="px-6 py-5">
        <WalletBalance />
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <Link
          href="/"
          className="block rounded-2xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
        >
          Back to Website
        </Link>
      </div>
    </aside>
  );
}