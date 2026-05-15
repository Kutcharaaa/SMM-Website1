import { Bell, Settings, Sparkles } from "lucide-react";

export default function LatestAnnouncements() {
  const announcements = [
    {
      title: "New Payment Method",
      desc: "We now accept GCash payments!",
      time: "May 20, 2024",
      icon: Bell,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "System Update",
      desc: "Minor updates have been applied.",
      time: "May 18, 2024",
      icon: Settings,
      color: "bg-slate-100 text-slate-700",
    },
    {
      title: "New Services Added",
      desc: "Check out our new Instagram services.",
      time: "May 15, 2024",
      icon: Sparkles,
      color: "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-black text-slate-950">
          Latest Announcements
        </h3>

        <a
          href="/dashboard/announcements"
          className="text-xs font-black text-blue-600 hover:text-blue-700"
        >
          View All
        </a>
      </div>

      <div className="mt-5 space-y-5">
        {announcements.map((announcement) => {
          const Icon = announcement.icon;

          return (
            <div key={announcement.title} className="flex gap-4">
              <div
                className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${announcement.color}`}
              >
                <Icon size={18} strokeWidth={2.4} />
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {announcement.title}
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  {announcement.desc}
                </p>

                <p className="mt-1 text-xs font-medium text-slate-400">
                  {announcement.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}