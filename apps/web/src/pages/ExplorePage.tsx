import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { StudySetCard } from '../components/StudySetCard';
import type { Category, Paginated, StudySetSummary } from '../types';

export function ExplorePage() {
  const [items, setItems] = useState<StudySetSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(search = q, cat = categoryId): Promise<void> {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | boolean> = { public: true };
      if (search.trim()) {
        params.q = search.trim();
      }
      if (cat) {
        params.categoryId = cat;
      }
      const { data } = await api.get<Paginated<StudySetSummary>>('/study-sets', {
        params,
      });
      setItems(data.items);
    } catch {
      setError('Không tải được danh sách bộ thẻ.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void api.get<Category[]>('/categories').then((res) => setCategories(res.data));
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(event: FormEvent): void {
    event.preventDefault();
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Khám phá Study Set</h1>
        <p className="text-slate-500 mt-1">Các bộ thẻ công khai từ cộng đồng.</p>
      </div>
      <form onSubmit={onSearch} className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tiêu đề..."
          className="min-w-56 flex-1 rounded-lg border border-slate-300 px-3 py-2"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-white font-medium hover:bg-teal-700"
        >
          Tìm kiếm
        </button>
      </form>
      {loading ? <p className="text-slate-500">Đang tải...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}
      {!loading && items.length === 0 ? (
        <p className="text-slate-500">Chưa có bộ thẻ công khai.</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <StudySetCard key={item.id} studySet={item} />
        ))}
      </div>
    </div>
  );
}
