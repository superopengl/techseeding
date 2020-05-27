import React from 'react';
// import logo from './logo.svg';
import 'antd/dist/antd.less';
// import './App.css';
import { Route, BrowserRouter } from 'react-router-dom';
import HomePage from 'pages/HomePage/HomePage';
import BackdoorPage from 'pages/BackdoorPage/BackdoorPage';
import Error404 from 'pages/Error404/Error404';



function App() {
  return (
    <BrowserRouter basename="/">
      <div>
        <Route exact path="/" component={HomePage} />
        <Route exact path="/backdoor" component={BackdoorPage} />
        {/* <Route component={Error404} /> */}
      </div>
    </BrowserRouter>
  );
}

export default App;
