import React, { Component } from 'react';

import '../styles/global.css';
import '../styles/fonts.css';
import './ContactIcon.css';

class ContactIcon extends Component {
    render() {
        return (
            <a className="icon-link" href={this.props.link} target="_blank" rel="noopener noreferrer">
                <img src={this.props.title}/>
            </a>
        );
    }
}

export default ContactIcon;
