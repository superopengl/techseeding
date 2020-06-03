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

const FormButtonStyled = styled(Button)`
margin-bottom: 1rem;
`

const Container = styled.div`
display: flex;
flex-direction: column;
align-items: center;
margin: 0 auto;
max-width: 600px;
`

export class ImageCardEditor extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { fieldDefs, value: initialValues, onChange, onCancel, loading } = this.props;

    // const initialValues={
    //   imageId: '58edf047-843f-4cac-ab27-68bde08686ab',
    //   title: 'temp',
    //   description: 'temp2',
    //   ordinal: '99',
    // };

    return (
      <Container>
        {loading ?
          <LoadingOutlined style={{ fontSize: '5rem' }} /> :
          <Form style={{ width: '100%' }} layout="vertical" onFinish={onChange} initialValues={initialValues}>
            <Form.Item name="imageId" label="Picture" rules={[{ required: true, message: 'Please upload image' }]}>
              <ImageUploader></ImageUploader>
            </Form.Item>
            {fieldDefs.map((fieldDef, i) => {
              const { inputProps, ...field } = fieldDef;
              return <Form.Item key={i} {...field}>
                {field.type === 'number' ?
                  <InputNumber {...inputProps} /> :
                  field.type === 'textarea' ?
                    <Input.TextArea {...inputProps} /> :
                    <Input {...inputProps} />
                }
              </Form.Item>
            })}
            <Form.Item>
              <FormButtonStyled htmlType="submit" type="primary" block>
                Submit
            </FormButtonStyled>
              <FormButtonStyled htmlType="button" block onClick={onCancel}>
                Cancel
            </FormButtonStyled>
            </Form.Item>
          </Form>
        }
      </Container>
    );
  }
}

ImageCardEditor.propTypes = {};

ImageCardEditor.defaultProps = {};

export default ImageCardEditor;
