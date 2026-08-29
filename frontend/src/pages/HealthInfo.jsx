import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { HeartPulse, Loader2, AlertCircle, ShieldAlert, ChevronRight } from 'lucide-react';

const HealthInfo = () => {
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, artRes] = await Promise.all([
          api.get('/health-information/categories'),
          api.get('/health-information/'),
        ]);
        setCategories(catRes.data);
        setArticles(artRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filtered = selectedCategory ? articles.filter(a => a.category === selectedCategory) : articles;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-green-600 animate-spin" /></div>;

  // Article detail view
  if (selectedArticle) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => setSelectedArticle(null)} className="text-green-600 font-medium mb-4 hover:underline">← Back to articles</button>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedArticle.title}</h1>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-50 text-green-700 mb-4 inline-block">{selectedArticle.category}</span>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-6 mt-4">
          <div><h3 className="font-bold text-gray-800 mb-2">Overview</h3><p className="text-gray-600 leading-relaxed">{selectedArticle.description}</p></div>
          {selectedArticle.symptoms && <div><h3 className="font-bold text-gray-800 mb-2">Symptoms</h3><p className="text-gray-600 leading-relaxed">{selectedArticle.symptoms}</p></div>}
          {selectedArticle.general_precautions && <div><h3 className="font-bold text-gray-800 mb-2">General Precautions</h3><p className="text-gray-600 leading-relaxed">{selectedArticle.general_precautions}</p></div>}
          {selectedArticle.when_to_seek_care && <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100"><h3 className="font-bold text-yellow-800 mb-2">When to Seek Care</h3><p className="text-yellow-700">{selectedArticle.when_to_seek_care}</p></div>}
          {selectedArticle.emergency_warning_signs && <div className="bg-red-50 p-4 rounded-xl border border-red-100"><h3 className="font-bold text-red-800 mb-2">⚠️ Emergency Warning Signs</h3><p className="text-red-700">{selectedArticle.emergency_warning_signs}</p></div>}
        </div>
        <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100"><p className="text-blue-700 text-sm"><ShieldAlert className="inline h-4 w-4 mr-1" /> This is general information only. It does not replace professional medical advice.</p></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Health Information</h1>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 rounded-lg font-medium text-sm transition ${!selectedCategory ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg font-medium text-sm transition ${selectedCategory === cat ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center"><HeartPulse className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No health information available</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => (
            <button key={article.id} onClick={() => setSelectedArticle(article)} className="w-full bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md transition text-left flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{article.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.description}</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 mt-2 inline-block">{article.category}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export default HealthInfo;
