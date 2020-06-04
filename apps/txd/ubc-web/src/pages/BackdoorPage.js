import React from 'react';
import styled from 'styled-components';
import { Tabs } from 'antd';
import PosterAdminGrid from 'components/grids/PosterAdminGrid';
import GalleryAdminGrid from 'components/grids/GalleryAdminGrid';
import BusinessAdminGrid from 'components/grids/BusinessAdminGrid';
import EventAdminGrid from 'components/grids/EventAdminGrid';
import { Typography } from 'antd';

const { Title } = Typography;
const { TabPane } = Tabs;

const ContainerStyled = styled.div`
  margin: 2rem;
`;

function callback(key) {
  console.log(key);
}

const BackdoorPage = () => (
  <div>
    <ContainerStyled>
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
    </ContainerStyled>
  </div>
);

BackdoorPage.propTypes = {};

BackdoorPage.defaultProps = {};

export default BackdoorPage;
