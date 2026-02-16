'use client';

import { use } from 'react';
import PageView from '@/components/pages/PageView';

export default function PageViewPage({ params }) {
  const { id } = use(params);

  return <PageView pageId={id} />;
}
