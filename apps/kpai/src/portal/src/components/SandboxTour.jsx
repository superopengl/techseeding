import React, { useMemo } from "react";
import { Tour } from "antd";
import { colors, fonts } from "../theme";

const headingStyle = {
  fontFamily: fonts.heading,
  fontSize: 18,
  fontWeight: 700,
  color: colors.heading,
};

const bodyStyle = {
  fontFamily: fonts.body,
  fontSize: 14,
  lineHeight: 1.5,
  color: colors.bodyStrong,
};

export const TOUR_MENU_STEPS = [3, 4, 5];

export function SandboxTour({
  open,
  current,
  onChange,
  onClose,
  onFinish,
  previewRef,
  terminalRef,
  shareRef,
  avatarRef,
}) {
  const steps = useMemo(
    () => [
      {
        title: <span style={headingStyle}>👀 Your Magic Window</span>,
        description: (
          <div style={bodyStyle}>
            This is where your craft comes to life! 🪄 As the AI builds your
            idea, you'll see it pop up right here — like watching magic happen
            in real-time. Pretty cool, right? 🤩
          </div>
        ),
        target: () => previewRef?.current ?? null,
        placement: "right",
      },
      {
        title: <span style={headingStyle}>🤖 Chat with your AI Buddy</span>,
        description: (
          <div style={bodyStyle}>
            Type your idea here and your AI Buddy will build it! 🚀 Try things
            like <em>"make a game where I catch falling stars"</em> or{" "}
            <em>"add a rainbow background"</em>. The wilder, the better! 🌈
          </div>
        ),
        target: () => terminalRef?.current ?? null,
        placement: "left",
      },
      {
        title: <span style={headingStyle}>🎉 Show Off Your Creation</span>,
        description: (
          <div style={bodyStyle}>
            Made something awesome? Tap <strong>Share</strong> to get a magic
            QR code 📱 and link. Send it to family and friends — they can play
            your craft on any phone or computer! 🌟
          </div>
        ),
        target: () => shareRef?.current ?? null,
        placement: "bottom",
      },
      {
        title: <span style={headingStyle}>📦 Your Craft Collection</span>,
        description: (
          <div style={bodyStyle}>
            Pick <strong>My Crafts</strong> to open your magic toy box! 🧰
            Every craft you've ever made is saved here. Open one to keep
            building, or start a brand new adventure! ✨
          </div>
        ),
        target: () =>
          document.querySelector(".kpai-tour-my-crafts") ??
          avatarRef?.current ??
          null,
        placement: "leftTop",
      },
      {
        title: <span style={headingStyle}>❓ Lost? Tap Show Guidance!</span>,
        description: (
          <div style={bodyStyle}>
            Forgot how something works? No worries! 🙌 Pick{" "}
            <strong>Show Guidance</strong> anytime and I'll take you on this
            tour all over again. Promise! 🤝
          </div>
        ),
        target: () =>
          document.querySelector(".kpai-tour-guidance") ??
          avatarRef?.current ??
          null,
        placement: "leftTop",
      },
      {
        title: <span style={headingStyle}>👋 Logging Out</span>,
        description: (
          <div style={bodyStyle}>
            All done crafting for today? Pick <strong>Logout</strong> to keep
            your account safe. 🔒{" "}
            <strong>
              Super important: if you're using a shared computer (like at school
              or the library), always logout when you're finished!
            </strong>{" "}
            Now go make something amazing! 🚀
          </div>
        ),
        target: () =>
          document.querySelector(".kpai-tour-logout") ??
          avatarRef?.current ??
          null,
        placement: "leftTop",
      },
    ],
    [previewRef, terminalRef, shareRef, avatarRef]
  );

  return (
    <Tour
      open={open}
      current={current}
      onChange={onChange}
      onClose={onClose}
      onFinish={onFinish}
      steps={steps}
      indicatorsRender={(stepIndex, total) => (
        <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.body, fontWeight: 600 }}>
          {stepIndex + 1} / {total}
        </span>
      )}
    />
  );
}
