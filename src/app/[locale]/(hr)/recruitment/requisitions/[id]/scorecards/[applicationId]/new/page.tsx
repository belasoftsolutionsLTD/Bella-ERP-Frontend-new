import { setRequestLocale } from 'next-intl/server';
import { ScorecardForm } from '@/features/recruitment/Components/ScorecardForm';

export default function Page({ params: { locale, id, applicationId } }: { params: { locale: string; id: string; applicationId: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <ScorecardForm requisitionId={id} applicationId={applicationId} locale={locale} />
    </div>
  );
}
