export default function RecentPayments() {
  const payments = [
    {
      id: "#PAY-1001",
      method: "GCash",
      amount: "₱500.00",
      status: "Completed",
    },
    {
      id: "#PAY-1002",
      method: "PayPal",
      amount: "₱1,250.00",
      status: "Pending",
    },
    {
      id: "#PAY-1003",
      method: "Maya",
      amount: "₱300.00",
      status: "Completed",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div>
          <h3 className="text-xl font-black text-slate-950">
            Recent Payments
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Latest add funds activity
          </p>
        </div>

        <a
          href="/dashboard/payments"
          className="text-xs font-black text-blue-600 hover:text-blue-700"
        >
          View All
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-5 text-left font-bold">Payment ID</th>
              <th className="p-5 text-left font-bold">Method</th>
              <th className="p-5 text-left font-bold">Amount</th>
              <th className="p-5 text-left font-bold">Status</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-t border-slate-100 transition hover:bg-slate-50"
              >
                <td className="p-5 font-semibold text-slate-500">
                  {payment.id}
                </td>

                <td className="p-5 font-bold text-slate-900">
                  {payment.method}
                </td>

                <td className="p-5 font-black text-slate-900">
                  {payment.amount}
                </td>

                <td className="p-5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      payment.status === "Completed"
                        ? "bg-green-50 text-green-600"
                        : "bg-yellow-50 text-yellow-600"
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}