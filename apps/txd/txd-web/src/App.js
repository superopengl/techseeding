import React from 'react';
// import 'antd/lib/style/themes/dark.less';
import 'antd/dist/antd.less';
import 'react-image-lightbox/style.css';
import { Route, BrowserRouter } from 'react-router-dom';
import HomePage from 'pages/HomePage';




function App() {
  return (
    <BrowserRouter basename="/">
      <div>
        <Route path="/" component={HomePage} />
      </div>
    </BrowserRouter>
  );
}

export default App;
