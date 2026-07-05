'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Briefcase, MapPin, Users, ChevronRight } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  headcount: number;
  salaryRange?: { min: number; max: number; currency: string };
}

export default function CareersPage() {
  const { locale } = useParams<{ locale: string }>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/public/jobs`)
      .then((r) => r.json())
      .then((d) => setJobs(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtSalary = (s?: Job['salaryRange']) => s?.min ? `${s.currency} ${s.min.toLocaleString()}${s.max ? ` – ${s.max.toLocaleString()}` : '+'}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="font-bold text-gray-900 text-lg leading-tight">Careers</h1>
          <p className="text-xs text-gray-400">{jobs.length} open position{jobs.length !== 1 ? 's' : ''}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No open positions at the moment.</p>
            <p className="text-gray-300 text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job._id}
                href={`/${locale}/careers/${job._id}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">{job.department}</span>
                      <span className="text-[11px] text-gray-400">{job.headcount} opening{job.headcount !== 1 ? 's' : ''}</span>
                    </div>
                    <h2 className="font-bold text-gray-900 text-base group-hover:text-blue-700 transition-colors">{job.title}</h2>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.employmentType}</span>
                    </div>
                    {fmtSalary(job.salaryRange) && (
                      <p className="mt-2 text-xs text-emerald-600 font-semibold">{fmtSalary(job.salaryRange)}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 shrink-0 mt-1 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
