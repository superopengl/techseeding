import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { colors } from "../theme";

const SIZE_TO_FONT = {
  small: 24,
  default: 32,
  large: 48,
};

export function Loading({
  size = "default",
  color = colors.primary,
  fontSize,
  description,
  ...rest
}) {
  const iconSize = fontSize ?? SIZE_TO_FONT[size] ?? 32;
  return (
    <Spin
      size={size}
      indicator={<LoadingOutlined style={{ fontSize: iconSize, color }} spin />}
      description={description}
      {...rest}
    />
  );
}
