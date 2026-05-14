"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
};

type ConfirmContextType = {
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] =
    useState<((value: boolean) => void) | null>(null);

  function confirmAction(options: ConfirmOptions) {
    setOptions(options);

    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }

  function close(value: boolean) {
    resolver?.(value);
    setOptions(null);
    setResolver(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirmAction }}>
      {children}

      {options && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-5">
              <h3 className="text-2xl font-black text-white">
                {options.title}
              </h3>

              <p className="mt-2 text-sm text-zinc-400">
                {options.message}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => close(false)}
                className="rounded-xl border border-zinc-800 px-5 py-3 font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-white"
              >
                {options.cancelText || "Cancel"}
              </button>

              <button
                onClick={() => close(true)}
                className={`rounded-xl px-5 py-3 font-semibold transition ${
                  options.variant === "danger"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {options.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }

  return context;
}