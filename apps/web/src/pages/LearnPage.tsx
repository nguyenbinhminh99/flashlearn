import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Flashcard, StudySetDetail } from '../types';

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j] as T;
    copy[j] = tmp as T;
  }
  return copy;
}

export function LearnPage() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }
    void (async () => {
      try {
        const { data } = await api.get<StudySetDetail>(`/study-sets/${id}`);
        setTitle(data.title);
        setCards(data.flashcards);
      } catch {
        setError('Không tải được bộ thẻ để học.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const current = cards[index];
  const progress = useMemo(() => {
    if (cards.length === 0) {
      return 0;
    }
    return Math.round(((index + (finished ? 1 : 0)) / cards.length) * 100);
  }, [cards.length, index, finished]);

  function goNext(): void {
    setFlipped(false);
    if (index >= cards.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((prev) => prev + 1);
  }

  function goPrev(): void {
    setFinished(false);
    setFlipped(false);
    setIndex((prev) => Math.max(0, prev - 1));
  }

  function onShuffle(): void {
    setCards((prev) => shuffle(prev));
    setIndex(0);
    setFlipped(false);
    setFinished(false);
  }

  if (loading) {
    return <p className="text-slate-500">Đang tải...</p>;
  }
  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (cards.length === 0) {
    return (
      <div className="space-y-3">
        <p>Study Set chưa có flashcard.</p>
        <Link to={`/study-sets/${id}`} className="text-teal-700">
          Quay lại
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-lg text-center space-y-4 rounded-2xl border border-slate-200 bg-white p-10">
        <h1 className="text-3xl font-bold">Hoàn thành!</h1>
        <p className="text-slate-600">
          Bạn đã xem hết {cards.length} thẻ trong &ldquo;{title}&rdquo;.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setFlipped(false);
              setFinished(false);
            }}
            className="rounded-lg bg-teal-600 px-4 py-2 text-white font-medium"
          >
            Học lại
          </button>
          <Link
            to={`/study-sets/${id}`}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium"
          >
            Về bộ thẻ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Đang học</p>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <button
          type="button"
          onClick={onShuffle}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-white"
        >
          Xáo trộn
        </button>
      </div>

      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-teal-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-slate-500">
        Thẻ {index + 1} / {cards.length}
      </p>

      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="group w-full min-h-72 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-teal-50 p-8 text-left shadow-sm transition hover:shadow-md"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-teal-700">
          {flipped ? 'Mặt sau' : 'Mặt trước'} · nhấn để lật
        </p>
        <p className="mt-6 text-2xl sm:text-3xl font-semibold whitespace-pre-wrap">
          {flipped ? current?.back : current?.front}
        </p>
        {flipped && current?.imageUrl ? (
          <img
            src={current.imageUrl}
            alt=""
            className="mt-6 max-h-40 rounded-lg object-contain"
          />
        ) : null}
      </button>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="rounded-lg border border-slate-300 px-4 py-2 font-medium disabled:opacity-40"
        >
          Trước
        </button>
        <button
          type="button"
          onClick={goNext}
          className="rounded-lg bg-teal-600 px-4 py-2 text-white font-medium hover:bg-teal-700"
        >
          {index >= cards.length - 1 ? 'Kết thúc' : 'Tiếp'}
        </button>
      </div>
    </div>
  );
}
