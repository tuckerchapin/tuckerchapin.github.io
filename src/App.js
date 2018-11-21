import React, { Component } from 'react';
import './App.css';
import Project from './components/Project';

class App extends Component {
  render() {
    return (
        <div id="app-container">
            <div id="logo-container">
                <img className="logo glow" src="/logos/logo_clear.png" alt="glow"/>
                <img className="logo" src="/logos/logo_clear.png" alt="logo"/>
            </div>
            <div id="info-container">
                <div id="title-container">
                    <div className="title glow">Tucker Chapin</div>
                    <div className="title">Tucker Chapin</div>
                </div>
                <div id="project-container">
                    <Project title="SideGuide" description="mobile-optimized campus tours" />
                </div>
            </div>
        </div>
    );
  }
}

export default App;
