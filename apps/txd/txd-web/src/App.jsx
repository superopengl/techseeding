import React from 'react';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import HomePage from 'pages/HomePage';

const appTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#5b9cf5',
    colorBgContainer: 'rgba(255, 255, 255, 0.06)',
    colorBgElevated: 'rgba(30, 40, 70, 0.85)',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    colorText: 'rgba(255, 255, 255, 0.88)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.55)',
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
      contentBg: 'rgba(20, 30, 60, 0.8)',
      headerBg: 'transparent',
      titleColor: 'rgba(255, 255, 255, 0.9)',
    },
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.07)',
      colorBorder: 'rgba(255, 255, 255, 0.12)',
      activeBorderColor: '#5b9cf5',
    },
    Button: {
      borderRadius: 12,
    },
    Menu: {
      darkItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(255, 255, 255, 0.08)',
    },
    Tag: {
      colorBgContainer: 'rgba(255, 255, 255, 0.06)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      colorText: 'rgba(255, 255, 255, 0.7)',
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
