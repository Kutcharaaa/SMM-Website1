"use client";

import Toast from "@/components/Toast";
import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

type ToastType = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function showToast(message: string, type: ToastType = "info") {
    const id = Date.now();

    setToasts((current) => [
      ...current,
      {
        id,
        message,
        type,
      },
    ]);

    setTimeout(() => {
      setToasts((current) =>
        current.filter((toast) => toast.id !== id)
      );
    }, 3500);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed right-4 top-4 z-[9999] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}