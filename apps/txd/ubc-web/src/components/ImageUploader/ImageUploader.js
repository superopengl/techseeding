import React from 'react';
import PropTypes from 'prop-types';
import { Card, Divider } from 'antd';
import { Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import * as mineFormat from 'mime-format';

const { Meta } = Card;

export class ImageUploader extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: false
    }
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
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      const imageUrl = await this.getBase64(info.file.originFileObj)
      this.setState({
        imageUrl,
        loading: false,
      });
    }
  };

  onUploadSuccess = (body) => {
    if (this.props.onComplete) {
      console.log('uploaded', body);
      this.props.onComplete(null, body);
    }
  }

  onUploadError = (err, body) => {
    if (this.props.onComplete) {
      this.props.onComplete(err, body);
    }
  }

  onRequest = ({}) => {

  }

  render() {
    const uploadButton = (
      <div>
        {this.state.loading ? <LoadingOutlined /> : <PlusOutlined />}
        <div className="ant-upload-text">Upload</div>
      </div>
    );
    const { imageUrl } = this.state;
    const uuid = uuidv4();
    return (
      <div>
        <Upload
          name="file"
          listType="picture-card"
          accept="image/*"
          // className="avatar-uploader"
          showUploadList={false}
          action={'api/v1/image/' + uuid}
          beforeUpload={this.beforeUpload}
          onChange={this.handleChange}
          // customRequest={this.onRequest}
        >
          {imageUrl ? <img src={imageUrl} alt="avatar" style={{ width: '100%' }} /> : uploadButton}
        </Upload>
      <Divider />

      </div >
    );
  }
}

ImageUploader.propTypes = {};

ImageUploader.defaultProps = {};

export default ImageUploader;
