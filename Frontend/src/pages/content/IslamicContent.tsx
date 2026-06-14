import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { Moon, Book, Heart } from 'lucide-react';

type ContentItem = {
  id: string;
  title: string;
  content: string;
  category: 'SUPPLICATION' | 'SEERAH' | 'COMPANION';
  subcategory?: string;
};

const categoryConfig = {
  SUPPLICATION: { label: 'الأدعية المأثورة', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
  SEERAH: { label: 'السيرة النبوية', icon: Moon, color: 'text-blue-600', bg: 'bg-blue-50' },
  COMPANION: { label: 'قصص الصحابة', icon: Book, color: 'text-amber-600', bg: 'bg-amber-50' },
};

export const IslamicContent = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['content'],
    queryFn: () => apiCall<{ items: ContentItem[] }>('/content/islamic'),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-black text-slate-950 mb-4">المحتوى الإسلامي</h1>
        <p className="text-lg text-slate-600">زاد الطالب من السيرة والأدعية وقصص الصحابة الكرام</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const config = categoryConfig[item.category];
            const Icon = config.icon;

            return (
              <div key={item.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl hover:-translate-y-1">
                <div className={`p-6 ${config.bg} border-b border-slate-100/50`}>
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ${config.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 line-clamp-2">{item.title}</h3>
                  <p className={`mt-2 text-xs font-bold ${config.color}`}>{config.label} {item.subcategory && `• ${item.subcategory}`}</p>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                    {item.content}
                  </p>
                  <button className="mt-4 text-sm font-bold text-emerald-600 hover:text-emerald-700">
                    اقرأ المزيد &larr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
