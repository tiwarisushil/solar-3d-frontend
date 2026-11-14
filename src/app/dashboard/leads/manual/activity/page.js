import { Suspense } from 'react';
import LeadActivity from '@/components/leads/LeadActivity';

export default function Page() {
  return (
    <Suspense>
      <LeadActivity />
    </Suspense>
  );
}
