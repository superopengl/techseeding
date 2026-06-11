import { useEffect, useRef, useState } from "react";
import { Alert, Button, Typography } from "antd";
import { GoogleOutlined } from "@ant-design/icons";

const { Text } = Typography;

// Vite replaces `__KPAI_GOOGLE_CLIENT_ID__` at build time. Empty string
// falls through to the disabled "configure" hint so the page still renders.
// eslint-disable-next-line no-undef
const CLIENT_ID = typeof __KPAI_GOOGLE_CLIENT_ID__ !== "undefined" ? __KPAI_GOOGLE_CLIENT_ID__ : "";

function waitForGoogle(timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google);
    const start = Date.now();
    const tick = () => {
      if (window.google?.accounts?.id) return resolve(window.google);
      if (Date.now() - start > timeoutMs) return reject(new Error("Google SDK failed to load"));
      setTimeout(tick, 80);
    };
    tick();
  });
}

// Sign in with Google. On credential receipt, POSTs to /api/auth/google and
// — on success — invokes onSuccess({ role }) so the caller can refresh the
// user context and route. The kpai backend sets HttpOnly auth cookies, so
// the fetch must include credentials.
export function GoogleSignInButton({
  size = "large",
  text = "signin_with",
  onSuccess,
  onError,
  width,
  // CSS `zoom` scales the GIS-rendered button (native max ~40px) up to
  // match larger page buttons. `zoom` reflows correctly here where
  // `transform: scale()` would not.
  scale = 1,
}) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // Stash the latest callbacks in a ref so the init effect doesn't re-run
  // (and re-initialize the GIS button) when the parent re-renders with new
  // inline `onSuccess` / `onError` closures.
  const callbacksRef = useRef({ onSuccess, onError });
  callbacksRef.current = { onSuccess, onError };

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    waitForGoogle()
      .then((google) => {
        if (cancelled) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            if (!response?.credential) {
              setError("No credential returned from Google");
              return;
            }
            setSubmitting(true);
            setError(null);
            try {
              const res = await fetch("/api/auth/google", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
              });
              const body = await res.json().catch(() => ({}));
              if (!res.ok || !body.success) {
                throw new Error(body?.error?.message || `Sign-in failed (${res.status})`);
              }
              callbacksRef.current.onSuccess?.(body.data);
            } catch (e) {
              setError(e.message);
              callbacksRef.current.onError?.(e);
            } finally {
              setSubmitting(false);
            }
          },
          ux_mode: "popup",
          auto_select: false,
          itp_support: true,
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          google.accounts.id.renderButton(containerRef.current, {
            type: "standard",
            theme: "outline",
            size: size === "large" ? "large" : "medium",
            text,
            shape: "pill",
            logo_alignment: "left",
            width: typeof width === "number" ? Math.min(Math.max(width, 200), 400) : undefined,
          });
        }
        setReady(true);
      })
      .catch((e) => {
        setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [size, text, width]);

  if (!CLIENT_ID) {
    return (
      <Button
        size={size}
        icon={<GoogleOutlined />}
        disabled
        style={{ borderRadius: 24, fontWeight: 600 }}
      >
        Google sign-in (configure KPAI_GOOGLE_CLIENT_ID)
      </Button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div ref={containerRef} aria-busy={submitting} style={scale !== 1 ? { zoom: scale } : undefined} />
      {!ready && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Loading Google sign-in…
        </Text>
      )}
      {submitting && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Signing you in…
        </Text>
      )}
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ borderRadius: 8, padding: "4px 10px" }}
        />
      )}
    </div>
  );
}
