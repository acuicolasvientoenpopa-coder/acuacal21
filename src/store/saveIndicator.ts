import { useState, useEffect } from "react";

export function useSaveIndicator(deps: any[]) {
  const [state, setState] = useState<"saving" | "saved" | "">("");

  useEffect(() => {
    setState("saving");
    const id = setTimeout(() => setState("saved"), 300);
    return () => clearTimeout(id);
  }, deps);

  useEffect(() => {
    if (state === "saved") {
      const id = setTimeout(() => setState(""), 2000);
      return () => clearTimeout(id);
    }
  }, [state]);

  return state;
}