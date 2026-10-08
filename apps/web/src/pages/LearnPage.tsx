import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Flashcard, StudySetDetail } from '../types';

interface StudyProgress {
  readonly currentIndex: number;
  readonly completedIds: string[];
}

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
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [resumed, setResumed] = useState(false);

  const hasLoadedProgress = useRef(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    hasLoadedProgress.current = false;
    void (async () => {
      try {
        const { data } = await api.get<StudySetDetail>(`/study-sets/${id}`);
        setTitle(data.title);
        setCards(data.flashcards);

        if (user) {
          try {
            const { data: progress } = await api.get<StudyProgress>(
              `/study-sets/${id}/progress`,
            );
            if (progress.currentIndex > 0 || progress.completedIds.length > 0) {
              const safeIndex = Math.min(
                progress.currentIndex,
                Math.max(data.flashcards.length - 1, 0),
              );
              setIndex(safeIndex);
              setCompletedIds(new Set(progress.completedIds));
              setResumed(true);
            }
          } catch {
            // Không có tiến độ lưu trước đó hoặc lỗi tải — bắt đầu từ đầu.
          }
        }
      } catch {
        setError('Không tải được bộ thẻ để học.');
      } finally {
        setLoading(false);
        hasLoadedProgress.current = true;
      }
    })();
  }, [id, user]);

  function persistProgress(nextIndex: number, nextCompleted: Set<string>): void {
    if (!user || !id || !hasLoadedProgress.current) {
      return;
    }
    void api
      .put(`/study-sets/${id}/progress`, {
        currentIndex: nextIndex,
        completedIds: Array.from(nextCompleted),
      })
      .catch(() => {
        // Bỏ qua lỗi lưu tiến độ, không chặn trải nghiệm học.
      });
  }

  function resetProgress(): void {
    if (user && id) {
      void api.delete(`/study-sets/${id}/progress`).catch(() => {});
    }
  }

  const current = cards[index];
  const progress = useMemo(() => {
    if (cards.length === 0) {
      return 0;
    }
    return Math.round(((index + (finished ? 1 : 0)) / cards.length) * 100);
  }, [cards.length, index, finished]);

  function goNext(): void {
    setFlipped(false);
    setResumed(false);
    if (current) {
      const nextCompleted = new Set(completedIds);
      nextCompleted.add(current.id);
      setCompletedIds(nextCompleted);
      if (index >= cards.length - 1) {
        setFinished(true);
        persistProgress(index, nextCompleted);
        return;
      }
      const nextIndex = index + 1;
      setIndex(nextIndex);
      persistProgress(nextIndex, nextCompleted);
      return;
    }
    if (index >= cards.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((prev) => prev + 1);
  }

  function goPrev(): void {
    setFinished(false);
    setFlipped(false);
    setResumed(false);
    const nextIndex = Math.max(0, index - 1);
    setIndex(nextIndex);
    persistProgress(nextIndex, completedIds);
  }

  function onShuffle(): void {
    setCards((prev) => shuffle(prev));
    setIndex(0);
    setFlipped(false);
    setFinished(false);
    setResumed(false);
    setCompletedIds(new Set());
    resetProgress();
  }

  function onRestart(): void {
    setIndex(0);
    setFlipped(false);
    setFinished(false);
    setResumed(false);
    setCompletedIds(new Set());
    resetProgress();
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
            onClick={onRestart}
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

      {resumed ? (
        <p className="rounded-lg bg-teal-50 px-4 py-2 text-sm text-teal-700">
          Đã khôi phục tiến độ học trước đó của bạn.
        </p>
      ) : null}

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
