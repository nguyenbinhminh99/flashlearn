import { useEffect, useMemo, useRef, useState } from 'react';
import { MathfieldElement, type Selector } from 'mathlive';
import 'mathlive/fonts.css';
import katex from 'katex';
import { MathContent } from './MathContent';

interface MathInputDialogProps {
  readonly label: string;
  readonly initialLatex: string;
  readonly initialDisplay: boolean;
  readonly replacing: boolean;
  readonly availableLength: number;
  readonly beforeContent: string;
  readonly afterContent: string;
  readonly onInsert: (source: string) => void;
  readonly onClose: () => void;
}

interface MathKey {
  readonly label: string;
  readonly name?: string;
  readonly latex?: string;
  readonly command?: Selector;
}

const groups: Record<string, readonly MathKey[]> = {
  'Cơ bản': [
    { label: '□/□', name: 'Phân số', latex: '\\frac{#?}{#?}' },
    { label: '√□', name: 'Căn bậc hai', latex: '\\sqrt{#?}' },
    { label: 'x²', name: 'Bình phương' },
    { label: 'xⁿ', name: 'Lũy thừa', command: 'moveToSuperscript' },
    { label: '⌫', name: 'Xóa ký tự', command: 'deleteBackward' },
    { label: '(', latex: '(' }, { label: ')', latex: ')' },
    { label: 'π', latex: '\\pi' }, { label: 'e', latex: 'e' },
    { label: '|x|', name: 'Trị tuyệt đối', latex: '\\left|#?\\right|' },
  ],
  'Hàm': [
    { label: 'sin', latex: '\\sin\\left(#?\\right)' },
    { label: 'cos', latex: '\\cos\\left(#?\\right)' },
    { label: 'tan', latex: '\\tan\\left(#?\\right)' },
    { label: 'log', latex: '\\log\\left(#?\\right)' },
    { label: '⌫', name: 'Xóa ký tự', command: 'deleteBackward' },
    { label: 'ln', latex: '\\ln\\left(#?\\right)' },
    { label: '10ˣ', latex: '10^{#?}' }, { label: 'eˣ', latex: 'e^{#?}' },
    { label: '∛□', name: 'Căn bậc ba', latex: '\\sqrt[3]{#?}' },
    { label: 'xₙ', name: 'Chỉ số dưới', command: 'moveToSubscript' },
  ],
  'Ký hiệu': [
    { label: '≤', latex: '\\le' }, { label: '≥', latex: '\\ge' },
    { label: '≠', latex: '\\ne' }, { label: '∞', latex: '\\infty' },
    { label: '⌫', name: 'Xóa ký tự', command: 'deleteBackward' },
    { label: 'α', latex: '\\alpha' }, { label: 'β', latex: '\\beta' },
    { label: 'θ', latex: '\\theta' }, { label: '∈', latex: '\\in' },
    { label: '±', latex: '\\pm' },
  ],
};
const numberKeys: readonly MathKey[] = [
  { label: '7', latex: '7' }, { label: '8', latex: '8' }, { label: '9', latex: '9' },
  { label: '×', latex: '\\times' }, { label: '÷', latex: '\\div' },
  { label: '4', latex: '4' }, { label: '5', latex: '5' }, { label: '6', latex: '6' },
  { label: '+', latex: '+' }, { label: '−', latex: '-' },
  { label: '1', latex: '1' }, { label: '2', latex: '2' }, { label: '3', latex: '3' },
  { label: '=', latex: '=' }, { label: 'x', latex: 'x' },
  { label: '0', latex: '0' }, { label: '.', latex: '.' },
  { label: 'a', latex: 'a' }, { label: 'b', latex: 'b' }, { label: 'y', latex: 'y' },
];
const navigation: readonly MathKey[] = [
  { label: '←', name: 'Sang trái', command: 'moveToPreviousChar' },
  { label: '↑', name: 'Lên', command: 'moveUp' },
  { label: '↓', name: 'Xuống', command: 'moveDown' },
  { label: '→', name: 'Sang phải', command: 'moveToNextChar' },
  { label: 'Ô tiếp', command: 'moveToNextPlaceholder' },
];

