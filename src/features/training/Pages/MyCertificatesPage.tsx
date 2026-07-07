'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Award, Download, Plus } from 'lucide-react';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { Button } from '@/components/ui/button';
import { useMyCertificates, useMyExternalCertificates } from '../Hooks/useCertificates';
import { UploadExternalCertSchema, type UploadExternalCertFormValues } from '../schemas';
import { EXTERNAL_CERT_STATUS_STYLES } from '../constants';
import { API_BASE_URL } from '@/configs/constants';

function UploadCertForm({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const { uploadCertificate } = useMyExternalCertificates();
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<UploadExternalCertFormValues>({
    resolver: zodResolver(UploadExternalCertSchema),
    defaultValues: { name: '', issuingOrganization: '', issuedDate: '', expiryDate: '', fileUrl: '', verificationUrl: '' },
  });

  const submit = async (values: UploadExternalCertFormValues) => {
    const res = await uploadCertificate(values);
    if (res) { onUploaded(); onClose(); }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <CustomInput component="text" name="name" control={control} label="Certificate Name" />
        <CustomInput component="text" name="issuingOrganization" control={control} label="Issuing Organization" />
        <CustomInput component="date" name="issuedDate" control={control} label="Issue Date" />
        <CustomInput component="date" name="expiryDate" control={control} label="Expiry Date (optional)" />
        <CustomInput component="text" name="fileUrl" control={control} label="Certificate File URL" placeholder="Link to PDF/image" className="col-span-2" />
        <CustomInput component="text" name="verificationUrl" control={control} label="Verification URL (optional)" className="col-span-2" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="bg-primary text-white" disabled={isSubmitting}>{isSubmitting ? 'Uploading...' : 'Upload'}</Button>
      </div>
    </form>
  );
}

export function MyCertificatesPage() {
  const [tab, setTab] = useState<'earned' | 'external'>('earned');
  const [showUpload, setShowUpload] = useState(false);
  const { certificates, isLoading } = useMyCertificates();
  const { certificates: externalCerts, mutate: mutateExternal, isLoading: externalLoading } = useMyExternalCertificates();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">My Certificates</h1>
        <p className="text-sm text-slate-400">Certificates earned through training, plus any external credentials you've uploaded.</p>
      </div>

      <div className="flex gap-1 border-b border-slate-800">
        {(['earned', 'external'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === t ? 'border-primary text-slate-100' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {t === 'earned' ? 'Earned' : 'External'}
          </button>
        ))}
      </div>

      {tab === 'earned' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Award className="h-5 w-5" /></div>
              <p className="font-medium text-slate-900">{c.course?.title ?? 'Course'}</p>
              <p className="text-xs text-slate-500">{c.certificateNumber}</p>
              <p className="text-xs text-slate-500">Issued {new Date(c.issuedAt).toLocaleDateString()}{c.expiresAt ? ` · Expires ${new Date(c.expiresAt).toLocaleDateString()}` : ''}</p>
              {c.pdfUrl && (
                <a href={`${API_BASE_URL.replace(/\/api$/, '')}${c.pdfUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary text-sm hover:underline">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </a>
              )}
            </div>
          ))}
          {!isLoading && certificates.length === 0 && <p className="col-span-full text-sm text-slate-400 text-center py-10">No certificates earned yet — complete a course with a certificate to earn one.</p>}
        </div>
      )}

      {tab === 'external' && (
        <div className="space-y-4">
          {!showUpload && (
            <Button size="sm" className="bg-primary text-white" onClick={() => setShowUpload(true)}><Plus className="h-4 w-4 mr-1" /> Upload Certificate</Button>
          )}
          {showUpload && <UploadCertForm onClose={() => setShowUpload(false)} onUploaded={() => mutateExternal()} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {externalCerts.map((c) => (
              <div key={c._id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${EXTERNAL_CERT_STATUS_STYLES[c.status]}`}>{c.status}</span>
                </div>
                <p className="text-xs text-slate-500">{c.issuingOrganization}</p>
                <p className="text-xs text-slate-500">Issued {new Date(c.issuedDate).toLocaleDateString()}{c.expiryDate ? ` · Expires ${new Date(c.expiryDate).toLocaleDateString()}` : ''}</p>
                <a href={c.fileUrl} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline">View file</a>
              </div>
            ))}
            {!externalLoading && externalCerts.length === 0 && <p className="col-span-full text-sm text-slate-400 text-center py-10">No external certificates uploaded yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
