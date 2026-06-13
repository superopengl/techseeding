import { useEffect, useRef, useState } from 'react';
import authSession from '../lib/authSession.js';
import loadGoogleSdk from '../lib/loadGoogleSdk.js';
import { palette } from '../theme.js';

// Read the client ID injected by Vite at build time. Falls back to empty
// string so the button can render a clear "not configured" hint in dev.
// eslint-disable-next-line no-undef
const CLIENT_ID = typeof __YTAI_GOOGLE_CLIENT_ID__ !== 'undefined' ? __YTAI_GOOGLE_CLIENT_ID__ : '';

// "Sign in with Google" via GIS `id.renderButton`. When the visitor has an
// active Google session, GIS personalizes the button to "Sign in as <name>
// <email>" with their avatar — same behavior as the kpai login. The
// credential callback POSTs the ID token to /api/auth/google.
export default function GoogleSignInButton({
  role = 'student',
  width = 320,
  onSuccess,
  onError
}) {
  const containerRef = useRef(null);
  const [loadingSdk, setLoadingSdk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // Stash the latest callbacks in a ref so the init effect doesn't re-run
  // when the parent re-renders with new inline closures.
  const callbacksRef = useRef({ onSuccess, onError, role });
  callbacksRef.current = { onSuccess, onError, role };

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    setLoadingSdk(true);

    loadGoogleSdk()
      .then((google) => {
        if (cancelled) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            if (!response?.credential) {
              setError('No credential returned from Google');
              return;
            }
            setSubmitting(true);
            setError(null);
            try {
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  credential: response.credential,
                  role: callbacksRef.current.role
                })
              });
              const body = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(body?.error || `Sign-in failed (${res.status})`);
              }
              authSession().save(body);
              callbacksRef.current.onSuccess?.(body.user);
            } catch (e) {
              setError(e.message);
              callbacksRef.current.onError?.(e);
            } finally {
              setSubmitting(false);
            }
          },
          ux_mode: 'popup',
          auto_select: false,
          itp_support: true
        });
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: Math.min(Math.max(width, 200), 400)
          });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingSdk(false);
      });

    return () => {
      cancelled = true;
    };
  }, [width]);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        style={{
          width: '100%',
          height: 48,
          borderRadius: 24,
          fontWeight: 600,
          background: '#f5f5f5',
          color: palette.textMuted,
          border: '1px solid #e5e5e5',
          cursor: 'not-allowed'
        }}
      >
        Google sign-in (configure YTAI_GOOGLE_CLIENT_ID)
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div ref={containerRef} aria-busy={submitting || loadingSdk} />
      {loadingSdk && (
        <span style={{ color: palette.textMuted, fontSize: 12 }}>
          Loading Google sign-in…
        </span>
      )}
      {submitting && (
        <span style={{ color: palette.textMuted, fontSize: 12 }}>
          Signing you in…
        </span>
      )}
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 4,
            borderRadius: 8,
            padding: '6px 12px',
            background: '#fff2f0',
            color: '#a8071a',
            border: '1px solid #ffccc7',
            fontSize: 13,
            textAlign: 'center'
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
