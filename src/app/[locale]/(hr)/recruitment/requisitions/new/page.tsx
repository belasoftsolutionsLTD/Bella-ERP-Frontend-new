import { setRequestLocale } from 'next-intl/server';
import { RequisitionWizard } from '@/features/recruitment/Components/RequisitionWizard';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <RequisitionWizard locale={locale} />
    </div>
  );
}
