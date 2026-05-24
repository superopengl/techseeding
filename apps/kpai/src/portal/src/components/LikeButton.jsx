import React, { useState } from "react";
import { Button, message } from "antd";
import { HeartOutlined, HeartFilled } from "@ant-design/icons";
import { apiCall } from "../api";
import { notifyCoinsChanged } from "./CoinBalance";
import { colors } from "../theme";

export function LikeButton({ sandboxId, initialLiked, initialCount = 0, onChange }) {
  const [liked, setLiked] = useState(!!initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    const nextLiked = !liked;
    const nextCount = count + (nextLiked ? 1 : -1);
    setLiked(nextLiked);
    setCount(nextCount);
    try {
      const data = await apiCall(`/api/craft/${sandboxId}/like`, { method: "POST" });
      if (typeof data.liked === "boolean") setLiked(data.liked);
      if (data.grant) notifyCoinsChanged();
      onChange?.(data);
    } catch (err) {
      // Roll back optimistic update.
      setLiked(!nextLiked);
      setCount(count);
      message.error(err?.message || "Couldn't like this craft");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type={liked ? "primary" : "default"}
      shape="round"
      icon={liked ? <HeartFilled /> : <HeartOutlined />}
      onClick={onClick}
      loading={busy}
      style={{
        background: liked ? colors.accentPurple : undefined,
        borderColor: liked ? colors.accentPurple : undefined,
      }}
    >
      {count}
    </Button>
  );
}
