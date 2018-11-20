import React, { Component } from 'react';
import './App.css';

class App extends Component {
  render() {
    return (
        <div>
            <div>
                <img id="main-icon" src="/logos/logo_clear.png" />
            </div>
            <div id="name-title">
                tucker chapin
            </div>
            <div id="contact-link-container">
                contact //
                <a className="contact-links" href="mailto:tuckerchapin@gmail.com" target="_blank">mail</a>
                /
                <a className="contact-links" href="https://github.com/tuckerchapin" target="_blank">github</a>
                /
                <a className="contact-links" href="https://www.facebook.com/tuckerchapin" target="_blank">facebook</a>
                /
                <a className="contact-links" href="https://twitter.com/tuckerchapin" target="_blank">twitter</a>
                /
                <a className="contact-links" href="https://www.linkedin.com/in/tuckerchapin" target="_blank">linkedin</a>
            </div>
            <div id="project-label">
                projects //&nbsp;
            </div>
            <div id="project-container">
                <div className="project-capsule">
                    <a className="project-link" href="/what-season-is-it-in-horizon">What Season Is It In Horizon</a>
                    <span className="project-description">/ shows the current season in Forza Horizon 4</span>
                </div>
                <div className="project-capsule">
                    <a className="project-link" href="/hourswithoutyandhi">HoursWithoutYandi</a>
                    <span className="project-description">/ how many hours has it been since Kanye promised us Yandhi</span>
                </div>
                <div className="project-capsule">
                    <a className="project-link" href="/fake-album-cover-generator">Fake Album Cover Generator</a>
                    <span className="project-description">/ automate sourcing of material for r/fakealbumcovers</span>
                </div>
                <div className="project-capsule">
                    <a className="project-link" href="http://fitmango.com">FitMango</a>
                    <span className="project-description">/ on-demand personalized group training</span>
                </div>
                <div className="project-capsule">
                    <a className="project-link" href="http://cleverdoma.in">Clever Domain</a>
                    <span className="project-description">/ generate a trendy domain name</span>
                </div>
                <div className="project-capsule">
                <a className="project-link" href="http://side.guide">Side Guide</a>
                <span className="project-description">/ mobile-optimized campus tours</span>
                </div>
            </div>
        </div>
    );
  }
}

export default App;
