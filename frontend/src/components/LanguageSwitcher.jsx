import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition">
      <Languages className="h-4 w-4" />
      <select 
        value={i18n.language?.substring(0, 2) || 'en'} 
        onChange={handleLanguageChange}
        className="bg-transparent outline-none cursor-pointer text-sm font-semibold text-gray-700 uppercase"
      >
        <option value="en">EN</option>
        <option value="hi">HI</option>
        <option value="te">TE</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
