import { Tooltip as AntTooltip } from 'antd';
import useIsTouchDevice from '../hooks/useIsTouchDevice.js';

// Drop-in replacement for antd's Tooltip that suppresses the hover popup on
// touch devices, where there is no hover intent and the tooltip just fires on
// tap and lingers in the way. On touch we render the wrapped child as-is; on
// pointer devices it behaves exactly like antd's Tooltip.
export default function Tooltip({ children, ...props }) {
  const isTouch = useIsTouchDevice();
  if (isTouch) return children ?? null;
  return <AntTooltip {...props}>{children}</AntTooltip>;
}
