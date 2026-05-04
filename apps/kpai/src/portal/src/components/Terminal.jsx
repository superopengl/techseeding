import React, { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export function Terminal({ sandboxId, onFileChanged }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);

  useEffect(() => {
    if (!sandboxId || !containerRef.current) return;

    const term = new XTerm({ cursorBlink: true, fontSize: 14 });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    termRef.current = term;

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const token = sessionStorage.getItem("kpai_token");
    const ws = new WebSocket(
      `${proto}//${location.host}/api/ws?sandboxId=${sandboxId}&token=${token}`
    );

    ws.onopen = () => {
      ws.send(
        JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows })
      );
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "output") {
        term.write(msg.data);
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
      resizeObserver.disconnect();
      ws.close();
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

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
