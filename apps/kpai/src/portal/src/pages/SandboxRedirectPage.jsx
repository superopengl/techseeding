import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { apiCall } from "../api";

export function SandboxRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const sandboxes = await apiCall("/api/sandbox");
        if (sandboxes.length > 0) {
          navigate(`/sandbox/${sandboxes[0].id}`, { replace: true });
          return;
        }
        const data = await apiCall("/api/sandbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        navigate(`/sandbox/${data.id}`, { replace: true });
      } catch {
        message.error("Failed to load sandbox");
      }
    })();
  }, [navigate]);

  return null;
}
