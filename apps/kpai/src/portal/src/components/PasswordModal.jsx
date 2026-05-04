import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Typography, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { fetchWithAuth } from "../api";
import { colors, fonts } from "../theme";

const { Paragraph } = Typography;

const MIN_LENGTH = 8;
const MAX_LENGTH = 50;
const PRINTABLE_ASCII = /^[\x20-\x7E]+$/;

function validatePassword(value) {
  if (!value) return "Password is required";
  if (value.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters`;
  if (value.length > MAX_LENGTH) return `Password must be at most ${MAX_LENGTH} characters`;
  if (!PRINTABLE_ASCII.test(value)) {
    return "Password may only contain letters, numbers, and visible characters";
  }
  return null;
}

export function PasswordModal({ open, mode, onSuccess, onCancel }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const isSet = mode === "set";
  const dismissible = !isSet;

  useEffect(() => {
    if (open) {
      form.resetFields();
      setServerError(null);
    }
  }, [open, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      setServerError(null);

      const url = isSet ? "/api/me/set-password" : "/api/me/change-password";
      const payload = isSet
        ? { password: values.newPassword }
        : { currentPassword: values.currentPassword, newPassword: values.newPassword };

      const res = await fetchWithAuth(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!body.success) {
        setServerError(body.error?.message || "Could not update password");
        return;
      }
      message.success(isSet ? "Password set!" : "Password changed!");
      onSuccess?.();
    } catch (err) {
      if (err?.errorFields) return; // form validation error already shown
      setServerError("Could not update password. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      width={420}
      title={
        <span style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: colors.heading }}>
          <LockOutlined style={{ marginRight: 8, color: colors.primary }} />
          {isSet ? "Set Your Password" : "Change Password"}
        </span>
      }
      okText={isSet ? "Set Password" : "Change Password"}
      onOk={handleOk}
      confirmLoading={submitting}
      onCancel={dismissible ? onCancel : undefined}
      closable={dismissible}
      maskClosable={dismissible}
      keyboard={dismissible}
      cancelButtonProps={{ style: { display: dismissible ? undefined : "none" } }}
      okButtonProps={{
        style: {
          background: colors.ctaYellow,
          color: colors.heading,
          border: "none",
          fontWeight: 600,
          borderRadius: 12,
        },
      }}
      destroyOnHidden
    >
      {isSet && (
        <Paragraph style={{ color: colors.body, marginTop: 0 }}>
          Welcome! Set a password so you can log back in next time. Use at least {MIN_LENGTH} characters.
        </Paragraph>
      )}
      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleOk}>
        {!isSet && (
          <Form.Item
            label="Current password"
            name="currentPassword"
            rules={[{ required: true, message: "Please enter your current password" }]}
          >
            <Input.Password size="large" autoFocus maxLength={MAX_LENGTH} />
          </Form.Item>
        )}
        <Form.Item
          label="New password"
          name="newPassword"
          rules={[
            {
              validator: (_, value) => {
                const errMsg = validatePassword(value);
                return errMsg ? Promise.reject(errMsg) : Promise.resolve();
              },
            },
          ]}
        >
          <Input.Password size="large" autoFocus={isSet} maxLength={MAX_LENGTH} />
        </Form.Item>
        <Form.Item
          label="Confirm new password"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Please confirm your new password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                return Promise.reject("Passwords do not match");
              },
            }),
          ]}
        >
          <Input.Password size="large" maxLength={MAX_LENGTH} />
        </Form.Item>
      </Form>
      {serverError && (
        <div style={{ color: "#ff4d4f", textAlign: "center", marginTop: -8 }}>{serverError}</div>
      )}
    </Modal>
  );
}
