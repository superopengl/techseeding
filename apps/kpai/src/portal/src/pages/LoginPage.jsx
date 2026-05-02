import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Typography, Card, Space, Spin, Result, Modal, Row, Col, Segmented, message } from "antd";
import { LoadingOutlined, KeyOutlined, ArrowLeftOutlined, ClockCircleOutlined, PhoneOutlined, WechatOutlined, RocketOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { colors, gradients, shadows, fonts } from "../theme";
import { Logo } from "../components/Logo";
import { apiCall } from "../api";

const { Title, Paragraph, Text } = Typography;

const PHONE_NUMBER = "04XX XXX XXX";
const WECHAT_ID = "your-wechat-id";

export function LoginPage() {
  useEffect(() => { document.title = "Login"; }, []);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loginRequestId, setLoginRequestId] = useState(null);
  const [status, setStatus] = useState(null);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [remaining, setRemaining] = useState(600);
  const [contactOpen, setContactOpen] = useState(false);
  const [loginTab, setLoginTab] = useState("in-class");
  const otpRefs = useRef([]);
  const pollingRef = useRef(null);
  const timeoutRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    if (!loginRequestId || status !== "pending") return;

    const TIMEOUT_MS = 10 * 60 * 1000;
    const POLL_INTERVAL_MS = 5000;
    const deadline = Date.now() + TIMEOUT_MS;
    setRemaining(Math.ceil(TIMEOUT_MS / 1000));

    countdownRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) clearInterval(countdownRef.current);
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      clearInterval(pollingRef.current);
      clearInterval(countdownRef.current);
      setStatus("timedout");
    }, TIMEOUT_MS);

    pollingRef.current = setInterval(async () => {
      try {
        const data = await apiCall(`/api/login/student/${loginRequestId}/status`);
        if (data.status === "approved") {
          clearInterval(pollingRef.current);
          clearTimeout(timeoutRef.current);
          clearInterval(countdownRef.current);
          sessionStorage.setItem("c4k_token", data.token);
          sessionStorage.setItem("c4k_role", "student");
          setStatus("approved");
          navigate("/sandbox");
        } else if (data.status === "rejected") {
          clearInterval(pollingRef.current);
          clearTimeout(timeoutRef.current);
          clearInterval(countdownRef.current);
          setStatus("rejected");
        }
      } catch {
        // ignore
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollingRef.current);
      clearTimeout(timeoutRef.current);
      clearInterval(countdownRef.current);
    };
  }, [loginRequestId, status, navigate]);

  const STUDENT_ID_RE = /^[A-Z0-9]{6}$/;

  const handleSubmit = async () => {
    const id = name.trim().toUpperCase();
    if (!STUDENT_ID_RE.test(id)) {
      setLoginError("Student ID must be exactly 6 letters or numbers");
      return;
    }
    setLoading(true);
    setLoginError(null);
    try {
      const data = await apiCall("/api/login/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: id }),
      });
      setLoginRequestId(data.loginRequestId);
      setRemaining(600);
      setStatus("pending");
    } catch (e) {
      setLoginError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim()) return;
    setEmailLoading(true);
    try {
      await apiCall("/api/login/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // Silently proceed to OTP screen regardless of whether the email exists
    } finally {
      setEmailLoading(false);
      setStatus("otp");
    }
  };

  const handleOtpChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto-focus next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newDigits.every((d) => d !== "")) {
      verifyOtp(newDigits.join(""));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    // Focus last filled or next empty
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
    if (newDigits.every((d) => d !== "")) {
      verifyOtp(newDigits.join(""));
    }
  };

  const verifyOtp = async (code) => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = await res.json();
      if (!body.success) {
        throw new Error(body.error?.message || "Verification failed");
      }
      sessionStorage.setItem("c4k_token", body.data.token);
      sessionStorage.setItem("c4k_role", body.data.role);
      navigate(body.data.role === "admin" ? "/admin" : "/sandbox");
    } catch (e) {
      setOtpError(e.message || "Verification failed");
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    background: gradients.login,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    position: "relative",
    overflow: "hidden",
  };

  const bgSvg = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'>
    <!-- Game controller -->
    <g transform='translate(80,60) rotate(-15)' opacity='0.07'>
      <rect x='0' y='10' width='60' height='36' rx='12' fill='%2343b88c'/>
      <rect x='14' y='4' width='8' height='18' rx='2' fill='%2343b88c'/>
      <rect x='8' y='10' width='20' height='8' rx='2' fill='%2343b88c'/>
      <circle cx='44' cy='22' r='4' fill='%23e8f8f0'/><circle cx='44' cy='34' r='4' fill='%23e8f8f0'/>
    </g>
    <!-- Star -->
    <polygon points='700,80 712,110 744,110 718,128 728,158 700,140 672,158 682,128 656,110 688,110' fill='%23fcd63c' opacity='0.09'/>
    <!-- Tetris L-block -->
    <g transform='translate(650,600) rotate(20)' opacity='0.06'>
      <rect width='28' height='28' rx='4' fill='%237c5cfc'/><rect y='28' width='28' height='28' rx='4' fill='%237c5cfc'/><rect x='28' y='28' width='28' height='28' rx='4' fill='%237c5cfc'/>
    </g>
    <!-- Tetris T-block -->
    <g transform='translate(100,650) rotate(-10)' opacity='0.06'>
      <rect width='24' height='24' rx='3' fill='%236ec1e4'/><rect x='24' width='24' height='24' rx='3' fill='%236ec1e4'/><rect x='48' width='24' height='24' rx='3' fill='%236ec1e4'/><rect x='24' y='24' width='24' height='24' rx='3' fill='%236ec1e4'/>
    </g>
    <!-- Pixel heart -->
    <g transform='translate(640,320)' opacity='0.07'>
      <rect x='8' y='0' width='8' height='8' fill='%23f59e0b'/><rect x='24' y='0' width='8' height='8' fill='%23f59e0b'/>
      <rect x='0' y='8' width='40' height='8' fill='%23f59e0b'/>
      <rect x='4' y='16' width='32' height='8' fill='%23f59e0b'/>
      <rect x='8' y='24' width='24' height='8' fill='%23f59e0b'/>
      <rect x='12' y='32' width='16' height='8' fill='%23f59e0b'/>
      <rect x='16' y='40' width='8' height='8' fill='%23f59e0b'/>
    </g>
    <!-- D-pad -->
    <g transform='translate(60,380) rotate(10)' opacity='0.06'>
      <rect x='14' y='0' width='14' height='42' rx='3' fill='%237c5cfc'/><rect x='0' y='14' width='42' height='14' rx='3' fill='%237c5cfc'/>
    </g>
    <!-- Coin -->
    <circle cx='720' cy='450' r='22' fill='none' stroke='%23fcd63c' stroke-width='3' opacity='0.09'/>
    <text x='720' y='457' text-anchor='middle' font-size='20' font-weight='bold' fill='%23fcd63c' opacity='0.09'>$</text>
    <!-- Lightning bolt -->
    <polygon points='180,150 195,150 188,170 202,170 178,198 184,178 172,178' fill='%23f59e0b' opacity='0.07'/>
    <!-- Small stars scattered -->
    <polygon points='400,50 404,62 416,62 406,70 410,82 400,74 390,82 394,70 384,62 396,62' fill='%2343b88c' opacity='0.06'/>
    <polygon points='300,720 303,728 312,728 305,733 308,742 300,737 292,742 295,733 288,728 297,728' fill='%236ec1e4' opacity='0.07'/>
    <!-- Pixel sword -->
    <g transform='translate(500,100) rotate(35)' opacity='0.06'>
      <rect x='0' y='0' width='6' height='36' rx='1' fill='%2343b88c'/>
      <rect x='-8' y='36' width='22' height='6' rx='1' fill='%2343b88c'/>
      <rect x='-2' y='42' width='10' height='10' rx='1' fill='%2343b88c'/>
    </g>
    <!-- Tetris S-block -->
    <g transform='translate(350,680) rotate(5)' opacity='0.05'>
      <rect width='26' height='26' rx='4' fill='%2361ce70'/><rect x='26' width='26' height='26' rx='4' fill='%2361ce70'/><rect x='-26' y='26' width='26' height='26' rx='4' fill='%2361ce70'/><rect x='0' y='26' width='26' height='26' rx='4' fill='%2361ce70'/>
    </g>
    <!-- Diamond/gem -->
    <polygon points='50,520 65,505 80,520 65,550' fill='%236ec1e4' opacity='0.07'/>
    <!-- Small crosses -->
    <g transform='translate(550,500)' opacity='0.05'>
      <rect x='6' y='0' width='4' height='16' rx='1' fill='%237c5cfc'/><rect x='0' y='6' width='16' height='4' rx='1' fill='%237c5cfc'/>
    </g>
    <g transform='translate(250,250)' opacity='0.05'>
      <rect x='6' y='0' width='4' height='16' rx='1' fill='%23f59e0b'/><rect x='0' y='6' width='16' height='4' rx='1' fill='%23f59e0b'/>
    </g>
  </svg>`)}")`;

  const Decorations = () => (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: bgSvg,
      backgroundSize: "800px 800px",
      backgroundRepeat: "repeat",
      pointerEvents: "none",
    }} />
  );

  const cardStyle = {
    borderRadius: 24,
    border: "none",
    boxShadow: shadows.cardElevated,
    maxWidth: 440,
    width: "100%",
    position: "relative",
    zIndex: 1,
  };

  if (status === "pending") {
    return (
      <div style={containerStyle}>
        <Decorations />
        <Card style={{ ...cardStyle, textAlign: "center" }} styles={{ body: { padding: "48px 32px" } }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: colors.primary }} />} />
          <Title
            level={3}
            style={{ fontFamily: fonts.heading, color: colors.heading, marginTop: 24 }}
          >
            Waiting for Approval
          </Title>
          <Paragraph style={{ color: colors.body, fontSize: 16 }}>
            Hi <strong style={{ color: colors.heading }}>{name}</strong>! Your teacher
            will approve your login shortly. Hang tight!
          </Paragraph>
          <div style={{ color: colors.muted, fontSize: 14, marginTop: 4, marginBottom: 16 }}>
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} remaining
          </div>
          <Button
            type="link"
            onClick={() => {
              clearInterval(pollingRef.current);
              clearTimeout(timeoutRef.current);
              clearInterval(countdownRef.current);
              setStatus(null);
              setName("");
            }}
            style={{ color: colors.body, fontSize: 14 }}
          >
            Re-login
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0" }}>
            <div style={{ flex: 1, height: 1, background: colors.border }} />
            <span style={{ color: colors.muted, fontSize: 13 }}>or</span>
            <div style={{ flex: 1, height: 1, background: colors.border }} />
          </div>
          <Button
            type="link"
            onClick={() => setStatus("otp")}
            style={{ color: colors.primary, fontSize: 14 }}
          >
            Use Verification Code
          </Button>
        </Card>
      </div>
    );
  }

  if (status === "timedout") {
    return (
      <div style={containerStyle}>
        <Decorations />
        <Card style={{ ...cardStyle, textAlign: "center" }} styles={{ body: { padding: "48px 32px" } }}>
          <ClockCircleOutlined style={{ fontSize: 48, color: colors.accentAmber, marginBottom: 12 }} />
          <Title
            level={3}
            style={{ fontFamily: fonts.heading, color: colors.heading, marginTop: 12 }}
          >
            Timed Out
          </Title>
          <Paragraph style={{ color: colors.body, fontSize: 16 }}>
            Your login request was not approved within 10 minutes. Please try again.
          </Paragraph>
          <Button
            type="primary"
            onClick={() => {
              setStatus(null);
              setName("");
            }}
            style={{
              borderRadius: 20,
              height: 44,
              paddingInline: 28,
              marginTop: 8,
              background: colors.ctaYellow,
              color: colors.heading,
              border: "none",
              boxShadow: shadows.ctaButtonSmall,
            }}
          >
            Login Again
          </Button>
        </Card>
      </div>
    );
  }

  if (status === "otp") {
    return (
      <div style={containerStyle}>
        <Decorations />
        <Card style={{ ...cardStyle, textAlign: "center" }} styles={{ body: { padding: "48px 32px" } }}>
          <KeyOutlined style={{ fontSize: 40, color: colors.accentPurple, marginBottom: 12 }} />
          <Title
            level={3}
            style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 8 }}
          >
            Enter Verification Code
          </Title>
          <Paragraph style={{ color: colors.body, marginBottom: 32 }}>
            A 6-digit verification code has been sent to your registered email
          </Paragraph>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginBottom: 32,
            }}
          >
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                disabled={otpLoading}
                style={{
                  width: 48,
                  height: 56,
                  borderRadius: 12,
                  border: `2px solid ${digit ? colors.primary : colors.border}`,
                  fontSize: 24,
                  fontWeight: 700,
                  textAlign: "center",
                  outline: "none",
                  fontFamily: fonts.heading,
                  color: colors.heading,
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                onBlur={(e) => (e.target.style.borderColor = digit ? colors.primary : colors.border)}
              />
            ))}
          </div>
          {otpError && (
            <div style={{ color: colors.error || "#ff4d4f", fontSize: 14, marginBottom: 8 }}>
              {otpError}
            </div>
          )}
          {otpLoading && (
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: colors.primary }} />} />
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 8, gap: 4 }}>
            {email && (
              <Button
                type="link"
                onClick={() => {
                  setOtpDigits(["", "", "", "", "", ""]);
                  handleSendOtp();
                }}
                style={{ color: colors.primary, fontSize: 14 }}
              >
                Resend Verification Code
              </Button>
            )}
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setStatus(loginRequestId ? "pending" : null);
                setOtpDigits(["", "", "", "", "", ""]);
              }}
              style={{ color: colors.body, fontSize: 14 }}
            >
              {loginRequestId ? "Back to Waiting" : "Back to Login"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div style={containerStyle}>
        <Decorations />
        <Card style={cardStyle} styles={{ body: { padding: "48px 32px" } }}>
          <Result
            status="error"
            title="Login Rejected"
            subTitle="Your login request was not approved. Please ask your teacher for help."
            extra={
              <Button
                type="primary"
                onClick={() => {
                  setStatus(null);
                  setStudentId(null);
                  setName("");
                }}
                style={{ borderRadius: 20, height: 44, paddingInline: 28 }}
              >
                Try Again
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Decorations />
      <Card style={cardStyle} styles={{ body: { padding: "48px 32px" } }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Logo size={80} square style={{ marginBottom: 12, marginInline: "auto" }} />
          <Title
            level={3}
            style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 0 }}
          >
            Welcome to KidPlayAI!
          </Title>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Segmented
            value={loginTab}
            onChange={setLoginTab}
            options={[
              { label: "In Class", value: "in-class" },
              { label: "After Class", value: "after-class" },
            ]}
            style={{ fontWeight: 600 }}
          />
        </div>

        {loginTab === "in-class" ? (
          <>
            <Paragraph style={{ color: colors.body, fontSize: 14, textAlign: "center", marginBottom: 20 }}>
              Enter your Student ID to jump in
            </Paragraph>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Input
                size="large"
                placeholder="Student ID"
                allowClear
                maxLength={6}
                value={name}
                onChange={(e) => { setName(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setLoginError(null); }}
                onPressEnter={handleSubmit}
                style={{ borderRadius: 12, height: 48 }}
                styles={{ input: { textAlign: "center", letterSpacing: 4, fontWeight: 600 } }}
              />
              <Button
                type="primary"
                size="large"
                block
                loading={loading}
                onClick={handleSubmit}
                disabled={!name.trim()}
                style={{
                  height: 48,
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  background: colors.ctaYellow,
                  color: colors.heading,
                  border: "none",
                  boxShadow: shadows.ctaButtonSmall,
                }}
              >
                Request Login
              </Button>
              {loginError && (
                <div style={{ color: colors.error || "#ff4d4f", fontSize: 14, textAlign: "center" }}>
                  {loginError}
                </div>
              )}
            </Space>
            <Paragraph style={{ color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 20, marginBottom: 0 }}>
              Don't have a Student ID?{" "}
              <a onClick={() => setContactOpen(true)} style={{ color: colors.primary, cursor: "pointer" }}>
                Contact us
              </a>{" "}
              to register.
            </Paragraph>
          </>
        ) : (
          <>
            <Paragraph style={{ color: colors.body, fontSize: 14, textAlign: "center", marginBottom: 20 }}>
              Practise at home — enter your registered email and we'll send a verification code
            </Paragraph>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Input
                size="large"
                placeholder="Email"
                allowClear
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onPressEnter={handleSendOtp}
                style={{ borderRadius: 12, height: 48 }}
                styles={{ input: { textAlign: "center" } }}
              />
              <Button
                type="primary"
                size="large"
                block
                loading={emailLoading}
                onClick={handleSendOtp}
                disabled={!email.trim()}
                style={{
                  height: 48,
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  background: colors.ctaYellow,
                  color: colors.heading,
                  border: "none",
                  boxShadow: shadows.ctaButtonSmall,
                }}
              >
                Send Verification Code
              </Button>
            </Space>
            <Paragraph style={{ color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 20, marginBottom: 0 }}>
              Ask a parent or guardian for help with your registered email.{" "}
              <a onClick={() => setContactOpen(true)} style={{ color: colors.primary, cursor: "pointer" }}>
                Contact us
              </a>{" "}
              if you haven't registered yet.
            </Paragraph>
          </>
        )}
      </Card>

      {/* Contact Modal */}
      <Modal
        open={contactOpen}
        onCancel={() => setContactOpen(false)}
        footer={null}
        centered
        width={480}
        styles={{
          content: { borderRadius: 24, padding: "40px 32px", textAlign: "center" },
        }}
      >
        <RocketOutlined style={{ fontSize: 40, color: colors.primary, marginBottom: 16 }} />
        <Title
          level={3}
          style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 8 }}
        >
          Get in Touch
        </Title>
        <Paragraph style={{ color: colors.body, fontSize: 15, marginBottom: 32, maxWidth: 360, marginInline: "auto" }}>
          Reach out to learn about upcoming classes, schedule, and fees. We'd love to hear from you!
        </Paragraph>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <a href={`tel:${PHONE_NUMBER.replace(/\s/g, "")}`} style={{ textDecoration: "none" }}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  border: `2px solid ${colors.primary}`,
                  textAlign: "center",
                }}
                styles={{ body: { padding: "24px 16px" } }}
              >
                <PhoneOutlined style={{ fontSize: 32, color: colors.primary, marginBottom: 12 }} />
                <Title level={5} style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 4 }}>
                  Call Us
                </Title>
                <Text style={{ color: colors.bodyStrong, fontSize: 16, fontWeight: 600 }}>
                  {PHONE_NUMBER}
                </Text>
              </Card>
            </a>
          </Col>
          <Col xs={24} sm={12}>
            <Card
              style={{
                borderRadius: 16,
                border: `2px solid ${colors.successGreen}`,
                textAlign: "center",
              }}
              styles={{ body: { padding: "24px 16px" } }}
            >
              <WechatOutlined style={{ fontSize: 32, color: colors.successGreen, marginBottom: 12 }} />
              <Title level={5} style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 4 }}>
                WeChat
              </Title>
              <Text style={{ color: colors.bodyStrong, fontSize: 16, fontWeight: 600 }}>
                {WECHAT_ID}
              </Text>
            </Card>
          </Col>
        </Row>
      </Modal>
    </div>
  );
}
