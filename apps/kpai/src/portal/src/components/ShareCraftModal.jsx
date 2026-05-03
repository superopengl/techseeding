import React from "react";
import { Modal, Input, Typography, message } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { colors, shadows } from "../theme";

export function ShareCraftModal({ open, onCancel, sandboxId, zIndex, description }) {
  const shareUrl = `${window.location.origin}/api/sandbox/${sandboxId}/preview`;

  return (
    <Modal
      title="Share Your Craft"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={400}
      destroyOnHidden
      zIndex={zIndex}
    >
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        {description && (
          <p style={{ color: "#4a5568", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
            {description}
          </p>
        )}
        <div style={{
          display: "inline-block",
          padding: 20,
          borderRadius: 20,
          background: colors.mintBg,
          boxShadow: "0 2px 12px rgba(124,92,252,0.10)",
        }}>
          <QRCodeSVG
            value={shareUrl}
            size={180}
            fgColor={colors.primary}
            level="H"
            imageSettings={{
              src: "/logo-square.png",
              width: 40,
              height: 40,
              excavate: true,
            }}
          />
        </div>
        <Input.Search
          value={shareUrl}
          readOnly
          enterButton="Copy"
          onSearch={() => {
            navigator.clipboard.writeText(shareUrl);
            message.success("Link copied!");
          }}
          style={{ marginTop: 16 }}
          styles={{ affixWrapper: { borderRadius: 12, height: 44 } }}
          enterButtonProps={{
            style: {
              height: 44,
              borderRadius: "0 12px 12px 0",
              background: colors.ctaYellow,
              color: colors.heading,
              border: "none",
              fontWeight: 600,
              boxShadow: shadows.ctaButtonSmall,
            },
          }}
        />
        <Typography.Link
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, color: colors.primary, fontSize: 14 }}
        >
          <LinkOutlined /> Open in new tab
        </Typography.Link>
      </div>
    </Modal>
  );
}
