import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

let showToastFn: (msg: string, type?: ToastType) => void = () => {};

export function toast(msg: string, type: ToastType = "success") {
  showToastFn(msg, type);
}

export default function ToastContainer() {
  const [items, setItems] = useState<{ id: number; msg: string; type: ToastType }[]>([]);

  useEffect(() => {
    showToastFn = (msg, type = "success") => {
      const id = Date.now();
      setItems((prev) => [...prev, { id, msg, type }]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3000);
    };
  }, []);

  return (
    <div className="toast-container">
      {items.map((i) => (
        <div key={i.id} className={`toast toast-${i.type}`}>
          {i.msg}
        </div>
      ))}
    </div>
  );
}
