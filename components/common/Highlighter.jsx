import dynamic from 'next/dynamic';
const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then(mod => mod.Prism),
  { ssr: false }
);
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import React from 'react';

const Highlighter = ({ children }) => {
  return <SyntaxHighlighter language="javascript" style={atomDark} wrapLines>
    {children}
  </SyntaxHighlighter>
};

export default Highlighter;
