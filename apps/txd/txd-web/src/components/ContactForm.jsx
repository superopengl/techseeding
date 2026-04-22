import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Form, Input, Button, message } from "antd";
import emailjs from '@emailjs/browser';
import { Trans, useTranslation } from 'react-i18next';

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
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item name="name" rules={[{ required: true, message: ' ', whitespace: true, max: 100 }]}>
        <Input autoFocus={true} ref={firstInputRef} placeholder={t('contact.placeholder.name')} allowClear={true} maxLength={100} disabled={sending} />
      </Form.Item>
      <Form.Item name="reply" rules={[{ required: true, message: ' ', whitespace: true, max: 100 }]}>
        <Input placeholder={t('contact.placeholder.reply')} allowClear={true} maxLength={100} disabled={sending} />
      </Form.Item>
      <Form.Item name="message" rules={[{ required: true, message: ' ', whitespace: true, max: 1000 }]}>
        <Input.TextArea autoSize={{ minRows: 3 }} allowClear={true} maxLength={1000} disabled={sending} placeholder={t('contact.placeholder.message')} />
      </Form.Item>
      <Form.Item>
        <Button block type="primary" htmlType="submit" disabled={sending}><Trans i18nKey="button.submit" /></Button>
      </Form.Item>
      <Form.Item>
        <Button block type="link" onClick={onDone} disabled={sending}><Trans i18nKey="button.cancel" /></Button>
      </Form.Item>
    </Form>
  );
});

export default ContactForm;
