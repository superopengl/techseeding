import React from 'react';
import { Button, message } from 'antd';
import styled from 'styled-components';
import { MdContentCopy } from "react-icons/md";
import i18n from 'i18next';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const CopyIcon = styled(MdContentCopy)`
  color: rgba(255, 255, 255, 0.25);
  position: relative;
  top: 2px;
  font-size: 13px;
  transition: color 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const StyledButton = styled(Button)`
  && {
    border-radius: 8px;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
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
