import React from 'react';

const Kofi = ({ display = 'flex' }) => {
  return <a href="https://ko-fi.com/S6S7BHLQ4" target="_blank" style={{ display, alignItems: 'center' }}>
    <img width="171" height="36"
         style={{ border: 0, height: 36, width: '100%', objectFit: 'contain' }}
         src="/kofi1.png"
         loading="lazy" fetchPriority="low"
         alt="Buy Me a Coffee at ko-fi.com"/>
  </a>
};

export default Kofi;

