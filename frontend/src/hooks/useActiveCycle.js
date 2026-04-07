import { useEffect, useState } from "react";
import API from "../api/api";

export function useActiveCycle() {
  const [cycle, setCycle] = useState(null);

  useEffect(() => {
    API.get("/cycle/current")
      .then(res => setCycle(res.data?.cycle || null))
      .catch(() => setCycle(null));
  }, []);

  return cycle;
}