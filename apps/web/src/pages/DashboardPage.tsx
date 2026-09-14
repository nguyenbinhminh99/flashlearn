import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { StudySetCard } from '../components/StudySetCard';
import type { Paginated, StudySetSummary } from '../types';

export function DashboardPage() {
  const [items, setItems] = useState<StudySetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<Paginated<StudySetSummary>>(
          '/study-sets',
          { params: { mine: true } },
        );
        setItems(data.items);
      } catch {
        setError('Không tải được bộ thẻ của bạn.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Bộ thẻ của tôi</h1>
          <p className="text-slate-500 mt-1">Quản lý Study Set bạn đã tạo.</p>
        </div>
        <Link
          to="/study-sets/new"
          className="rounded-lg bg-teal-600 px-4 py-2.5 text-white font-medium hover:bg-teal-700"
        >
          + Tạo Study Set
        </Link>
      </div>
      {loading ? <p className="text-slate-500">Đang tải...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}
      {!loading && items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-600">Bạn chưa có Study Set nào.</p>
          <Link
            to="/study-sets/new"
            className="mt-4 inline-block text-teal-700 font-medium"
          >
            Tạo bộ thẻ đầu tiên
          </Link>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <StudySetCard key={item.id} studySet={item} />
        ))}
      </div>
    </div>
  );
}
