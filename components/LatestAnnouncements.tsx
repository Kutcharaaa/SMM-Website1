export default function LatestAnnouncements() {
  const announcements = [
    {
      title: "New TikTok Services Added",
      desc: "We added faster TikTok followers and likes services.",
      time: "2 hours ago",
    },
    {
      title: "Maintenance Complete",
      desc: "Wallet and payment systems are now fully operational.",
      time: "Yesterday",
    },
    {
      title: "New Reseller Rewards",
      desc: "Earn more points with higher reseller levels.",
      time: "2 days ago",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-950">
            Latest Announcements
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Platform updates and news
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.title}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-black text-slate-900">
                  {announcement.title}
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  {announcement.desc}
                </p>
              </div>

              <span className="whitespace-nowrap text-xs font-semibold text-slate-400">
                {announcement.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}