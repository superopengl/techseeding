import { useEffect, useRef, useState } from 'react';
import authSession from '../lib/authSession.js';
import loadGoogleSdk from '../lib/loadGoogleSdk.js';
import { palette, stickerShadow, radius } from '../theme.js';
import { GoogleIcon } from './InlineIcons.jsx';

// eslint-disable-next-line no-undef
const CLIENT_ID = typeof __YTAI_GOOGLE_CLIENT_ID__ !== 'undefined' ? __YTAI_GOOGLE_CLIENT_ID__ : '';

const YELLOW = '#F5C542';
const YELLOW_DARK = '#E0A800';

// "Sign in with Google" as a custom yellow sticker button. Clicking opens
// Google's OAuth 2.0 popup (account chooser + consent), no personalized
// preview on the button itself. The access token is POSTed to
// /api/auth/google, which resolves it against Google's userinfo endpoint.
export default function GoogleSignInButton({
  role = 'student',
  width = 320,
  onSuccess,
  onError
}) {
  const tokenClientRef = useRef(null);
  const [loadingSdk, setLoadingSdk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const callbacksRef = useRef({ onSuccess, onError, role });
  callbacksRef.current = { onSuccess, onError, role };

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    setLoadingSdk(true);

    loadGoogleSdk()
      .then((google) => {
        if (cancelled) return;
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'openid email profile',
          callback: async (response) => {
            if (response?.error) {
              setError(response.error_description || response.error);
              callbacksRef.current.onError?.(new Error(response.error));
              return;
            }
            const accessToken = response?.access_token;
            if (!accessToken) {
              setError('No access token returned from Google');
              return;
            }
            setSubmitting(true);
            setError(null);
            try {
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  accessToken,
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
          }
        });
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
  }, []);

  const handleClick = () => {
    if (!tokenClientRef.current) return;
    setError(null);
    tokenClientRef.current.requestAccessToken();
  };

  const disabled = !CLIENT_ID || loadingSdk || submitting || !tokenClientRef.current;

  const clampedWidth = Math.min(Math.max(width, 200), 400);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        style={{
          width: clampedWidth,
          height: 48,
          borderRadius: radius.md,
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
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-busy={submitting || loadingSdk}
        className="sticker-press"
        style={{
          width: clampedWidth,
          height: 48,
          borderRadius: radius.md,
          background: disabled
            ? '#F0E1B0'
            : `linear-gradient(135deg, ${YELLOW} 0%, ${YELLOW_DARK} 100%)`,
          color: palette.text,
          border: 0,
          fontFamily: 'inherit',
          fontSize: 15,
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: stickerShadow.button
        }}
      >
        <GoogleIcon style={{ fontSize: 18 }} />
        Sign in with Google
      </button>
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
