import React, { Component } from 'react';

import '../styles/global.css';
import '../styles/fonts.css';
import './Project.css';

class Project extends Component {
    render() {
        if (this.props.disabled) {
            return (
                <div>
                    <span className="project-title disabled" href={this.props.link}>{this.props.title}</span>
                    <span className="project-description">{this.props.description}</span>
                </div>
            );
        }

        return (
            <div>
                <a className="project-title" href={this.props.link} target="_blank">{this.props.title}</a>
                <span className="project-description">{this.props.description}</span>
            </div>
        );
    }
}

export default Project;
