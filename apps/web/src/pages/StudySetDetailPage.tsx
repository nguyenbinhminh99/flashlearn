import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { StudySetDetail } from '../types';

export function StudySetDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studySet, setStudySet] = useState<StudySetDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }
    void (async () => {
      try {
        const { data } = await api.get<StudySetDetail>(`/study-sets/${id}`);
        setStudySet(data);
      } catch {
        setError('Không tải được Study Set (có thể đang ở chế độ riêng tư).');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const isOwner = Boolean(
    user && studySet && studySet.owner.id === user.id,
  );
  const canManage = isOwner || user?.role === 'ADMIN';

  async function onDelete(): Promise<void> {
    if (!id || !studySet) {
      return;
    }
    if (!window.confirm(`Xóa bộ thẻ "${studySet.title}"?`)) {
      return;
    }
    await api.delete(`/study-sets/${id}`);
    navigate('/dashboard');
  }

  if (loading) {
    return <p className="text-slate-500">Đang tải...</p>;
  }
  if (error || !studySet) {
    return <p className="text-red-600">{error || 'Không tìm thấy.'}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {studySet.category?.name ?? 'Không danh mục'} ·{' '}
            {studySet.isPublic ? 'Công khai' : 'Riêng tư'} ·{' '}
            {studySet.owner.displayName}
          </p>
          <h1 className="text-3xl font-bold mt-1">{studySet.title}</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            {studySet.description || 'Không có mô tả'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {studySet.flashcards.length > 0 ? (
            <Link
              to={`/study-sets/${studySet.id}/learn`}
              className="rounded-lg bg-teal-600 px-4 py-2 text-white font-medium hover:bg-teal-700"
            >
              Học ngay
            </Link>
          ) : null}
          {canManage ? (
            <>
              <Link
                to={`/study-sets/${studySet.id}/edit`}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-white"
              >
                Sửa
              </Link>
              <button
                type="button"
                onClick={() => void onDelete()}
                className="rounded-lg border border-red-200 px-4 py-2 font-medium text-red-600 hover:bg-red-50"
              >
                Xóa
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-500">
          {studySet.flashcards.length} flashcard
        </div>
        <ul className="divide-y divide-slate-100">
          {studySet.flashcards.map((card, index) => (
            <li
              key={card.id}
              className="grid gap-3 px-4 py-4 md:grid-cols-2"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {index + 1}. Thuật ngữ
                </p>
                <p className="mt-1 font-medium whitespace-pre-wrap">
                  {card.front}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Định nghĩa
                </p>
                <p className="mt-1 text-slate-700 whitespace-pre-wrap">
                  {card.back}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
