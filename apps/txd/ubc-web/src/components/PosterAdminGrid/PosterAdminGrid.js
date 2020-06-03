import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';
import { listPoster } from 'services/posterService';
import {
  HomeOutlined,
  SettingFilled,
  SmileOutlined,
  SyncOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import PosterCardEditor from 'components/PosterCardEditor/PosterCardEditor';
import { message } from 'antd';
import { EditOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import { Typography, Space, Badge } from 'antd';
import { getImageUrl } from 'util/getImageUrl';
import styled from 'styled-components';

const { Meta } = Card;
const { Text, Link } = Typography;

const BadgeStyled = styled(Badge)`
margin-right: 0.5rem;
& .ant-badge-count {
  color: #fff;
  background-color: #173875;
  box-shadow: 0 0 0 1px #173875 inset;
}
`;

const CardStyled = styled(Card)`
margin-bottom: 20px;
`;

export class PosterAdminGrid extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      list: undefined,
      loading: false
    }
  }

  componentDidMount() {
    this.loadList()
  }

  loadList = async () => {
    this.setState({ loading: true });
    const list = await listPoster();
    this.setState({
      list,
      loading: false
    });
  }

  onFinish = () => {
    this.loadList();
  }

  delete = async (id) => {
    this.setState({ loading: true });
    console.log('about to delete', this.state);
    await this.props.onDelete(id);
    this.setState({ loading: false });
    message.success({ content: 'Successfully deleted the picture', duration: 5 });
    await this.loadList();
  }

  edit = (id) => {

  }

  render() {
    const { list } = this.state;
    if (!list) {
      return <LoadingOutlined style={{ fontSize: '5rem' }} />
    }
    return (
      <Row gutter={20}>
        {list.map((item, i) => (
          <Col key={i} span={8}>
            <CardStyled hoverable style={{ width: this.props.readWidth }}
              cover={<img alt="example" src={getImageUrl(item.imageId)} />}
              actions={[
                <Text type="danger"><DeleteOutlined key="delete" onClick={() => this.delete(item.id)} /></Text>,
                <EditOutlined key="edit" onClick={() => this.edit(item.id)} />,
              ]}
            >

              <Meta title={
                <div>
                  {item.ordinal && <BadgeStyled count={item.ordinal} showZero={true} />}
                  {item.title}
                </div>}
                description={item.description} />
            </CardStyled>
          </Col>
        ))}
        <Col span={8}><Card>+</Card></Col>
      </Row>
    );
  }
}

PosterAdminGrid.propTypes = {};

PosterAdminGrid.defaultProps = {};

export default PosterAdminGrid;
