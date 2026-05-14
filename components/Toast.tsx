type ToastProps = {
  message: string;
  type?: "success" | "error" | "warning" | "info";
};

export default function Toast({
  message,
  type = "info",
}: ToastProps) {
  function getStyles() {
    if (type === "success") {
      return "border-green-500/30 bg-green-500/10 text-green-400";
    }

    if (type === "error") {
      return "border-red-500/30 bg-red-500/10 text-red-400";
    }

    if (type === "warning") {
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    }

    return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  }

  function getIcon() {
    if (type === "success") return "✓";
    if (type === "error") return "✕";
    if (type === "warning") return "⚠";
    return "ℹ";
  }

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl animate-[toastIn_.25s_ease] ${getStyles()}`}
    >
      <div className="text-lg font-black">
        {getIcon()}
      </div>

      <p className="text-sm font-medium">
        {message}
      </p>

      <style jsx>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}