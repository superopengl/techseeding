import React, { useState } from "react";
import { Button, Modal, message } from "antd";
import { ForkOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../api";
import { notifyCoinsChanged } from "./CoinBalance";

export function ForkButton({ sandboxId, count = 0, disabled = false }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (busy || disabled) return;
    Modal.confirm({
      title: "Fork this craft?",
      content:
        "You'll get your own copy you can edit. The original creator earns coins when you fork their craft.",
      okText: "Fork it",
      cancelText: "Cancel",
      onOk: async () => {
        setBusy(true);
        try {
          const data = await apiCall(`/api/craft/${sandboxId}/fork`, { method: "POST" });
          if (data?.grant) notifyCoinsChanged();
          message.success("Forked! Opening your copy…");
          navigate(`/sandbox/${data.sandbox.id}`);
        } catch (err) {
          message.error(err?.message || "Couldn't fork this craft");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  return (
    <Button
      shape="round"
      icon={<ForkOutlined />}
      onClick={onClick}
      loading={busy}
      disabled={disabled}
    >
      {count}
    </Button>
  );
}
