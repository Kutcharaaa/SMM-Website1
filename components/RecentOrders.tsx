export default function RecentOrders() {
    const orders = [
        {
            id: "#1001",
            service: "TikTok Followers",
            quantity: "1,000",
            status: "Pending",
            amount: "$2.50",
        },
        {
            id: "#1002",
            service: "Instagram Likes",
            quantity: "500",
            status: "Completed",
            amount: "$1.20",
        },
        {
            id: "#1003",
            service: "YouTube Views",
            quantity: "5,000",
            status: "Processing",
            amount: "$4.00",
        },
    ];

    return (
        <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black">Recent Orders</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        Your latest order activity
                    </p>
                </div>

                <a href="/dashboard/orders" className="text-sm text-blue-400 hover:text-blue-300">
                    View All
                </a>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-black/60 text-zinc-500">
                        <tr>
                            <th className="text-left p-5">Order ID</th>
                            <th className="text-left p-5">Service</th>
                            <th className="text-left p-5">Quantity</th>
                            <th className="text-left p-5">Status</th>
                            <th className="text-left p-5">Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className="border-t border-zinc-900">
                                <td className="p-5 text-zinc-400">{order.id}</td>
                                <td className="p-5 font-medium">{order.service}</td>
                                <td className="p-5 text-zinc-400">{order.quantity}</td>
                                <td className="p-5">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-medium ${order.status === "Completed"
                                                ? "bg-green-500/10 text-green-400"
                                                : order.status === "Pending"
                                                    ? "bg-yellow-500/10 text-yellow-400"
                                                    : "bg-blue-500/10 text-blue-400"
                                            }`}
                                    >
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-5 text-zinc-300">{order.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}