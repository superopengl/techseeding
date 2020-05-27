import React from 'react';
import PropTypes from 'prop-types';
import PoweredByLogo from '../PoweredByLogo/PoweredByLogo';
import { Carousel, Row, Col } from 'antd';
import { getVenderData } from '../../services/dataService';
import styled from 'styled-components';
import { UserOutlined, UserAddOutlined, SmileOutlined, AudioOutlined } from '@ant-design/icons';
import { List, Typography, Divider, Input } from 'antd';
const { Search } = Input;

const ImgStyled = styled.div`
background-repeat: no-repeat;
background-size: cover;
background-position: center;
width: 100%;
overflow: hidden;
height: 600px;
`

const ListContainer = styled.div`
height: auto;
min-width: 200px;
width: 300px;
overflow: auto;
background-color: rgba(0,0,0,0.7);
color: #fff;

.ant-list-item:hover {
  background-color: rgba(255,255,255,0.1);
  pointer: cursor;
}
`;

const ContainerStyled = styled.div`
border-bottom: 1px solid #f0f0f0;
height: 600px;
`;

const SearchRowContainer = styled(Row)`
background-color:rgba(0, 0, 0, 0);
position: relative;
bottom: 500px;
max-width: 800px;
margin: 0 auto 0 auto;
`;

const ItemStyled = styled(List.Item)`
color: #fff;
cursor: pointer;
&:hover: {
  color: #fff;
  background-color: rgba(0, 32, 46, 0.3);
}
height: 2.8rem;
padding-top: 10px !important;
padding-bottom: 10px !important;
`;

class HomeCarouselArea extends React.Component {

  constructor(props) {
    super(props);

    this.carousel = React.createRef();
    this.venderData = getVenderData().slice(0, 10);
  }

  getRankIndex(i) {
    switch (i) {
      case 1:

        return <span></span>;

      default:
        break;
    }
  }

  goTo = (i) => {
    this.carousel.goTo(i);
  }

  render() {
    return (
      <ContainerStyled gutter={0} style={{position: 'relative'}}>
        <Row>
          <Col span={24}>
            <Carousel autoplay dotPosition="bottom" ref={node => (this.carousel = node)}>
              {this.venderData.map(f => (
                <div key={f.file}>
                  <ImgStyled style={{ backgroundImage: `url(${f.picture})` }}>
                  </ImgStyled>
                </div>
              ))}
            </Carousel>
          </Col>
        </Row>
        {/* <SearchRowContainer>
          <Search
            placeholder="input search text"
            enterButton
            size="large"
            suffix={<AudioOutlined
              style={{
                fontSize: 16,
                color: '#1890ff',
              }}
            />}
            style={{ marginLeft: '4rem', marginRight: '4rem' }}
            onSearch={value => console.log(value)}
          />
        </SearchRowContainer> */}
        {/* <Row style={{ position: 'absolute', right: 0, width: '100%', margin: '0 auto 0 auto' }}> */}
          {/* <div style={{ position: 'absolute', top: -500, right: 0 }}> */}
            <ListContainer style={{ position: 'absolute', right: '2rem', top: '2rem', margin: '0 auto 0 auto' }}>
              <List
                size="large"
                // header={<div style={{ color: '#fff', paddingLeft: '1.5rem' }}><b>Ranking</b></div>}
                // footer={<div>Footer</div>}
                // bordered
                dataSource={this.venderData}
                renderItem={(item, i) => <ItemStyled onClick={()=>this.goTo(i)}>{item.name}</ItemStyled>}
              />
            </ListContainer>
          {/* </div> */}
        {/* </Row> */}
        <div style={{ maxWidth: 1024, position: 'absolute', bottom: '2rem', right: '2rem' }}>
          <PoweredByLogo></PoweredByLogo>
        </div>

      </ContainerStyled>
    );
  }
}

HomeCarouselArea.propTypes = {};

HomeCarouselArea.defaultProps = {};

export default HomeCarouselArea;
