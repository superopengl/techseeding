import React from 'react';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import HomePage from 'pages/HomePage';

const appTheme = {
  token: {
    colorPrimary: '#0071e3',
    colorBgContainer: 'rgba(255, 255, 255, 0.6)',
    colorBgElevated: 'rgba(255, 255, 255, 0.85)',
    colorBorder: 'rgba(0, 0, 0, 0.08)',
    colorText: '#1d1d1f',
    colorTextSecondary: '#86868b',
    fontSize: 15,
    controlHeight: 42,
    controlHeightLG: 50,
    controlHeightSM: 34,
    borderRadius: 12,
    borderRadiusLG: 16,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Segoe UI', sans-serif",
  },
  components: {
    Modal: {
      contentBg: 'rgba(255, 255, 255, 0.82)',
      headerBg: 'transparent',
      titleColor: '#1d1d1f',
    },
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.7)',
      colorBorder: 'rgba(0, 0, 0, 0.1)',
      activeBorderColor: '#0071e3',
    },
    Button: {
      borderRadius: 12,
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: 'rgba(0, 0, 0, 0.04)',
    },
    Tag: {
      colorBgContainer: 'rgba(0, 0, 0, 0.04)',
      colorBorder: 'rgba(0, 0, 0, 0.06)',
      colorText: '#86868b',
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={appTheme}>
      <BrowserRouter basename="/">
        <div>
          <Routes>
            <Route path="/*" element={<HomePage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
