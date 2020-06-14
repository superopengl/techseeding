import React from 'react';
import { Row, Typography } from 'antd';
import HomeRowArea from "./HomeRowArea";
import styled from 'styled-components';
import { BulbOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { MailOutlined, PhoneOutlined, WechatOutlined } from '@ant-design/icons';


const SubTitle = styled(Typography.Title)`
color: #f0f0f0 !important;
`

const InfoCard = styled.div`
box-sizing: border-box;
width: 100%;
margin-bottom: 2rem;

a {
  color: #f0f0f0;

  &:hover {
    color: white;
    text-decoration: underline;
  }
}
`;

class HomeFeatureArea extends React.Component {
  constructor(props) {
    super(props);
    this.data = [
      {
        icon: <BulbOutlined />,
        content: 'Create a list of the features of your services and then list how they transfer to benefits. A benefit might be something that you help customers achieve, or something negative that you can help them avoid. In other words, how is your service going to make the customer feel, or what are they going to gain? Think about how your service makes their life better, easier, more cost-efficient or more enjoyable and use these ideas to make your text more enticing.'
      },
      {
        icon: <DollarCircleOutlined />,
        content: 'Create a list of the features of your services and then list how they transfer to benefits. A benefit might be something that you help customers achieve, or something negative that you can help them avoid. In other words, how is your service going to make the customer feel, or what are they going to gain? Think about how your service makes their life better, easier, more cost-efficient or more enjoyable and use these ideas to make your text more enticing.'
      },
      // {
      //   icon: <RocketOutlined />,
      //   content: 'Create a list of the features of your services and then list how they transfer to benefits. A benefit might be something that you help customers achieve, or something negative that you can help them avoid. In other words, how is your service going to make the customer feel, or what are they going to gain? Think about how your service makes their life better, easier, more cost-efficient or more enjoyable and use these ideas to make your text more enticing.'
      // }
    ];
  }


  render() {
    const props = {
      bgColor: '',
      span: {
        xs: 24,
        sm: 24,
        md: 24,
        lg: 8,
        xl: 8,
        xxl: 8
      },
      style: {
        backgroundColor: '#22075e',
        color: '#f0f0f0',
        paddingBottom: 0
      }
    }

    return (
      <HomeRowArea {...props}>
        <InfoCard>
          <SubTitle level={3}>About Us</SubTitle>
          <section>
            We are a team of tech savvies with 15+ years experience in the software industry. We have plenty of successful experiences in website, web application, mobile apps, wechat apps, database design and architecture design. Our tech stacks cover majority of the popular ones including Python, Nodejs, C#, Reactjs, Angular, JavaScript, TypeScript, MongoDB, PostgreSQL, SQL Server, MySQL, Docker, AWS and Azure.
          </section>
        </InfoCard>
        <InfoCard>
          <SubTitle level={3}>Contact</SubTitle>
          <section>
            <p>
              <MailOutlined /> Email      :  <a href="mailto:contact@techseeding.com.au">contact@techseeding.com.au</a>
            </p>
            <p>
              <PhoneOutlined /> Phone     :  0405581228
        </p>
            <p>
              <WechatOutlined /> WeChat   :  superopengl
        </p>
            <p>
              <img src="images/wechat_qr.jpg" alt="wechat account: superopengl" width={100} height={100} />
            </p>
          </section>

        </InfoCard>
        <InfoCard>
          <SubTitle level={3}>Why Us?</SubTitle>
          <section>
            It will be always easy to create a managed website on the internet nowadays. However, shortly many successful small businesses and startups will find out that they will need a customised digital solution that a static website cannot fulfill anymore. With Techseeding, you can have a highly tailored morden cloud-based application to speed up your success.
          </section>
        </InfoCard>
      </HomeRowArea>
    );
  }
}

HomeFeatureArea.propTypes = {};

HomeFeatureArea.defaultProps = {};

export default HomeFeatureArea;
