import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { apiCall } from "../api";
import { useUser } from "../context/UserContext";
import { PasswordModal } from "../components/PasswordModal";
import { colors } from "../theme";

export function SandboxRedirectPage() {
  const navigate = useNavigate();
  const { user, loaded, refresh } = useUser();
  const passwordChecked = loaded;
  const hasPassword = user ? Boolean(user.hasPassword) : (loaded ? true : null);

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
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 48, color: colors.primary }} spin />}
            size="large"
          />
        </div>
      </div>
      <PasswordModal
        open={hasPassword === false}
        mode="set"
        onSuccess={() => refresh()}
      />
    </>
  );
}
