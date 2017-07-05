import React from 'react';

function isEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
function findMatches(text) {
  const pattern = /(https?:\/\/)?(www\.)?([-a-z0-9@:%_\+~#=]{2,256}\.)+[a-z]{2,6}\/?([-a-z0-9@:%_\\+~#?&/=]*)((\.+([-a-z0-9@:%_\\+~#?&/=]+))*)/ig;

  const matches = [];
  let match;
  while (match = pattern.exec(text)) {
    const email = isEmail(match[0]);
    const url = email
      ? 'mailto:' + match[0]
      : match[0].startsWith('http://') || match[0].startsWith('https://') ? match[0] : 'https://' + match[0];
    const shortUrl = email ? match[0] : match[0].replace(/(https?:\/\/)?(www\.)?/, '');
    const text = !email && shortUrl.length > 20 ? shortUrl.slice(0, 20) + '...' : shortUrl;

    matches.push({
      index: match.index,
      lastIndex: pattern.lastIndex,
      url,
      text,
      type: email ? 'email' : 'url'
    });
  }

  return matches;
}

class Linkify extends React.Component {
  static MATCH = 'LINKIFY_MATCH'
  static propTypes = {
    tagName: React.PropTypes.string,
    className: React.PropTypes.string,
    component: React.PropTypes.any,
    children: React.PropTypes.any,
    properties: React.PropTypes.object
  }
  static defaultProps = {
    tagName: 'span',
    className: 'Linkify',
    component: 'a',
    properties: {}
  }

  parseCounter = 0

  getMatches(string) {
    return findMatches(string);
  }
  parseString(string) {
    const elements = [];
    if (string === '') {
      return elements;
    }

    const matches = this.getMatches(string);
    if (!matches) {
      return string;
    }

    let lastIndex = 0;
    matches.forEach((match, idx) => {
      // Push the preceding text if there is any
      if (match.index > lastIndex) {
        elements.push(string.substring(lastIndex, match.index));
      }
      // Shallow update values that specified the match
      const props = { href: match.url, key: `parse${this.parseCounter}match${idx}` };
      for (const key in this.props.properties) {
        let val = this.props.properties[key];
        if (val === Linkify.MATCH) {
          val = match.url;
        }

        props[key] = val;
      }
      elements.push(React.createElement(
        this.props.component,
        props,
        match.text
      ));
      lastIndex = match.lastIndex;
    });

    if (lastIndex < string.length) {
      elements.push(string.substring(lastIndex));
    }

    return (elements.length === 1) ? elements[0] : elements;
  }
  parse(children) {
    let parsed = children;

    if (typeof children === 'string') {
      parsed = this.parseString(children);
    } else if (React.isValidElement(children) && (children.type !== 'a') && (children.type !== 'button')) {
      parsed = React.cloneElement(
        children,
        { key: `parse${++this.parseCounter}` },
        this.parse(children.props.children)
      );
    } else if (children instanceof Array) {
      parsed = children.map(child => {
        return this.parse(child);
      });
    }

    return parsed;
  }

  render() {
    this.parseCounter = 0;
    const parsedChildren = this.parse(this.props.children);
    const CustomTag = this.props.tagName || 'span';

    return <CustomTag className={ this.props.className }>{ parsedChildren }</CustomTag>;
  }
}

export default Linkify;