export default function MathInputDialog({
  label, initialLatex, initialDisplay, replacing, availableLength, beforeContent, afterContent, onInsert, onClose,
}: MathInputDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<MathfieldElement | null>(null);
  const [latex, setLatex] = useState(initialLatex);
  const [display, setDisplay] = useState(initialDisplay);
  const [group, setGroup] = useState('Cơ bản');
  const formula = latex.trim();
  const source = display ? `$$${formula}$$` : `\\(${formula}\\)`;
  const validation = useMemo(() => {
    if (!formula) return 'Nhập công thức bằng các phím bên dưới hoặc bàn phím máy tính.';
    if (formula.includes('\\placeholder')) return 'Điền đủ các ô trống trước khi chèn.';
    if (source.length > availableLength) return `Nội dung chỉ còn chỗ cho ${availableLength} ký tự. Hãy rút gọn công thức.`;
    try {
      katex.renderToString(formula, { throwOnError: true, trust: false, maxSize: 20, maxExpand: 1000 });
      return '';
    } catch {
      return 'Công thức chưa hợp lệ hoặc có ký hiệu chưa được hỗ trợ. Hãy kiểm tra lại.';
    }
  }, [formula, source.length, availableLength]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const mount = mountRef.current;
    if (!dialog || !mount) return;

    MathfieldElement.soundsDirectory = null;
    // Fonts are bundled by Vite through mathlive/fonts.css, with no CDN request.
    const field = new MathfieldElement();
    field.mathVirtualKeyboardPolicy = 'manual';
    field.smartMode = false;
    field.placeholder = '\\text{Nhập công thức}';
    field.setAttribute('aria-label', 'Công thức toán');
    const handleInput = () => setLatex(field.value);
    field.addEventListener('input', handleInput);
    fieldRef.current = field;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    mount.append(field);
    field.value = initialLatex;
    field.focus();

    return () => {
      field.removeEventListener('input', handleInput);
      field.remove();
      fieldRef.current = null;
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [initialLatex]);

  function pressKey(key: MathKey): void {
    const field = fieldRef.current;
    if (!field) return;
    field.focus();
    if (key.name === 'Bình phương') {
      field.executeCommand('moveToSuperscript');
      field.insert('2');
      field.executeCommand('moveAfterParent');
    } else if (key.command) {
      field.executeCommand(key.command);
    } else if (key.latex) {
      field.insert(key.latex, { selectionMode: key.latex.includes('#?') ? 'placeholder' : 'after' });
    }
    setLatex(field.value);
  }

  function keyButton(key: MathKey) {
    return (
      <button
        key={key.name ?? key.label}
        type="button"
        aria-label={key.name ?? key.label}
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => pressKey(key)}
        className="math-input-key"
      >
        {key.label}
      </button>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="math-input-dialog"
      aria-labelledby="math-dialog-title"
      aria-describedby="math-dialog-help"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      onKeyDownCapture={(event) => {
        // MathLive consumes Escape itself, so handle dismissal before it does.
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
          return;
        }
        // Enter inside the mathfield must never submit the surrounding study set.
        if (event.key === 'Enter' && event.target instanceof HTMLElement && event.target.closest('math-field')) event.preventDefault();
      }}
    >
      <div className="math-input-header">
        <div>
          <p className="text-xs uppercase tracking-wide text-teal-700">{label}</p>
          <h2 id="math-dialog-title" className="text-xl font-semibold">Chèn công thức</h2>
        </div>
        <button type="button" onClick={onClose} className="min-h-11 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Hủy</button>
      </div>
      <div className="math-input-body">
        <p id="math-dialog-help" className="mb-3 text-sm text-slate-500">
          {replacing ? 'Công thức sẽ thay phần đang chọn trong nội dung.' : 'Công thức sẽ được chèn tại vị trí con trỏ trong nội dung.'}
        </p>
        <div ref={mountRef} className="math-input-field" />
        <div className="math-input-keys mt-2" aria-label="Di chuyển con trỏ">{navigation.map(keyButton)}</div>
        <div className="my-3 flex gap-2" role="group" aria-label="Nhóm phím toán">
          {Object.keys(groups).map((name) => (
            <button key={name} type="button" aria-pressed={group === name} onClick={() => setGroup(name)} className={`flex-1 rounded-lg border px-2 py-2 text-sm font-medium ${group === name ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>{name}</button>
          ))}
        </div>
        <div className="math-input-keys" aria-label="Phím toán học">{[...groups[group], ...numberKeys].map(keyButton)}</div>
        <div className="my-3 flex flex-wrap items-center gap-2">
          {keyButton({ label: 'Hoàn tác', command: 'undo' })}
          {keyButton({ label: 'Làm lại', command: 'redo' })}
          {keyButton({ label: 'Xóa công thức', command: 'deleteAll' })}
        </div>
        <div className="flex gap-4 text-sm" role="group" aria-label="Cách hiển thị công thức">
          <label className="flex items-center gap-2"><input type="radio" name="math-display" checked={!display} onChange={() => setDisplay(false)} />Trong dòng</label>
          <label className="flex items-center gap-2"><input type="radio" name="math-display" checked={display} onChange={() => setDisplay(true)} />Riêng dòng</label>
        </div>
        {formula && !validation ? <div className="mt-3 rounded-lg bg-teal-50 p-3"><p className="text-xs text-teal-700">Nội dung sau khi chèn</p><MathContent content={beforeContent + source + afterContent} className="mt-1 max-h-24 overflow-y-auto text-sm" /></div> : null}
        <p className="mt-3 text-sm text-slate-500" aria-live="polite">{validation || 'Sẵn sàng chèn vào nội dung.'}</p>
      </div>
      <div className="math-input-footer">
        <span className="text-xs text-slate-500">{source.length}/{availableLength} ký tự</span>
        <button type="button" disabled={Boolean(validation)} onClick={() => onInsert(source)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40">
          {replacing ? 'Thay phần đang chọn' : 'Chèn vào nội dung'}
        </button>
      </div>
    </dialog>
  );
}
