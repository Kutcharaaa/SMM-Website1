export default function RecentOrders() {
  const orders = [
    {
      id: "#1001",
      service: "TikTok Followers",
      quantity: "1,000",
      status: "Pending",
      amount: "₱140.00",
    },
    {
      id: "#1002",
      service: "Instagram Likes",
      quantity: "500",
      status: "Completed",
      amount: "₱67.00",
    },
    {
      id: "#1003",
      service: "YouTube Views",
      quantity: "5,000",
      status: "Processing",
      amount: "₱224.00",
    },
  ];

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div>
          <h3 className="text-xl font-black text-slate-950">Recent Orders</h3>
        </div>

        <a
          href="/dashboard/orders"
          className="px-4 py-2 text-sm font-bold text-blue-600 transition hover:text-gray-100"
        >
          View All Orders
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-5 text-left font-bold">Order ID</th>
              <th className="p-5 text-left font-bold">Service</th>
              <th className="p-5 text-left font-bold">Quantity</th>
              <th className="p-5 text-left font-bold">Status</th>
              <th className="p-5 text-left font-bold">Amount</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-t border-slate-100 transition hover:bg-slate-50"
              >
                <td className="p-5 font-semibold text-slate-500">
                  {order.id}
                </td>

                <td className="p-5 font-bold text-slate-900">
                  {order.service}
                </td>

                <td className="p-5 text-slate-500">{order.quantity}</td>

                <td className="p-5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      order.status === "Completed"
                        ? "bg-green-50 text-green-600"
                        : order.status === "Pending"
                        ? "bg-yellow-50 text-yellow-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>

                <td className="p-5 font-black text-slate-900">
                  {order.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}