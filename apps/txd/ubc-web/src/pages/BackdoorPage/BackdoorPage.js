import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ImageCardAdminTable from 'components/ImageCardAdminTable/ImageCardAdminTable';
import { Tabs } from 'antd';
const { TabPane } = Tabs;

const ContainerStyled = styled.div`
  margin: 2rem;
`;

function callback(key) {
  console.log(key);
}

const BackdoorPage = () => (
  <ContainerStyled>
    <Tabs defaultActiveKey="1" onChange={callback}>
      <TabPane tab="Poster" key="poster">
        <ImageCardAdminTable></ImageCardAdminTable>
      </TabPane>
      <TabPane tab="Business" key="business">
        Content of Tab Pane 2
    </TabPane>
      <TabPane tab="Event" key="event">
        Content of Tab Pane 3
    </TabPane>
      <TabPane tab="Gallery" key="gallery">
        Content of Tab Pane 3
    </TabPane>
    </Tabs>
  </ContainerStyled>
);

BackdoorPage.propTypes = {};

BackdoorPage.defaultProps = {};

export default BackdoorPage;
