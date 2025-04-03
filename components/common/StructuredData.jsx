import Script from 'next/script';
import React from 'react';

/**
 * A component for adding structured data (JSON-LD) to pages
 * @param {Object} props - The component props
 * @param {Object} props.data - The JSON-LD data object
 * @returns {JSX.Element} - Script element with JSON-LD data
 */
const StructuredData = ({ data }) => {
  if (!data) return null;
  
  return (
    <Script
      id="structured-data-script"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="afterInteractive"
    />
  );
};

/**
 * Creates a BreadcrumbList structured data object
 * @param {Object[]} items - The breadcrumb items
 * @param {string} items[].name - The name of the breadcrumb item
 * @param {string} items[].item - The URL of the breadcrumb item
 * @returns {Object} - The structured data object
 */
export const createBreadcrumbData = (items) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.item
    }))
  };
};

/**
 * Creates a FAQ Page structured data object
 * @param {Object[]} questions - The FAQ questions and answers
 * @param {string} questions[].question - The question text
 * @param {string} questions[].answer - The answer text
 * @returns {Object} - The structured data object
 */
export const createFAQData = (questions) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': questions.map((q) => ({
      '@type': 'Question',
      'name': q.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': q.answer
      }
    }))
  };
};

export default StructuredData; 