import type { FormEvent } from 'react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../lib/api';
import { MathContent } from '../components/MathContent';
import type { Category, Flashcard, StudySetDetail } from '../types';

const FRONT_MAX_LENGTH = 500;
const BACK_MAX_LENGTH = 2000;
const MathInputDialog = lazy(() => import('../components/MathInputDialog'));

interface MathInsertion {
  readonly start: number;
  readonly end: number;
  readonly initialLatex: string;
  readonly display: boolean;
}

interface FlashcardContentFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly maxLength: number;
  readonly onChange: (value: string) => void;
}

function FlashcardContentField({
  id,
  label,
  value,
  maxLength,
  onChange,
}: FlashcardContentFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [insertion, setInsertion] = useState<MathInsertion | null>(null);

  function openMathInput(): void {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const inline = selected.match(/^\\\(([\s\S]*)\\\)$/);
    const block = selected.match(/^\$\$([\s\S]*)\$\$$/) ?? selected.match(/^\\\[([\s\S]*)\\\]$/);
    setInsertion({ start, end, initialLatex: inline?.[1] ?? block?.[1] ?? '', display: Boolean(block) });
  }

  function restoreCursor(start: number, end = start): void {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(start, end);
    });
  }

  function insertFormula(source: string): void {
    if (!insertion) return;
    const next = value.slice(0, insertion.start) + source + value.slice(insertion.end);
    if (next.length > maxLength) return;
    onChange(next);
    setInsertion(null);
    restoreCursor(insertion.start + source.length);
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-xs uppercase tracking-wide text-slate-500"
        >
          {label}
        </label>
        <button
          type="button"
          onClick={openMathInput}
          disabled={Boolean(insertion)}
          aria-label={`Chèn công thức vào ${label}`}
          aria-haspopup="dialog"
          className="min-h-11 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-100 disabled:opacity-50"
        >
          <span aria-hidden="true" className="mr-1">ƒx</span> Chèn công thức
        </button>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        rows={3}
        value={value}
        maxLength={maxLength}
        disabled={Boolean(insertion)}
        aria-describedby={`math-syntax-help ${id}-count`}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      <p id={`${id}-count`} className="text-right text-xs text-slate-500">
        {value.length}/{maxLength} ký tự
      </p>
      <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-xs font-medium text-slate-500">Xem trước</p>
        {value.trim() ? (
          <MathContent content={value} className="text-sm text-slate-700" />
        ) : (
          <p className="text-sm text-slate-400">Nội dung sẽ hiển thị tại đây.</p>
        )}
      </div>
      {insertion ? (
        <Suspense fallback={<p role="status" className="text-sm text-teal-700">Đang mở bàn phím toán…</p>}>
          <MathInputDialog
            label={label}
            initialLatex={insertion.initialLatex}
            initialDisplay={insertion.display}
            replacing={insertion.start !== insertion.end}
            availableLength={maxLength - value.length + insertion.end - insertion.start}
            beforeContent={value.slice(0, insertion.start)}
            afterContent={value.slice(insertion.end)}
            onInsert={insertFormula}
            onClose={() => { setInsertion(null); restoreCursor(insertion.start, insertion.end); }}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

interface DraftCard {
  readonly key: string;
  id?: string;
  front: string;
  back: string;
  imageUrl: string;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return 'Không lưu được Study Set.';
}

function emptyCard(): DraftCard {
  return {
    key: crypto.randomUUID(),
    front: '',
    back: '',
    imageUrl: '',
  };
}

export function StudySetFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<DraftCard[]>([emptyCard(), emptyCard()]);
  const [originalCardIds, setOriginalCardIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api.get<Category[]>('/categories').then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    if (!id) {
      return;
    }
    void (async () => {
      try {
        const { data } = await api.get<StudySetDetail>(`/study-sets/${id}`);
        setTitle(data.title);
        setDescription(data.description ?? '');
        setIsPublic(data.isPublic);
        setCategoryId(data.categoryId ?? '');
        const mapped = data.flashcards.map((card: Flashcard) => ({
          key: card.id,
          id: card.id,
          front: card.front,
          back: card.back,
          imageUrl: card.imageUrl ?? '',
        }));
        setCards(mapped.length > 0 ? mapped : [emptyCard()]);
        setOriginalCardIds(data.flashcards.map((c) => c.id));
      } catch {
        setError('Không tải được Study Set.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function updateCard(
    key: string,
    field: 'front' | 'back' | 'imageUrl',
    value: string,
  ): void {
    setCards((prev) =>
      prev.map((card) =>
        card.key === key ? { ...card, [field]: value } : card,
      ),
    );
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError('');
    const validCards = cards.filter(
      (c) => c.front.trim() && c.back.trim(),
    );
    if (validCards.length === 0) {
      setError('Cần ít nhất một flashcard hợp lệ.');
      return;
    }
    if (
      validCards.some((card) =>
        card.front.length > FRONT_MAX_LENGTH || card.back.length > BACK_MAX_LENGTH,
      )
    ) {
      setError(
        'Mặt trước tối đa 500 ký tự, mặt sau tối đa 2.000 ký tự (bao gồm mã LaTeX).',
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        isPublic,
        categoryId: categoryId || null,
      };

      let studySetId = id;
      if (isEdit && id) {
        await api.put(`/study-sets/${id}`, payload);
      } else {
        const { data } = await api.post<{ id: string }>('/study-sets', payload);
        studySetId = data.id;
      }

      if (!studySetId) {
        throw new Error('Missing study set id');
      }

      const keptIds: string[] = [];
      for (const card of validCards) {
        const body = {
          front: card.front.trim(),
          back: card.back.trim(),
          imageUrl: card.imageUrl.trim() || null,
        };
        if (card.id) {
          await api.put(`/flashcards/${card.id}`, body);
          keptIds.push(card.id);
        } else {
          const { data } = await api.post<Flashcard>(
            `/study-sets/${studySetId}/cards`,
            body,
          );
          keptIds.push(data.id);
        }
      }

      const toDelete = originalCardIds.filter((cid) => !keptIds.includes(cid));
      for (const cardId of toDelete) {
        await api.delete(`/flashcards/${cardId}`);
      }

      if (keptIds.length > 1) {
        await api.put(`/study-sets/${studySetId}/cards/reorder`, {
          orderedIds: keptIds,
        });
      }

      navigate(`/study-sets/${studySetId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-slate-500">Đang tải...</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Chỉnh sửa Study Set' : 'Tạo Study Set'}
        </h1>
        <p className="text-slate-500 mt-1">
          Thêm thuật ngữ (mặt trước) và định nghĩa (mặt sau).
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tiêu đề</span>
          <input
            required
            minLength={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Mô tả</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="block space-y-1 min-w-48 flex-1">
            <span className="text-sm font-medium">Danh mục</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Không chọn</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pt-7">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span className="text-sm">Công khai</span>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Flashcards</h2>
          <button
            type="button"
            onClick={() => setCards((prev) => [...prev, emptyCard()])}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-white"
          >
            + Thêm thẻ
          </button>
        </div>
        <div
          id="math-syntax-help"
          className="rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm text-slate-700"
        >
          <p className="font-medium">Nhập công thức toán</p>
          <p className="mt-1">Bấm “Chèn công thức” cạnh Thuật ngữ hoặc Định nghĩa để mở bàn phím toán. Đặt con trỏ tại chỗ cần chèn, hoặc chọn một công thức để sửa.</p>
          <p className="mt-1">
            Trong dòng: <code>{'\\(a^2 + b^2 = c^2\\)'}</code>. Riêng dòng:{' '}
            <code>{'$$\\frac{a}{b}$$'}</code> hoặc <code>{'\\[\\frac{a}{b}\\]'}</code>.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Có thể kết hợp văn bản và công thức. Công thức chưa hợp lệ sẽ hiển thị mã màu đỏ;
            công thức chưa đóng dấu phân cách sẽ hiển thị nguyên văn.
          </p>
        </div>
        {cards.map((card, index) => (
          <div
            key={card.key}
            className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-[auto_1fr_1fr_auto]"
          >
            <div className="text-sm font-semibold text-slate-400 pt-2">
              {index + 1}
            </div>
            <FlashcardContentField
              id={`card-${card.key}-front`}
              label="Thuật ngữ"
              value={card.front}
              maxLength={FRONT_MAX_LENGTH}
              onChange={(value) => updateCard(card.key, 'front', value)}
            />
            <FlashcardContentField
              id={`card-${card.key}-back`}
              label="Định nghĩa"
              value={card.back}
              maxLength={BACK_MAX_LENGTH}
              onChange={(value) => updateCard(card.key, 'back', value)}
            />
            <button
              type="button"
              onClick={() =>
                setCards((prev) => prev.filter((c) => c.key !== card.key))
              }
              className="self-start rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>

      {error ? <p className="text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {saving ? 'Đang lưu...' : 'Lưu Study Set'}
      </button>
    </form>
  );
}
