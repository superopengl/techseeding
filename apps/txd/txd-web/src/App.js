import React from 'react';
// import 'antd/lib/style/themes/dark.less';
import 'antd/dist/antd.less';
import 'react-image-lightbox/style.css';
import { Route, BrowserRouter } from 'react-router-dom';
import LandingPage from 'pages/LandingPage';




function App() {
  return (
    <BrowserRouter basename="/">
      <div>
        <Route path="/" component={LandingPage} />
      </div>
    </BrowserRouter>
  );
}

export default App;
