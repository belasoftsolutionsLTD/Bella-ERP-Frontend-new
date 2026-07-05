import { setRequestLocale } from 'next-intl/server';
import { RequisitionWizard } from '@/features/recruitment/Components/RequisitionWizard';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <RequisitionWizard locale={locale} requisitionId={id} />
    </div>
  );
}
