'use client';

import { useState } from 'react';

type JournalInfo = {
  name: string;
  impactFactor: number;
  category: string;
  ranking: string;
  description: string;
};

const TOP_JOURNALS: Record<string, JournalInfo> = {
  // Science Journals
  'Nature': { name: 'Nature', impactFactor: 69.5, category: 'Multidisciplinary', ranking: '#1 전체', description: '세계 최고 권위의 과학 저널' },
  'Science': { name: 'Science', impactFactor: 63.8, category: 'Multidisciplinary', ranking: '#2 전체', description: '미국 과학진흥회 발행 저널' },
  'Cell': { name: 'Cell', impactFactor: 66.9, category: 'Cell Biology', ranking: '#1 생명과학', description: '세포생물학 최고 저널' },
  'New England Journal of Medicine': { name: 'NEJM', impactFactor: 158.5, category: 'Medicine', ranking: '#1 의학', description: '의학 분야 최고 권위 저널' },
  'The Lancet': { name: 'The Lancet', impactFactor: 202.7, category: 'Medicine', ranking: '#1 의학', description: '영국 의학 저널의 권위' },
  'PNAS': { name: 'PNAS', impactFactor: 12.8, category: 'Multidisciplinary', ranking: 'Top 5', description: '미국 과학아카데미 회보' },
  
  // Business Journals (UTD 24)
  'Academy of Management Journal': { name: 'AMJ', impactFactor: 9.1, category: 'Management', ranking: 'UTD 24', description: '경영학 최고 저널' },
  'Academy of Management Review': { name: 'AMR', impactFactor: 17.8, category: 'Management Theory', ranking: 'UTD 24', description: '경영 이론 최고 저널' },
  'Administrative Science Quarterly': { name: 'ASQ', impactFactor: 8.3, category: 'Organization', ranking: 'UTD 24', description: '조직론 최고 저널' },
  'American Economic Review': { name: 'AER', impactFactor: 10.7, category: 'Economics', ranking: 'UTD 24', description: '경제학 최고 저널' },
  'Strategic Management Journal': { name: 'SMJ', impactFactor: 7.2, category: 'Strategy', ranking: 'UTD 24', description: '전략경영 최고 저널' },
  'Management Science': { name: 'MS', impactFactor: 5.4, category: 'Management Analytics', ranking: 'UTD 24', description: '경영과학 최고 저널' },
  'Journal of Marketing': { name: 'JM', impactFactor: 11.9, category: 'Marketing', ranking: 'UTD 24', description: '마케팅 최고 저널' },
  'Journal of Finance': { name: 'JF', impactFactor: 8.9, category: 'Finance', ranking: 'UTD 24', description: '금융학 최고 저널' },
  'Organization Science': { name: 'OS', impactFactor: 4.9, category: 'Organization', ranking: 'UTD 24', description: '조직과학 최고 저널' },
  'MIS Quarterly': { name: 'MISQ', impactFactor: 7.3, category: 'Information Systems', ranking: 'UTD 24', description: 'IS 최고 저널' },
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function JournalRankingInfo({ isOpen, onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = ['all', 'science', 'business', 'utd24'];
  const categoryLabels = {
    all: '전체',
    science: '과학 분야',
    business: '경영학 분야', 
    utd24: 'UTD 24'
  };

  const filteredJournals = Object.values(TOP_JOURNALS).filter(journal => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'science') return ['Multidisciplinary', 'Cell Biology', 'Medicine'].includes(journal.category);
    if (selectedCategory === 'business') return ['Management', 'Management Theory', 'Organization', 'Economics', 'Strategy', 'Management Analytics', 'Marketing', 'Finance', 'Information Systems'].includes(journal.category);
    if (selectedCategory === 'utd24') return journal.ranking === 'UTD 24';
    return true;
  });

  const getImpactFactorColor = (if_score: number) => {
    if (if_score >= 50) return 'text-red-500 bg-red-50';
    if (if_score >= 20) return 'text-orange-500 bg-orange-50';
    if (if_score >= 10) return 'text-yellow-600 bg-yellow-50';
    if (if_score >= 5) return 'text-green-600 bg-green-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">📚 탑저널 랭킹 & 임팩트 팩터</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {categoryLabels[cat as keyof typeof categoryLabels]}
              </button>
            ))}
          </div>
        </div>

        {/* 저널 리스트 */}
        <div className="space-y-4">
          {filteredJournals
            .sort((a, b) => b.impactFactor - a.impactFactor)
            .map((journal, index) => (
            <div key={journal.name} className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-lg">{journal.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactFactorColor(journal.impactFactor)}`}>
                      IF {journal.impactFactor}
                    </span>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {journal.ranking}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">{journal.description}</p>
                  <p className="text-xs text-muted-foreground">분야: {journal.category}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">#{index + 1}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 임팩트 팩터 설명 */}
        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <h3 className="font-semibold mb-2">📊 임팩트 팩터 (Impact Factor) 가이드</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium">IF ≥ 50: 초일류 저널</span>
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="font-medium">IF 20-49: 최상위 저널</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">IF 10-19: 상위 저널</span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">IF 5-9: 우수 저널</span>
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">IF 3-4: 양호 저널</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                * 임팩트 팩터는 최근 2년간 평균 인용 횟수를 나타냅니다
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
