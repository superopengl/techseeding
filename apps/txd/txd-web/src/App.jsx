import React from 'react';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import HomePage from 'pages/HomePage';

const theme = {
  token: {
    colorPrimary: '#013a8c',
    fontSize: 16,
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
    borderRadius: 4,
  }
};

function App() {
  return (
    <ConfigProvider theme={theme}>
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
