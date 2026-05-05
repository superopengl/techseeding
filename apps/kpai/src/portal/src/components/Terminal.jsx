import React, { useEffect, useRef, useState } from "react";
import { Spin, Typography } from "antd";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { colors } from "../theme";

const READY_IDLE_MS = 0;

export function Terminal({ sandboxId, onFileChanged }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sandboxId || !containerRef.current) return;
    setLoading(true);

    const term = new XTerm({ cursorBlink: true, fontSize: 14 });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    termRef.current = term;

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${proto}//${location.host}/api/ws?sandboxId=${sandboxId}`
    );
    let cancelled = false;

    ws.onopen = () => {
      if (cancelled) {
        ws.close();
        return;
      }
      ws.send(
        JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows })
      );
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "output") {
        term.write(msg.data);
        if (loading && msg.data.includes('/kpai/')) {
          setLoading(false);
        }
      } else if (msg.type === "file-changed") {
        onFileChanged?.();
      }
    };

    ws.onclose = () => {
      term.write("\r\n\x1b[31m[Session ended]\x1b[0m\r\n");
    };

    term.onData((data) => {
      ws.send(JSON.stringify({ type: "input", data }));
    });

    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows })
        );
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CLOSING) {
        ws.close();
      }
      term.dispose();
    };
  }, [sandboxId]);

  if (!sandboxId) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
        }}
      >
        Connecting...
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Spin size="large" />
          <Typography.Text style={{ fontSize: 14, color: colors.primary }}>
            Starting AI assistant…
          </Typography.Text>
        </div>
      )}
    </div>
  );
}
