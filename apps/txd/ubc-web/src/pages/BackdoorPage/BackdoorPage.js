import React from 'react';
import styled from 'styled-components';
import { Tabs } from 'antd';
import PosterAdminGrid from 'components/grids/PosterAdminGrid';
import GalleryAdminGrid from 'components/grids/GalleryAdminGrid';
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
    <Tabs defaultActiveKey="1" onChange={callback}>
      <TabPane tab="Poster" key="poster">
        <PosterAdminGrid/>
      </TabPane>
      <TabPane tab="Business" key="business">
        Content of Tab Pane 2
    </TabPane>
      <TabPane tab="Event" key="event">
        Content of Tab Pane 3
    </TabPane>
      <TabPane tab="Gallery" key="gallery">
        <GalleryAdminGrid/>
    </TabPane>
    </Tabs>
  </ContainerStyled>
  </div>
);

BackdoorPage.propTypes = {};

BackdoorPage.defaultProps = {};

export default BackdoorPage;
