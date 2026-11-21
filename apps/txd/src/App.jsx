import React from 'react';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import { App as AntApp, ConfigProvider } from 'antd';
import HomePage from 'pages/HomePage';
import PrivacyPolicyPage from 'pages/PrivacyPolicyPage';

const appTheme = {
  token: {
    colorPrimary: '#0a3d91',
    colorInfo: '#0a3d91',
    colorText: '#10213f',
    colorTextSecondary: '#5a6478',
    colorBorder: '#d9dee7',
    fontSize: 16,
    controlHeight: 44,
    controlHeightLG: 52,
    controlHeightSM: 34,
    borderRadius: 6,
    borderRadiusLG: 10,
    fontFamily: "'Bricolage Grotesque', 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', 'Microsoft YaHei', system-ui, sans-serif",
  },
};

function App() {
  return (
    <ConfigProvider theme={appTheme}>
      <AntApp>
        <BrowserRouter basename="/">
          <div>
            <Routes>
              <Route path="/privacy_policy" element={<PrivacyPolicyPage />} />
              <Route path="/*" element={<HomePage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
