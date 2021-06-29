import React from 'react';
import { Layout, Row, Col, Divider } from 'antd';
import styled from 'styled-components';
import GitInfo from 'react-git-info/macro';
import * as queryString from 'query-string';
import { withRouter } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';


const { Footer } = Layout;
const gitInfo = GitInfo();
const gitCommitHash = gitInfo.commit.shortHash;

const FooterStyled = styled(Footer)`
width: 100%;
text-align: center;
font-size: 0.7rem;
color: rgba(255,255,255,0.5);
background-color: #013a8c;
padding-left: 0;
padding-right: 0;
padding-top: 0;
a {
  color: rgba(255,255,255,0.5);

  &:hover {
    color: white;
    text-decoration: underline;
  }
}
`;


class HomeFooter extends React.Component {
  render() {
    const { wechat_app_ver } = queryString.parse(this.props.location.search);
    const versionInfo = `Version: ${gitCommitHash}${wechat_app_ver ? ` / WeChat Mini Program Version: ${wechat_app_ver}` : ''}`;

    return <FooterStyled>
      <section id="about">
        {/* <Divider style={{borderTopColor: 'rgba(255,255,255,0.6)'}}></Divider> */}
        <Row gutter={[10, 2]}>
          <Col span={24}>©{new Date().getFullYear()} Techseeding PTY LTD. All rights reserved.</Col>
          <Col span={24}>
              <HomeOutlined style={{ marginRight: 8 }} /><a href="https://maps.google.com/?q=Unit 101, 11 Spring St., Chatswood, NSW 2067" target="_blank" rel="noopener noreferrer">
                Unit 101, 11 Spring St., Chatswood, NSW 2067
                </a>
            </Col>
          <Col span={24}>ABN: 35631597450 / ACN: 631597450</Col>
          <Col span={24}>{versionInfo}</Col>
        </Row>
      </section>
    </FooterStyled>
  };
}

HomeFooter.propTypes = {};

HomeFooter.defaultProps = {};

export default withRouter(HomeFooter);
