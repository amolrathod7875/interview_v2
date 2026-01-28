import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

export const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firebaseId = localStorage.getItem("userUid");
    if (!firebaseId) return;

    axios
      .get(`${API}/user/me`, {
        params: { firebaseId },
      })
      .then(res => setUser(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
};
