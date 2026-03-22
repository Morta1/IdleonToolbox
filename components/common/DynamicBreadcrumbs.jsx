import { useRouter } from 'next/router';
import StructuredData, { createBreadcrumbData } from './StructuredData';

const BASE_URL = 'https://idleontoolbox.com';

const formatSegment = (segment) => {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const DynamicBreadcrumbs = () => {
  const { asPath } = useRouter();
  const path = asPath.split('?')[0].split('#')[0];

  if (path === '/') return null;

  const segments = path.split('/').filter(Boolean);
  const items = [{ name: 'Home', item: BASE_URL }];

  segments.forEach((segment, index) => {
    const url = `${BASE_URL}/${segments.slice(0, index + 1).join('/')}`;
    items.push({ name: formatSegment(segment), item: url });
  });

  return <StructuredData data={createBreadcrumbData(items)} />;
};

export default DynamicBreadcrumbs;
