import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const { user } = useAuth();

  return (
    <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
          Học bằng Flashcard
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900">
          FlashLearn
        </h1>
        <p className="text-lg text-slate-600 max-w-xl">
          Tạo Study Set, quản lý Flashcard và học bằng chế độ lật thẻ — đơn giản
          như Quizlet, tập trung vào quản lý nội dung.
        </p>
        <div className="flex flex-wrap gap-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-lg bg-teal-600 px-5 py-3 text-white font-medium hover:bg-teal-700"
              >
                Vào Dashboard
              </Link>
              <Link
                to="/explore"
                className="rounded-lg border border-slate-300 px-5 py-3 font-medium hover:bg-white"
              >
                Khám phá bộ thẻ
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-lg bg-teal-600 px-5 py-3 text-white font-medium hover:bg-teal-700"
              >
                Bắt đầu miễn phí
              </Link>
              <Link
                to="/explore"
                className="rounded-lg border border-slate-300 px-5 py-3 font-medium hover:bg-white"
              >
                Xem bộ thẻ công khai
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="relative min-h-72 rounded-2xl bg-gradient-to-br from-teal-700 via-teal-600 to-sky-600 p-8 text-white shadow-xl">
        <div className="absolute inset-6 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-teal-50/80">Mặt trước</p>
            <p className="mt-3 text-2xl font-semibold">What is a Promise?</p>
          </div>
          <p className="text-sm text-teal-50">Nhấn để lật thẻ →</p>
        </div>
      </div>
    </section>
  );
}
