import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { apiCall } from "../api";
import { PasswordModal } from "../components/PasswordModal";

export function SandboxRedirectPage() {
  const navigate = useNavigate();
  const [passwordChecked, setPasswordChecked] = useState(false);
  const [hasPassword, setHasPassword] = useState(null);

  useEffect(() => {
    apiCall("/api/me")
      .then((data) => setHasPassword(Boolean(data.hasPassword)))
      .catch(() => setHasPassword(true))
      .finally(() => setPasswordChecked(true));
  }, []);

  useEffect(() => {
    if (!passwordChecked) return;
    if (hasPassword === false) return;
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
  }, [passwordChecked, hasPassword, navigate]);

  return (
    <PasswordModal
      open={hasPassword === false}
      mode="set"
      onSuccess={() => setHasPassword(true)}
    />
  );
}
