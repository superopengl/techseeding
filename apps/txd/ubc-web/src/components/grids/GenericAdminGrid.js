import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import { Badge, Modal, Popconfirm, Tag } from 'antd';
import { getImageUrl } from 'util/getImageUrl';
import styled from 'styled-components';

const { Meta } = Card;

const BadgeStyled = styled(Badge)`
margin-right: 0.5rem;
position: relative;
top: -3px;
& .ant-badge-count {
  color: #fff;
  background-color: #173875;
  box-shadow: 0 0 0 1px #173875 inset;
}
`;

const CardStyled = styled(Card)`
margin-bottom: 20px;
`;

export class GenericAdminGrid extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      list: undefined,
      loading: false,
      editModalVisible: false
    }
  }

  componentDidMount() {
    this.loadList()
  }

  loadList = async () => {
    this.setState({ loading: true });
    const list = await this.props.onLoadList();
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
    message.success({ content: 'Successfully deleted the picture', duration: 5 });
    await this.loadList();
  }

  edit = (id) => {
    if (!id) throw new Error('id not specified when editing')
    this.setState({
      targetId: id,
      editModalVisible: true
    });
  }

  add = () => {
    this.setState({
      targetId: undefined,
      editModalVisible: true
    });
  }

  handleEditModalOk = async () => {
    await this.loadList();
    this.setState({
      // targetId: undefined,
      editModalVisible: false
    });
  }

  handleModalCancel = () => {
    this.setState({
      // targetId: undefined,
      editModalVisible: false
    });
  }

  render() {
    const { list, editModalVisible, targetId } = this.state;
    const { cardsPerRow } = this.props;
    const span = 24 / cardsPerRow;

    const CardEditorComponent = this.props.cardEditorComponent;

    return (
      <div>
        {/* <em>targetId = {targetId}</em> */}
        <Row gutter={20} style={{ paddingBottom: 20 }}>
          {list && list.map((item, i) => (
            <Col key={i} span={span}>
              <CardStyled hoverable
                cover={<img alt="example" src={getImageUrl(item.imageId)} style={{ padding: '1px' }} />}
                actions={[
                  <Popconfirm
                    title={`Are you sure delete this ${this.props.name}?`}
                    onConfirm={() => this.delete(item.id)}
                    okButtonProps={{ danger: true }}
                    okText="Yes, delete!"
                    cancelText="No, cancel"
                  >
                    <a href="#"><DeleteOutlined key="delete" style={{ color: 'red' }} /></a>
                  </Popconfirm>,
                  <EditOutlined key="edit" onClick={() => this.edit(item.id)} />,
                ]}
              >

                <Meta title={
                  <div>
                    {item.ordinal !== undefined && <BadgeStyled count={item.ordinal} showZero={true} />}
                    {item.title}
                  </div>}
                  description={item.description} />
              </CardStyled>
            </Col>
          ))}
          <Col span={span}>
            <Card hoverable onClick={() => this.add()}>
              <PlusOutlined style={{ fontSize: '5rem', margin: 'auto', width: '100%' }} />
            </Card>
          </Col>
        </Row>
        <Modal
          title={`${targetId ? "Edit" : "New"} ${this.props.name}`}
          visible={editModalVisible}
          onOk={this.handleEditModalOk}
          onCancel={this.handleModalCancel}
          footer={null}
        >
          <CardEditorComponent id={this.state.targetId}
            onFinish={this.handleEditModalOk}
            onCancel={this.handleModalCancel}
          ></CardEditorComponent>
        </Modal>
      </div>
    );
  }
}

GenericAdminGrid.propTypes = {
  name: PropTypes.string.isRequired,
  cardEditorComponent: PropTypes.oneOfType([
    PropTypes.instanceOf(React.Component),
    PropTypes.func
  ]).isRequired,
  onLoadList: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  cardsPerRow: PropTypes.number.isRequired,
};

GenericAdminGrid.defaultProps = {
  cardsPerRow: 4
};

export default GenericAdminGrid;
