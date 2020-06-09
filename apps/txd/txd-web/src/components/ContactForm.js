import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Button, message } from "antd";
import emailjs from 'emailjs-com';

export class ContactForm extends React.Component {

  handleSubmit = async values => {
    console.log(values);
    const {
      REACT_APP_EMAILJS_TEMPLATEID,
      REACT_APP_EMAILJS_USERID
    } = process.env;

    console.log(process.env);
    try {
      await emailjs.send(
        'gmail_service',
        REACT_APP_EMAILJS_TEMPLATEID,
        {
          guest_name: values.name,
          guest_reply: values.reply,
          guest_message: values.message,
        },
        REACT_APP_EMAILJS_USERID
      );
    } catch (e) {
      message.error(`Oops, failed to send contact message!`);
      console.error(e);
    } finally {
      this.props.onDone();
    }
  }


  handleCancel = () => {
    this.props.onDone();
  }

  render() {
    return (
      <Form onFinish={this.handleSubmit}>
        <Form.Item name="name" rules={[{ required: true, message: 'How shall we announce you?' }]}>
          <Input placeholder="Name" allowClear={true} maxLength={100} />
        </Form.Item>
        <Form.Item name="reply" rules={[{ required: true, message: 'How can we reach out to you?' }]}>
          <Input placeholder="Phone or email" allowClear={true} maxLength={100} />
        </Form.Item>
        <Form.Item name="message" rules={[{ required: true, message: 'Why not let us know more about your needs?' }]}>
          <Input.TextArea autoSize={{ minRows: 3 }} allowClear={true} maxLength={1000} placeholder="Tell us a little about your business or how can we help you." />
        </Form.Item>
        <Form.Item>
          <Button block type="primary" htmlType="submit">Submit</Button>
        </Form.Item>
        <Form.Item>
          <Button block type="link" onClick={this.handleCancel}>Cancel</Button>
        </Form.Item>
      </Form>
    );
  }
}

ContactForm.propTypes = {};

ContactForm.defaultProps = {};

export default ContactForm;
