import React, { Component } from 'react';

import '../global.css';
import '../fonts.css';
import './Contact.css';

class Contact extends Component {
    render() {
        return (
            <a className="contact-title" href={this.props.link}>{this.props.title}</a>
        );
    }
}

export default Contact;
