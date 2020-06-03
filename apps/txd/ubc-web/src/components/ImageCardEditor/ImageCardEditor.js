import React from 'react';
import PropTypes from 'prop-types';
import ImageUploader from 'components/ImageUploader/ImageUploader';
import { v4 as uuidv4 } from 'uuid';
import { Divider, Form, Input, InputNumber, Button } from 'antd';
import styled from 'styled-components';
import {
  HomeOutlined,
  SettingFilled,
  SmileOutlined,
  SyncOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import { EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import { Typography, Space } from 'antd';
const { Meta } = Card;
const { Text, Link } = Typography;

const FormButtonStyled = styled(Button)`
margin-bottom: 1rem;
`

const EditModeContainer = styled.div`
display: flex;
flex-direction: column;
align-items: center;
margin: 0 auto;
max-width: 600px;
`

export class ImageCardEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mode: 'read',
      id: this.props.id,
      loading: false
    }
  }

  componentDidMount() {
    const { id } = this.state;
    if (id) {
      this.loadEntity(id);
    }
  }

  async loadEntity(id) {
    this.setState({ loading: true });
    const data = await this.props.onFetch(id);
    this.setState({
      data,
      loading: false
    });
  }

  onChange = async gallery => {
    this.setState({ loading: true });
    await this.props.onSave(gallery);
    this.setState({ loading: false });
    this.changeMode('read');
    message.success({ content: 'Successfully created the gallery card', duration: 5 });
  }

  delete = async () => {
    const { id } = this.state;
    if (id) {
      this.setState({ loading: true });
      await this.props.onDelete(id);
      this.setState({ loading: false });
      message.success({ content: 'Successfully deleted the gallery card', duration: 5 });
    }
  }

  changeMode(mode) {
    this.setState({ mode })
  }

  render() {
    const { fieldDefs, onCancel } = this.props;
    const { loading, data, mode } = this.state;

    const showCard = mode !== 'edit' && data;
    const showEdit = mode === 'edit';
    const otherStatus = !showCard && !showEdit;

    return (
      <div>
        {otherStatus && <p>Error status</p>}
        {showCard && <Card hoverable style={{ width: this.props.cardWidth }}
          cover={<img alt="example" src={`${process.env.REACT_APP_UBC_S3_URL}/${data.imageId}`} />}
          actions={[
            <Text type="danger"><DeleteOutlined type="danger" key="delete" onClick={() => this.delete()} /></Text>,
            <EditOutlined key="edit" onClick={() => this.changeMode('edit')} />,
          ]}
        >
          <Meta title={data.title} description={data.description} />
        </Card>}
        {showEdit && <EditModeContainer>
          {loading ?
            <LoadingOutlined style={{ fontSize: '5rem' }} /> :
            <Form style={{ width: '100%' }} layout="vertical" onFinish={this.onChange} initialValues={data}>
              {fieldDefs.map((fieldDef, i) => {
                const { inputProps, type, ...field } = fieldDef;
                return <Form.Item key={i} {...field}>
                  {type === 'uploader' ? <ImageUploader {...inputProps} />
                    : type === 'number' ? <InputNumber {...inputProps} />
                      : type === 'textarea' ? <Input.TextArea {...inputProps} />
                        : <Input {...inputProps} />
                  }
                </Form.Item>
              })}
              <Form.Item>
                <FormButtonStyled htmlType="submit" type="primary" block>
                  Submit
            </FormButtonStyled>
                <FormButtonStyled htmlType="button" block onClick={() => this.changeMode('read')}>
                  Cancel
            </FormButtonStyled>
              </Form.Item>
            </Form>
          }
        </EditModeContainer>}
      </div>
    );
  }
}

ImageCardEditor.propTypes = {};

ImageCardEditor.defaultProps = {};

export default ImageCardEditor;
