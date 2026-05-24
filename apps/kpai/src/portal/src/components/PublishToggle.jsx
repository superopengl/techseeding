import React, { useState } from "react";
import { Button, Modal, message, Tooltip } from "antd";
import { GlobalOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { apiCall } from "../api";
import { notifyCoinsChanged } from "./CoinBalance";

// Publish state is owned by the parent; this component just renders the
// current state and posts to the publish/unpublish endpoint. The parent
// updates its copy from onChange so the rest of the UI stays in sync.
export function PublishToggle({ sandboxId, publishedAt, onChange }) {
  const [busy, setBusy] = useState(false);
  const isPublished = !!publishedAt;

  const callPublish = async () => {
    setBusy(true);
    try {
      const data = await apiCall(`/api/sandbox/${sandboxId}/publish`, { method: "POST" });
      if (Array.isArray(data?.grants) && data.grants.length > 0) {
        const total = data.grants.reduce((sum, g) => sum + (g.delta || 0), 0);
        if (total > 0) {
          message.success(`Published — you earned ${total} coins! 🪙`);
          notifyCoinsChanged();
        } else {
          message.success("Craft published to the Gallery");
        }
      } else {
        message.success("Craft published to the Gallery");
      }
      onChange?.({ publishedAt: data.publishedAt });
    } catch (err) {
      message.error(err?.message || "Couldn't publish craft");
    } finally {
      setBusy(false);
    }
  };

  const callUnpublish = () => {
    Modal.confirm({
      title: "Hide this craft from the Gallery?",
      content:
        "Other kids won't see it anymore. You'll keep all the coins you've already earned, and you can publish again any time.",
      okText: "Hide it",
      cancelText: "Keep it public",
      onOk: async () => {
        setBusy(true);
        try {
          const data = await apiCall(`/api/sandbox/${sandboxId}/unpublish`, { method: "POST" });
          message.success("Craft hidden from Discover");
          onChange?.({ publishedAt: data.publishedAt });
        } catch (err) {
          message.error(err?.message || "Couldn't unpublish craft");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  return (
    <Tooltip title={isPublished ? "Hide from the Gallery" : "Share with the Gallery"}>
      <Button
        type={isPublished ? "default" : "primary"}
        icon={isPublished ? <EyeInvisibleOutlined /> : <GlobalOutlined />}
        onClick={isPublished ? callUnpublish : callPublish}
        loading={busy}
        aria-label={isPublished ? "Unpublish craft" : "Publish craft"}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
    </Tooltip>
  );
}
