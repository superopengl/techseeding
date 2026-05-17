import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { apiCall } from "../api";
import { useUser } from "../context/UserContext";
import { PasswordModal } from "../components/PasswordModal";
import { Loading } from "../components/Loading";

export function SandboxRedirectPage() {
  const navigate = useNavigate();
  const { user, loaded, refresh } = useUser();
  const [skipped, setSkipped] = useState(false);
  const passwordChecked = loaded;
  const hasPassword = user ? Boolean(user.hasPassword) : (loaded ? true : null);

  useEffect(() => {
    if (!passwordChecked) return;
    if (hasPassword === false && !skipped) return;
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
  }, [passwordChecked, hasPassword, skipped, navigate]);

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Loading size="large" />
        </div>
      </div>
      <PasswordModal
        open={hasPassword === false && !skipped}
        mode="set"
        onSuccess={() => refresh()}
        onSkip={() => setSkipped(true)}
      />
    </>
  );
}
