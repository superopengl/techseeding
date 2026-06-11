import React, { useEffect, useState } from "react";
import { Button, Card, Form, Input, Select, Typography, message as antMessage } from "antd";
import { SendOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { colors, fonts, shadows } from "../theme";

const { Title, Paragraph } = Typography;

const ENQUIRY_TYPE_OPTIONS = [
  { value: "student", label: "Enrol my child" },
  { value: "teacher", label: "Teach or coach kids" },
  { value: "partner", label: "Partner as a school or organisation" },
  { value: "other", label: "Something else" },
];

function useIsCoarsePointer() {
  const [coarse, setCoarse] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)")?.matches === true
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(pointer: coarse)");
    const onChange = (e) => setCoarse(e.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);
  return coarse;
}

function NativeSelect({ options, value, onChange, id, placeholder }) {
  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        width: "100%",
        height: 40,
        padding: "0 32px 0 11px",
        fontSize: 16,
        fontFamily: "inherit",
        color: value ? colors.heading : colors.muted,
        background: "#fff",
        border: "1px solid #d9d9d9",
        borderRadius: 16,
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><path fill='%23999' d='M2 4 l4 4 4 -4z'/></svg>\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 11px center",
        backgroundSize: "12px",
        outline: "none",
      }}
    >
      <option value="" disabled hidden>
        {placeholder || ""}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function EnquiryForm({ autoFocusOnMount = false }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const useNativeSelect = useIsCoarsePointer();

  useEffect(() => {
    if (!autoFocusOnMount) return;
    // Wait one frame so the input is mounted, then focus.
    const id = window.setTimeout(() => {
      form.getFieldInstance?.("contactName")?.focus?.();
    }, 0);
    return () => window.clearTimeout(id);
  }, [autoFocusOnMount, form]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        form.resetFields();
      } else {
        antMessage.error(data.error?.message || "Something went wrong. Please try again.");
      }
    } catch {
      antMessage.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card
        style={{
          maxWidth: 480,
          margin: "0 auto",
          borderRadius: 20,
          border: "none",
          boxShadow: shadows.cardElevated,
          textAlign: "center",
        }}
        styles={{ body: { padding: "48px 32px" } }}
      >
        <CheckCircleOutlined style={{ fontSize: 48, color: colors.primary, marginBottom: 16 }} />
        <Title level={3} style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 8 }}>
          Thank You!
        </Title>
        <Paragraph style={{ color: colors.body, fontSize: 15, marginBottom: 24 }}>
          We've received your enquiry and will get back to you soon.
        </Paragraph>
        <Button
          onClick={() => setSubmitted(false)}
          style={{ borderRadius: 20, fontWeight: 600 }}
        >
          Send Another Enquiry
        </Button>
      </Card>
    );
  }

  return (
    <Card
      style={{
        maxWidth: 480,
        margin: "0 auto",
        borderRadius: 20,
        border: "none",
        boxShadow: shadows.cardElevated,
        textAlign: "left",
      }}
      styles={{ body: { padding: "36px 32px" } }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        initialValues={{ type: "student" }}
      >
        <Form.Item
          label="Contact Name"
          name="contactName"
          rules={[
            { required: true, message: "Please enter your name" },
            { max: 50, message: "Name must be 50 characters or less" },
          ]}
        >
          <Input placeholder="Your name" maxLength={50} size="large" />
        </Form.Item>

        <Form.Item
          label="Email, Phone, or WeChat"
          name="method"
          rules={[
            { required: true, message: "Please enter how we can reach you" },
            { max: 100, message: "Must be 100 characters or less" },
          ]}
        >
          <Input placeholder="parent@email.com or 0412 345 678" maxLength={100} size="large" />
        </Form.Item>

        <Form.Item
          label="Enquiry Type"
          name="type"
          rules={[{ required: true, message: "Please pick what your enquiry is about" }]}
        >
          {useNativeSelect ? (
            <NativeSelect options={ENQUIRY_TYPE_OPTIONS} placeholder="Select one" />
          ) : (
            <Select options={ENQUIRY_TYPE_OPTIONS} size="large" />
          )}
        </Form.Item>

        <Form.Item
          label="Message"
          name="message"
          rules={[
            { required: true, message: "Please enter your message" },
            { max: 2000, message: "Message must be 2000 characters or less" },
          ]}
        >
          <Input.TextArea
            placeholder="What would you like to know? e.g. class schedule, pricing, what my child will learn..."
            rows={4}
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: "center" }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            icon={<SendOutlined />}
            style={{
              height: 48,
              paddingInline: 40,
              fontSize: 18,
              fontWeight: 700,
              borderRadius: 24,
              fontFamily: fonts.heading,
            }}
          >
            Send Enquiry
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
