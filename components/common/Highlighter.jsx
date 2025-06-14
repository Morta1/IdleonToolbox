import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import atomDark from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark';
import React from 'react';

const Highlighter = ({ children }) => {
  return <SyntaxHighlighter language="javascript" style={atomDark} wrapLines>
    {children}
  </SyntaxHighlighter>
};

export default Highlighter;
