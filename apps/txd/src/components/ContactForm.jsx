import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { App, Form, Input, Button } from "antd";
import styled from 'styled-components';
import emailjs from '@emailjs/browser';
import { Trans, useTranslation } from 'react-i18next';

// Rendered on the cobalt contact band: white fields, sprout-green submit.
const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 1rem;
  }

  .ant-input,
  .ant-input-affix-wrapper,
  textarea.ant-input {
    background: #fff;
    border: 2px solid transparent;
    border-radius: 6px;
    color: var(--ink);
    font-size: 1rem;

    &::placeholder {
      color: #7a8496;
    }

    &:hover {
      border-color: transparent;
    }

    &:focus,
    &.ant-input-affix-wrapper-focused {
      border-color: var(--sprout);
      box-shadow: none;
    }
  }

  .ant-input {
    padding: 0.75rem 1rem;
  }

  .ant-input-affix-wrapper {
    padding: 0 1rem;

    .ant-input {
      padding: 0.75rem 0;
      border: 0;
    }
  }

  textarea.ant-input {
    resize: none;
  }

  .ant-input-status-error,
  .ant-input-affix-wrapper-status-error {
    border-color: var(--sprout) !important;
  }

  .ant-form-item-explain-error {
    margin-top: 0.35rem;
    color: var(--sprout);
    font-size: 0.9rem;
  }

  .ant-input-data-count {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const SubmitButton = styled(Button)`
  && {
    height: 52px;
    padding: 0 2rem;
    border: 0;
    border-radius: 999px;
    font-size: 1.05rem;
    font-weight: 650;
    background: var(--sprout);
    color: var(--ink);
    box-shadow: none;

    &:not(:disabled):hover {
      background: #86ecc0;
      color: var(--ink);
    }

    &:not(:disabled):active {
      background: #3fcf8f;
    }

    &:disabled {
      background: var(--sprout);
      color: var(--ink);
      opacity: 0.6;
    }
  }
`;

const CancelButton = styled(Button)`
  && {
    color: rgba(255, 255, 255, 0.75);

    &:hover {
      color: #fff;
    }
  }
`;

const ContactForm = forwardRef(function ContactForm({ onDone, showCancel = true }, ref) {
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();
  const firstInputRef = useRef(null);
  const { t } = useTranslation();
  const { message } = App.useApp();

  useImperativeHandle(ref, () => ({
    reset() {
      form.resetFields();
    },
    focus() {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }
  }));

  const handleSubmit = async (values) => {
    if (sending) return;

    const {
      VITE_EMAILJS_SERVICEID,
      VITE_EMAILJS_TEMPLATEID,
      VITE_EMAILJS_USERID
    } = import.meta.env;

    const missing = Object.entries({
      VITE_EMAILJS_SERVICEID,
      VITE_EMAILJS_TEMPLATEID,
      VITE_EMAILJS_USERID,
    }).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) {
      console.error(`EmailJS config missing: ${missing.join(', ')}. Restart the dev server after editing .env.`);
      message.error({ content: t('contact.message.error'), key: 'contact.message.error' });
      return;
    }

    try {
      setSending(true);
      await emailjs.send(
        VITE_EMAILJS_SERVICEID,
        VITE_EMAILJS_TEMPLATEID,
        {
          guest_name: values.name,
          guest_reply: values.reply,
          guest_message: values.message,
        },
        VITE_EMAILJS_USERID
      );
      message.success({
        content: t('contact.message.done'),
        key: 'contact.message.done'
      });
    } catch (e) {
      message.error({
        content: t('contact.message.error'),
        key: 'contact.message.error'
      });
    } finally {
      setSending(false);
      form.resetFields();
      onDone?.();
    }
  };

  return (
    <StyledForm form={form} onFinish={handleSubmit}>
      <Form.Item name="name" rules={[{ required: true, message: t('contact.error.name'), whitespace: true, max: 100 }]}>
        <Input ref={firstInputRef} placeholder={t('contact.placeholder.name')} allowClear={true} maxLength={100} disabled={sending} />
      </Form.Item>
      <Form.Item name="reply" rules={[{ required: true, message: t('contact.error.reply'), whitespace: true, max: 100 }]}>
        <Input placeholder={t('contact.placeholder.reply')} allowClear={true} maxLength={100} disabled={sending} />
      </Form.Item>
      <Form.Item name="message" rules={[{ required: true, message: t('contact.error.message'), whitespace: true, max: 1000 }]}>
        <Input.TextArea autoSize={{ minRows: 3 }} allowClear={true} maxLength={1000} disabled={sending} placeholder={t('contact.placeholder.message')} />
      </Form.Item>
      <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
        <SubmitButton htmlType="submit" disabled={sending}><Trans i18nKey="button.submit" /></SubmitButton>
      </Form.Item>
      {showCancel && (
        <Form.Item style={{ marginBottom: 0 }}>
          <CancelButton type="link" onClick={onDone} disabled={sending}><Trans i18nKey="button.cancel" /></CancelButton>
        </Form.Item>
      )}
    </StyledForm>
  );
});

export default ContactForm;
