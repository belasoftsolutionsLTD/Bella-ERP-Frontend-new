'use client';
import { useTranslations } from 'next-intl';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/configs/constants';
import { downloadFile } from '@/functions/downloadFile';

interface Doc { docId: string; docType: string; fileName: string; uploadedAt: string }

export function DocumentsTab({ employeeId, documents }: { employeeId: string; documents: Doc[] }) {
  const t = useTranslations('Employees');
  const tc = useTranslations('Common');

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">{t('documents')}</h3>
      </div>
      {documents.length === 0 ? (
        <p className="text-sm text-foreground/50">{t('noDocuments')}</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.docId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{doc.fileName}</p>
                  <p className="text-xs text-foreground/50">{doc.docType} · {new Date(doc.uploadedAt).toLocaleDateString('en-KE')}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => downloadFile(`${API_BASE_URL}/employees/${employeeId}/documents/${doc.docId}/download`, doc.fileName ?? 'document').catch(err => alert(err.message))}>
                <Download className="h-4 w-4 mr-1" />{tc('download')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
