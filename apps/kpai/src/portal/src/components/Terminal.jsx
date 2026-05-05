import React, { useEffect, useRef, useState } from "react";
import { Typography, Alert, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { Loading } from "./Loading";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { colors } from "../theme";
import { stripAnsi } from "../utils/stripAnsi";

const READY_IDLE_MS = 0;

const maskStyle = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  background: "rgba(0, 0, 0, 0.55)",
  backdropFilter: "blur(2px)",
  padding: 24,
  textAlign: "center",
};

export function Terminal({ sandboxId, onFileChanged, onSessionEnd }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    if (!sandboxId || !containerRef.current) return;
    setLoading(true);
    setSessionEnded(false);

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
      const { type, data } = msg;
      if (type === "output") {
        term.write(data);
        if (loading) { 
          const cleanData = stripAnsi(data);
          if (cleanData.includes(`${sandboxId}`)) {
            setLoading(false);
          }
        }
      } else if (type === "file-changed") {
        onFileChanged?.();
      }
    };

    ws.onclose = (e) => {
      // term.write("\r\n\x1b[31m[Session ended]\x1b[0m\r\n");
      if (!cancelled) {
        setSessionEnded(true);
        onSessionEnd?.(e);
      }
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
      {!sessionEnded && loading && (
        <div style={maskStyle}>
          <Loading
            size="large"
            description={<span style={{ fontSize: 18 }}>Starting AI assistant…</span>}
          />
        </div>
      )}
      {sessionEnded && (
        <div style={maskStyle}>
          <Typography.Text style={{ color: "#fff", fontSize: 18, fontWeight: 600 }}>
            AI assistant session ended
          </Typography.Text>
          <Typography.Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
            Refresh the page to start a new session.
          </Typography.Text>
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
