import React, { useCallback, useEffect, useState } from "react";
import { Tooltip } from "antd";
import { apiCall } from "../api";
import { colors, fonts } from "../theme";

const COIN_REFRESH_EVENT = "kpai:coins:refresh";

// Any code that triggers a coin-earning action can dispatch this event
// to make every mounted CoinBalance refetch. Cheaper than a global
// store; survives unmount/remount; no prop drilling.
export function notifyCoinsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COIN_REFRESH_EVENT));
  }
}

export function useCoinBalance() {
  const [balance, setBalance] = useState(null);
  const refresh = useCallback(() => {
    apiCall("/api/me/coins")
      .then((d) => setBalance(d?.balance ?? 0))
      .catch(() => { /* leave previous value visible */ });
  }, []);

  useEffect(() => {
    refresh();
    const onEvent = () => refresh();
    window.addEventListener(COIN_REFRESH_EVENT, onEvent);
    return () => window.removeEventListener(COIN_REFRESH_EVENT, onEvent);
  }, [refresh]);

  return { balance, refresh };
}

export function CoinBalance({ onLight = false }) {
  const { balance } = useCoinBalance();
  if (balance == null) return null;
  return (
    <Tooltip title="Coins earned by publishing, getting plays, likes, and forks">
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          borderRadius: 999,
          background: onLight ? "#fff7d6" : "rgba(255,255,255,0.92)",
          border: `1px solid ${onLight ? colors.ctaYellowShadow : "rgba(255,255,255,0.6)"}`,
          color: onLight ? colors.bodyStrong : colors.heading,
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "0.02em",
          lineHeight: 1,
          userSelect: "none",
        }}
        aria-label={`${balance} coins`}
      >
        <span aria-hidden style={{ fontSize: 14 }}>🪙</span>
        {balance.toLocaleString()}
      </span>
    </Tooltip>
  );
}
