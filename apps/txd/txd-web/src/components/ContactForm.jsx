import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Form, Input, Button, message } from "antd";
import styled from 'styled-components';
import emailjs from '@emailjs/browser';
import { Trans, useTranslation } from 'react-i18next';

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 16px;
  }

  .ant-input,
  .ant-input-affix-wrapper,
  textarea.ant-input {
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 10px !important;
    color: rgba(255, 255, 255, 0.9) !important;
    font-size: 0.9rem;
    transition: all 0.2s ease;

    &::placeholder {
      color: rgba(255, 255, 255, 0.25) !important;
    }

    &:hover {
      border-color: rgba(255, 255, 255, 0.15) !important;
    }

    &:focus,
    &.ant-input-affix-wrapper-focused {
      border-color: rgba(129, 140, 248, 0.5) !important;
      box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.1) !important;
    }
  }

  .ant-input {
    padding: 10px 14px;
  }

  .ant-input-affix-wrapper {
    padding: 0 14px;

    .ant-input {
      padding: 10px 0 !important;
      border: none !important;
      background: transparent !important;
      box-shadow: none !important;
    }
  }

  textarea.ant-input {
    padding: 10px 14px;
    resize: none;
  }

  .ant-input-clear-icon {
    color: rgba(255, 255, 255, 0.2);

    &:hover {
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .ant-input-data-count {
    color: rgba(255, 255, 255, 0.2);
  }
`;

const SubmitButton = styled(Button)`
  && {
    height: 44px;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border: none;
    color: white;
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(135deg, #4f8ff7, #9d6ff8);
      color: white;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
    }

    &:disabled {
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.2);
      box-shadow: none;
    }
  }
`;

const CancelButton = styled(Button)`
  && {
    height: 36px;
    border-radius: 10px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.35);
    transition: color 0.2s ease;

    &:hover {
      color: rgba(255, 255, 255, 0.7);
    }
  }
`;

const ContactForm = forwardRef(function ContactForm({ onDone }, ref) {
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();
  const firstInputRef = useRef(null);
  const { t } = useTranslation();

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
      VITE_EMAILJS_TEMPLATEID,
      VITE_EMAILJS_USERID
    } = import.meta.env;

    try {
      setSending(true);
      await emailjs.send(
        'gmail_service',
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
      onDone();
    }
  };

  return (
    <StyledForm form={form} onFinish={handleSubmit}>
      <Form.Item name="name" rules={[{ required: true, message: ' ', whitespace: true, max: 100 }]}>
        <Input autoFocus={true} ref={firstInputRef} placeholder={t('contact.placeholder.name')} allowClear={true} maxLength={100} disabled={sending} />
      </Form.Item>
      <Form.Item name="reply" rules={[{ required: true, message: ' ', whitespace: true, max: 100 }]}>
        <Input placeholder={t('contact.placeholder.reply')} allowClear={true} maxLength={100} disabled={sending} />
      </Form.Item>
      <Form.Item name="message" rules={[{ required: true, message: ' ', whitespace: true, max: 1000 }]}>
        <Input.TextArea autoSize={{ minRows: 3 }} allowClear={true} maxLength={1000} disabled={sending} placeholder={t('contact.placeholder.message')} />
      </Form.Item>
      <Form.Item style={{ marginBottom: 8 }}>
        <SubmitButton block htmlType="submit" disabled={sending}><Trans i18nKey="button.submit" /></SubmitButton>
      </Form.Item>
      <Form.Item style={{ marginBottom: 0 }}>
        <CancelButton block type="link" onClick={onDone} disabled={sending}><Trans i18nKey="button.cancel" /></CancelButton>
      </Form.Item>
    </StyledForm>
  );
});

export default ContactForm;
