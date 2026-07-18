import { useMemo } from 'react';
import { ConfigProvider } from 'antd';
import baseTheme, { withTouchSizing } from './theme.js';
import useIsTouchDevice from './hooks/useIsTouchDevice.js';

// Wraps signed-in routes in the AntD ConfigProvider. Lifted into its own
// module so it can be loaded lazily — the public HomePage doesn't import
// antd at all, which lets vendor-antd stay out of the initial bundle and
// only load when the user navigates to a route that actually needs it.
//
// On coarse-pointer devices (phones, iPad) we swap in the touch-sized theme
// so every AntD control meets the ~44px hit-target standard. The hook is
// live, so an iPad that docks a trackpad flips back to the compact desktop
// sizing without a reload.
export default function AntdShell({ children }) {
  const isTouch = useIsTouchDevice();
  const theme = useMemo(
    () => (isTouch ? withTouchSizing(baseTheme) : baseTheme),
    [isTouch]
  );
  return <ConfigProvider theme={theme}>{children}</ConfigProvider>;
}
