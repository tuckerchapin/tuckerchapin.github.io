import React, { Component } from 'react';
import './App.css';

class App extends Component {
  render() {
    return (
        <div id="app-container">
            <div id="logo-container">
                <img className="logo glow" src="/logos/logo_clear.png"/>
                <img className="logo" src="/logos/logo_clear.png" alt="logo"/>
            </div>
            <div id="info-container">
                <div id="name" className="title">Tucker Chapin</div>
            </div>
        </div>
    );
  }
}

export default App;
