import React from 'react';
import { Button } from 'antd';
import { message } from "antd";
import styled from 'styled-components';
import { MdContentCopy } from "react-icons/md";
import i18n from 'i18next';

const CopyIcon = styled(MdContentCopy)`
  color: #cccccc;
  position: relative;
  top: 3px;

  &:hover {
    color: white;
  }
}
`;

const StyledButton = styled(Button)`
&:hover {
  background-color: rgba(255,255,255,0.2);
}
`;

function setTextToClipboard(value) {
  const content = i18n.t('copy.done', {value});
  message.info({
    content,
    key: 'copy.done'
  });
  console.log('copied', content);
}


export const CopyToClipboardButton = (props) => {
  // const { t, i18n } = useTranslation();
  // const message = t('copy.done', {value});

  return <StyledButton type="link" shape="circle" icon={<CopyIcon />} onClick={() => setTextToClipboard(props.value)}/>
};


