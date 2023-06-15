import React from 'react';

const Kofi = ({ display = 'flex' }) => {
  return <a style={{ display, alignItems: 'center' }}
            href="https://ko-fi.com/S6S7BHLQ4"
            target="_blank"
            rel="noreferrer">
    <img height="36" width="150" style={{ border: 0, height: 36, width: '100%', objectFit: 'contain' }}
         src="https://cdn.ko-fi.com/cdn/kofi1.png?v=3" alt="Buy Me a Coffee at ko-fi.com"/>
  </a>
};

export default Kofi;
