import React from 'react';
import { Carousel, Row, Col } from 'antd';
import styled from 'styled-components';
import { List } from 'antd';
import { listPoster } from 'services/posterService';
import { getImageUrl } from 'util/getImageUrl';

const ImgStyled = styled.div`
background-repeat: no-repeat;
background-size: contain;
background-position: center;
width: 100%;
overflow: hidden;
height: 600px;
box-shadow: inset 0 -10px 10px -10px #888888;

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


const ItemStyled = styled(List.Item)`
color: #f0f0f0;
font-weight: bold;
cursor: pointer;
&:hover: {
  color: #fff;
  background-color: rgba(0, 32, 46, 0.3);
}
height: 2.8rem;
padding-top: 10px !important;
padding-bottom: 10px !important;
`;

const CarouselRow = styled(Row)`
background-image: url("images/background.png");
background-repeat: repeat;
background-size: 30%;
height: 600px;
`;

class HomeCarouselArea extends React.Component {

  constructor(props) {
    super(props);

    this.carousel = React.createRef();
    this.state = {};
  }

  componentDidMount() {
    this.loadList();
  }

  async loadList() {
    const list = await listPoster();
    this.setState({
      list
    })
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
    const { list } = this.state;
    return (
      <ContainerStyled gutter={0} style={{ position: 'relative' }}>
        <CarouselRow>
          <Col span={24}>
            <Carousel autoplay dotPosition="bottom" ref={node => (this.carousel = node)}>
              {list && list.map((f, i) => (
                <div key={i}>
                  <ImgStyled style={{ backgroundImage: `url("${getImageUrl(f.imageId)}")` }}>
                  </ImgStyled>
                </div>
              ))}
            </Carousel>
          </Col>
        </CarouselRow>
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
        {list && <ListContainer style={{ position: 'absolute', right: '2rem', top: '2rem', margin: '0 auto 0 auto' }}>
          <List
            size="large"
            // header={<div style={{ color: '#fff', paddingLeft: '1.5rem' }}><b>Ranking</b></div>}
            // footer={<div>Footer</div>}
            // bordered
            dataSource={list}
            renderItem={(item, i) => <ItemStyled onClick={() => this.goTo(i)}>{item.title}</ItemStyled>}
          />
        </ListContainer>}
        {/* </div> */}
        {/* </Row> */}
        {/* <div style={{ maxWidth: 1024, position: 'absolute', bottom: '2rem', right: '2rem' }}>
          <PoweredByLogo></PoweredByLogo>
        </div> */}

      </ContainerStyled>
    );
  }
}

HomeCarouselArea.propTypes = {};

HomeCarouselArea.defaultProps = {};

export default HomeCarouselArea;
