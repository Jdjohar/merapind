import React from 'react';
import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
}

const SEO: React.FC<SEOProps> = ({ title, description }) => {
  const fullTitle = `${title} | Mera Pind`;
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
    </Head>
  );
};

export default SEO;
