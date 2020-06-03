import React from 'react';
import PropTypes from 'prop-types';
import { Card, Divider } from 'antd';
import { Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import * as mineFormat from 'mime-format';
import styled from 'styled-components';
import { getImageUrl } from 'util/getImageUrl';

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

    const imageId = this.props.value;

    this.state = {
      loading: false,
      imageId,
      postImageId: imageId || uuidv4(),
      imageUrl: getImageUrl(imageId)
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
    switch (info.file.status) {
      case 'uploading':
        this.setState({ loading: true });
        return;
      case 'done':
        const {postImageId} = this.state;
        // Get this url from response in real world.
        const imageUrl = await this.getBase64(info.file.originFileObj)
        this.setState({
          imageUrl,
          imageId: postImageId,
          loading: false,
        });

        if (this.props.onChange) {
          this.props.onChange(postImageId);
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
    const { imageUrl, postImageId } = this.state;

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
          {imageUrl ? <img src={imageUrl} alt="picture" style={{ width: '100%' }} /> : uploadButton}
        </UploadStyled>
      </div >
    );
  }
}

ImageUploader.propTypes = {};

ImageUploader.defaultProps = {};

export default ImageUploader;
