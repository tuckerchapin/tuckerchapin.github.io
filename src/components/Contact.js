import React, { Component } from 'react';

import '../styles/global.css';
import '../styles/fonts.css';
import './Contact.css';

class Contact extends Component {
    render() {
        return (
            <a className="contact-title" href={this.props.link} target="_blank">{this.props.title}</a>
        );
    }
}

export default Contact;
