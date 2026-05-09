import React from "react";
import { Modal, Input, Typography, message } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { colors, shadows } from "../theme";
import { APP_STORE_URL } from "../constants";

export function ShareCraftModal({ open, onCancel, sandboxId, zIndex, description, studentMode = false }) {
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
              width: 50,
              height: 50,
              excavate: false,
            }}
          />
        </div>
        {studentMode ? (
          <div
            style={{
              marginTop: 20,
              padding: "16px 16px 18px",
              borderRadius: 16,
              background: colors.skyBg,
              border: `1px solid ${colors.border}`,
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <img
                src="/img/kidplayai-app-icon.png"
                alt="KidPlayAI Viewer app icon"
                width={72}
                height={72}
                style={{
                  flexShrink: 0,
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  boxShadow: shadows.cardSubtle,
                  background: colors.surface,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <Typography.Text strong style={{ display: "block", fontSize: 15, color: colors.heading, lineHeight: 1.3 }}>
                  Play it on a phone!
                </Typography.Text>
                <Typography.Text style={{ display: "block", marginTop: 4, fontSize: 13, color: colors.bodyStrong, lineHeight: 1.5 }}>
                  Ask a parent to download the <strong>KidPlayAI Viewer</strong> app and scan this QR code to play and share your craft.
                </Typography.Text>
              </div>
            </div>
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: `1px dashed ${colors.border}`,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  padding: 4,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  flexShrink: 0,
                  width: 72,
                  height: 72,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <QRCodeSVG
                  value={APP_STORE_URL}
                  size={62}
                  level="H"
                  bgColor="#ffffff"
                  fgColor={colors.heading}
                  imageSettings={{
                    src: "/img/kidplayai-app-icon.png",
                    width: 16,
                    height: 16,
                    excavate: true,
                  }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <Typography.Text strong style={{ display: "block", fontSize: 14, color: colors.heading, lineHeight: 1.3 }}>
                  Don't have the app yet?
                </Typography.Text>
                <Typography.Text style={{ display: "block", marginTop: 4, fontSize: 13, color: colors.bodyStrong, lineHeight: 1.5 }}>
                  Scan with an iPhone to install <strong>KidPlayAI Viewer</strong> from the App Store.
                </Typography.Text>
              </div>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </Modal>
  );
}
