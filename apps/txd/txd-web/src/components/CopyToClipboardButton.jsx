import React from 'react';
import { Button, message } from 'antd';
import styled from 'styled-components';
import { MdContentCopy } from "react-icons/md";
import i18n from 'i18next';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const CopyIcon = styled(MdContentCopy)`
  color: rgba(0, 0, 0, 0.2);
  position: relative;
  top: 2px;
  font-size: 13px;
  transition: color 0.2s ease;

  &:hover {
    color: #0071e3;
  }
`;

const StyledButton = styled(Button)`
  && {
    border-radius: 8px;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }
`;

function setTextToClipboard(value) {
  const content = i18n.t('copy.done', { value });
  message.info({
    content,
    key: 'copy.done'
  });
}

export const CopyToClipboardButton = (props) => {
  return (
    <CopyToClipboard text={props.value} onCopy={() => setTextToClipboard(props.value)}>
      <StyledButton type="link" shape="circle" icon={<CopyIcon />} />
    </CopyToClipboard>
  );
};
