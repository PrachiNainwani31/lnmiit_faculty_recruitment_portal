import { useEffect, useState } from "react";
import API from "../api/api";

export function useActiveCycle() {
  const [cycle, setCycle] = useState(undefined); // ← undefined = still loading

  useEffect(() => {
    API.get("/cycle/current")
      .then(res => {
        const c = res.data?.cycle || null;
        setCycle(c);
      })
      .catch(() => setCycle(null));
  }, []);

  return cycle;
}