import React from 'react';
import { Form, Input, Button, message } from "antd";
import emailjs from 'emailjs-com';
import { Trans } from 'react-i18next';
import { withTranslation } from 'react-i18next';
class ContactForm extends React.Component {

  initialValues = {
    name2: '',
    reply: '',
    message: ''
  };

  formRef = React.createRef();

  constructor(props) {
    super(props);

    this.firstInputRef = React.createRef();

    this.state = {
      sending: false
    }
  }
  
  focus() {
    this.firstInputRef.focus();
  }

  handleSubmit = async values => {
    if(this.state.sending) {
      return;
    }

    const {
      REACT_APP_EMAILJS_TEMPLATEID,
      REACT_APP_EMAILJS_USERID
    } = process.env;

    // console.log(process.env);
    try {
      this.setState({sending: true});
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
      // console.error(e);
    } finally {
      this.setState({sending: false}, () => this.props.onDone());
    }
  }

  reset = () => {
    // console.log('reset triggered');
    this.formRef.current.resetFields();
  }

  handleCancel = () => {
    this.props.onDone();
  }

  render() {
    const {sending} = this.state;
    const { t, i18n } = this.props;

    return (
      <Form onFinish={this.handleSubmit} ref={this.formRef}>
        <Form.Item name="name" rules={[{ required: true, message: 'How shall we announce you?' }]}>
          <Input ref={input => this.firstInputRef = input} placeholder={t('contact.placeholder.name')} allowClear={true} maxLength={100} disabled={sending}/>
        </Form.Item>
        <Form.Item name="reply" rules={[{ required: true, message: 'How can we reach out to you?' }]}>
          <Input placeholder={t('contact.placeholder.reply')} allowClear={true} maxLength={100}  disabled={sending}/>
        </Form.Item>
        <Form.Item name="message" rules={[{ required: true, message: 'Why not let us know more about your needs?' }]}>
          <Input.TextArea autoSize={{ minRows: 3 }} allowClear={true} maxLength={500}  disabled={sending} placeholder={t('contact.placeholder.message')} />
        </Form.Item>
        <Form.Item>
          <Button block type="primary" htmlType="submit" disabled={sending}><Trans i18nKey="button.submit"/></Button>
        </Form.Item>
        <Form.Item>
          <Button block type="link" onClick={this.handleCancel} disabled={sending}><Trans i18nKey="button.cancel"/></Button>
        </Form.Item>
      </Form>
    );
  }
}

ContactForm.propTypes = {};

ContactForm.defaultProps = {};

export default withTranslation(undefined, {withRef: true})(ContactForm);
