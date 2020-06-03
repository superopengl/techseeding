import React from 'react';
import PropTypes from 'prop-types';
import { Card, Divider } from 'antd';
import { Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import * as mineFormat from 'mime-format';
import styled from 'styled-components';

const UploadStyled = styled(Upload)`
& .ant-upload {
  width: 200px;
  height: 200px;
}
`
const { Meta } = Card;

export class ImageUploader extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      imageId: this.props.value,
      postImageId: this.props.value || uuidv4()
    }
  }

  get imageUrl() {
    return this.state.imageId ? `${process.env.REACT_APP_UBC_S3_URL}/${this.state.imageId}` : null;
  }

  beforeUpload = (file) => {
    const isImage = mineFormat.lookup(file.type).type === 'image';
    return isImage
  }

  getBase64 = async (img) => {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => res(reader.result));
      reader.readAsDataURL(img);
    })
  }

  handleChange = async info => {
    switch (info.file.status) {
      case 'uploading':
        this.setState({ loading: true });
        return;
      case 'done':
        // Get this url from response in real world.
        const imageUrl = await this.getBase64(info.file.originFileObj)
        this.setState({
          imageUrl,
          loading: false,
        });

        if (this.props.onChange) {
          this.props.onChange(this.state.postImageId);
        }
        return;
      default:
    }
  };

  render() {
    const uploadButton = (
      <div>
        {this.state.loading ? <LoadingOutlined /> : <PlusOutlined />}
        <div className="ant-upload-text">Upload</div>
      </div>
    );
    const { postImageId } = this.state;

    return (
      <div>
        <UploadStyled
          name="file"
          listType="picture-card"
          accept="image/*"
          // className="avatar-uploader"
          showUploadList={false}
          action={`${process.env.REACT_APP_UBC_API_ENDPOINT}/image/${postImageId}`}
          beforeUpload={this.beforeUpload}
          onChange={this.handleChange}
        // customRequest={this.onRequest}
        >
          {this.imageUrl ? <img src={this.imageUrl} alt="picture" style={{ width: '100%' }} /> : uploadButton}
        </UploadStyled>
      </div >
    );
  }
}

ImageUploader.propTypes = {};

ImageUploader.defaultProps = {};

export default ImageUploader;
