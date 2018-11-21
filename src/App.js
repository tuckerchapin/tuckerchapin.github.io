import React, { Component } from 'react';

import Project from './components/Project';
import Contact from './components/Contact';

import './global.css';
import './fonts.css';
import './App.css';

import content from './content.js';

class App extends Component {
    render() {
        return (
            <div id="app-container">
                <div id="logo-container">
                    <img className="logo glow" src="/logos/logo_clear.png" alt="glow"/>
                    <img className="logo" src="/logos/logo_clear.png" alt="logo"/>
                </div>
                <div id="info-container">
                    <div id="header-container">
                        <div id="title">Tucker Chapin</div>
                        <div id="contacts">
                            {content.contacts.map((contact, i) => <Contact key={i} {...contact}/>)}
                        </div>
                    </div>
                    <div id="projects">
                        {content.projects.map((project, i) => <Project key={i} {...project}/>)}
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
