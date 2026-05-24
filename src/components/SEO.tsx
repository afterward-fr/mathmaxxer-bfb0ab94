import { Helmet } from "react-helmet-async";

const SITE = "https://mathmaxxer2025.lovable.app";
const DEFAULT_OG_IMAGE = `${SITE}/logo.png`;

interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
  image?: string;
}

const SEO = ({ title, description, path, ogType = "website", image = DEFAULT_OG_IMAGE }: SEOProps) => {
  const url = `${SITE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={image} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
