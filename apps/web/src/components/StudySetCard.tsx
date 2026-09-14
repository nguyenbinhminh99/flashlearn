import { Link } from 'react-router-dom';
import type { StudySetSummary } from '../types';

interface StudySetCardProps {
  readonly studySet: StudySetSummary;
}

export function StudySetCard({ studySet }: StudySetCardProps) {
  return (
    <Link
      to={`/study-sets/${studySet.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900 line-clamp-2">
          {studySet.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
            studySet.isPublic
              ? 'bg-teal-50 text-teal-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {studySet.isPublic ? 'Công khai' : 'Riêng tư'}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500 line-clamp-2">
        {studySet.description || 'Không có mô tả'}
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>{studySet._count.flashcards} thẻ</span>
        <span>{studySet.owner.displayName}</span>
        {studySet.category ? <span>{studySet.category.name}</span> : null}
      </div>
    </Link>
  );
}
