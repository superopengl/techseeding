import React from 'react';
import styled from 'styled-components';
import { Tabs, Typography, Modal, Input, Button, Form } from 'antd';
import PosterAdminGrid from 'components/grids/PosterAdminGrid';
import GalleryAdminGrid from 'components/grids/GalleryAdminGrid';
import BusinessAdminGrid from 'components/grids/BusinessAdminGrid';
import EventAdminGrid from 'components/grids/EventAdminGrid';
import { EyeTwoTone, EyeInvisibleOutlined, GlobalOutlined, WechatOutlined } from '@ant-design/icons';
import md5 from 'md5';

const { Title } = Typography;
const { TabPane } = Tabs;

const ContainerStyled = styled.div`
  margin: 2rem;
`;

function callback(key) {
  console.log(key);
}

export class BackdoorPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      confirmVisible: true
    }
  }

  handleOk = () => {
    this.setState({ confirmVisible: false });
  }

  handleCancel = () => {
    this.props.history.push('/');
  }

  handleSecretInput = (e) => {
    this.setState({ password: e.target.value });
  }

  render() {
    const { confirmVisible } = this.state;

    return (
      <div>
        {!confirmVisible && <ContainerStyled>
          <Title>Admin Management Page</Title>
          <Tabs defaultActiveKey="1" onChange={callback}>
            <TabPane tab="Poster" key="poster">
              <PosterAdminGrid />
            </TabPane>
            <TabPane tab="Business" key="business">
              <BusinessAdminGrid />
            </TabPane>
            <TabPane tab="Event" key="event">
              <EventAdminGrid />
            </TabPane>
            <TabPane tab="Gallery" key="gallery">
              <GalleryAdminGrid />
            </TabPane>
          </Tabs>
        </ContainerStyled>}
        <Modal
          title="Input admin secret to proceed"
          visible={confirmVisible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          footer={null}
        >
          <Form onFinish={this.handleOk}>
            <Form.Item
              name="password"
              validateFirst={true}
              rules={[
                { required: true, message: 'Please input password' },
                { validator: (rule, value) => {
                  if (md5(value || '') === '21232f297a57a5a743894a0e4a801fc3') {
                    return Promise.resolve();
                  }
                  return Promise.reject('Incorrect password');
                } },
              ]}>
              <Input.Password
                placeholder="input password"
                onChange={this.handleSecretInput}
              />
            </Form.Item>
            <Form.Item>
              <Button key="submit" htmlType="submit" type="primary" block>
                OK
            </Button>
              <Button key="back" type="link" block onClick={this.handleCancel}>
                Cancel
            </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}
BackdoorPage.propTypes = {};

BackdoorPage.defaultProps = {};

export default BackdoorPage;
