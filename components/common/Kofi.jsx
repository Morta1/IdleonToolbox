import React from 'react';

const Kofi = ({ display = 'flex' }) => {
  return <a href="https://ko-fi.com/S6S7BHLQ4" target="_blank" style={{ display, alignItems: 'center' }}>
    <img height="36"
         style={{ border: 0, height: 36, width: '100%', objectFit: 'contain' }}
         src="https://storage.ko-fi.com/cdn/kofi1.png?v=6" border="0"
         alt="Buy Me a Coffee at ko-fi.com"/>
  </a>
};

export default Kofi;

