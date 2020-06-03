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
import { EditOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import { Typography, Space } from 'antd';
import { getImageUrl } from 'util/getImageUrl';
const { Meta } = Card;
const { Text, Link } = Typography;

const FormButtonStyled = styled(Button)`
margin-bottom: 1rem;
`

// const EditModeContainer = styled.div`
// display: flex;
// flex-direction: column;
// align-items: center;
// margin: 0 auto;
// max-width: 600px;
// `

const EditModeContainer = styled(Card)`
// display: flex;
// flex-direction: column;
// align-items: center;
// margin: 0 auto;
// max-width: 600px;
`

export class ImageCardEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mode: this.props.mode || 'edit',
      id: this.props.id,
      loading: false
    }

    console.log('ctor', this.props)
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

  onChange = async entity => {
    this.setState({ loading: true });
    // Assign id if exists
    Object.assign(entity, {id: this.state.id});
    await this.props.onSave(entity);
    this.setState({ loading: false });
    this.changeMode('read');
    message.success({ content: 'Successfully created the picture', duration: 5 });
  }

  delete = async () => {
    const { id } = this.state;
    if (id) {
      this.setState({ loading: true });
      console.log('about to delete', this.state);
      await this.props.onDelete(id);
      this.setState({ loading: false });
      message.success({ content: 'Successfully deleted the picture', duration: 5 });
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
    if(otherStatus) {
      // debugger;
    }

    return (
      <div>
        {otherStatus && <Text type="danger">Bad status {mode}</Text>}
        {showCard && <Card hoverable style={{ width: this.props.readWidth }}
          cover={<img alt="example" src={getImageUrl(data.imageId)} />}
          actions={[
            <Text type="danger"><DeleteOutlined type="danger" key="delete" onClick={() => this.delete()} /></Text>,
            <EditOutlined key="edit" onClick={() => this.changeMode('edit')} />,
          ]}
        >
          <Meta title={data.title} description={data.description} />
        </Card>}
        {showEdit && <EditModeContainer style={{ width: this.props.editWidth }}>
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
                  Save
            </FormButtonStyled>
                <FormButtonStyled htmlType="button" type="text" block onClick={() => this.changeMode('read')}>
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
