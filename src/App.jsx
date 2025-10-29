// src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, Briefcase, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import './App.css';

const BACKEND_URL = 'http://localhost:5000';

const translations = {
  en: {
    title: 'MGNREGA Performance Dashboard',
    subtitle: 'Our Voice, Our Rights',
    selectState: 'Select State',
    selectDistrict: 'Select District',
    personDays: 'Person Days',
    households: 'Households Worked',
    expenditure: 'Total Expenditure',
    performance: 'Monthly Performance',
    loading: 'Loading data...',
    error: 'Unable to load data. Showing cached data.',
    crore: 'Cr',
    lakh: 'L',
    monthlyTrend: 'Monthly Trend',
  },
  hi: {
    title: 'मनरेगा प्रदर्शन डैशबोर्ड',
    subtitle: 'हमारी आवाज़, हमारे अधिकार',
    selectState: 'राज्य चुनें',
    selectDistrict: 'जिला चुनें',
    personDays: 'काम के दिन',
    households: 'घरेलू संख्या',
    expenditure: 'कुल खर्च',
    performance: 'मासिक प्रदर्शन',
    loading: 'डेटा लोड हो रहा है...',
    error: 'डेटा लोड नहीं हो सका। पुराना डेटा दिखाया जा रहा है।',
    crore: 'करोड़',
    lakh: 'लाख',
    monthlyTrend: 'मासिक रुझान',
  }
};

const App = () => {
  const [lang, setLang] = useState('en');
  const [state] = useState('MAHARASHTRA');
  const [district, setDistrict] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [districts, setDistricts] = useState([]);
  const [summary, setSummary] = useState({
    totalPersonDays: 0,
    totalHouseholds: 0,
    totalExpenditure: 0
  });

  const t = translations[lang];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/api/mgnrega/${state}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!json.records?.length) throw new Error('No records');

        const records = json.records.map(r => {
          const persondays = parseFloat(r.persondays_lakh) || 0;
          const households = parseInt(r.households) || 0;
          const expenditure = parseFloat(r.expenditure_cr) || 0;

          return {
            state_name: r.state_name,
            district_name: (r.district_name || '').trim(),
            fin_year: r.fin_year,
            fin_month: r.fin_month || r.month || 'Unknown',
            persondays_lakh: persondays.toFixed(2),
            households: String(households),
            expenditure_cr: String(expenditure),
            raw_data: r.raw_data || {
              Women_Persondays: r.Women_Persondays,
              Total_Households_Worked: r.Total_Households_Worked,
              Total_Exp: r.Total_Exp
            }
          };
        });

        setData(records);
      } catch (err) {
        console.error('API error:', err);
        setError(t.error);
        loadSampleData();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state]);

  useEffect(() => {
    if (data.length === 0) {
      setDistricts([]);
      setDistrict('');
      return;
    }

    const unique = [...new Set(data.map(d => d.district_name).filter(Boolean))];
    setDistricts(unique);
    if (!district && unique.length > 0) setDistrict(unique[0]);
  }, [data]);

  useEffect(() => {
    if (!district || data.length === 0) {
      setSummary({ totalPersonDays: 0, totalHouseholds: 0, totalExpenditure: 0 });
      return;
    }

    const districtRows = data.filter(d => d.district_name === district);
    const latestRecord = districtRows[0];
    if (latestRecord) {
      const totalPersonDays = parseFloat(latestRecord.persondays_lakh) || 0;
      const totalHouseholds = parseInt(latestRecord.households) || 0;
      const totalExpenditure = parseFloat(latestRecord.expenditure_cr) || 0;
      setSummary({ totalPersonDays, totalHouseholds, totalExpenditure });
    } else {
      setSummary({ totalPersonDays: 0, totalHouseholds: 0, totalExpenditure: 0 });
    }
  }, [district, data]);

  const getChartData = () => {
    if (!district) return [];
    return data
      .filter(d => d.district_name === district)
      .map(d => ({
        month: d.fin_month || 'N/A',
        personDays: parseFloat(d.persondays_lakh) || 0,
        households: parseFloat(d.households) || 0,
        expenditure: parseFloat(d.expenditure_cr) || 0,
      }))
      .slice(0, 12);
  };

  const formatNumber = (num) => {
    return num >= 100 ? `${num.toFixed(1)} ${t.crore}` : `${num.toFixed(2)} ${t.lakh}`;
  };

  const loadSampleData = () => {
    const sample = [
      { state_name: 'MAHARASHTRA', district_name: 'PUNE', fin_year: '2024-2025', fin_month: 'Feb', persondays_lakh: '10.84', households: '85237', expenditure_cr: '13263.56' },
      { state_name: 'MAHARASHTRA', district_name: 'PUNE', fin_year: '2024-2025', fin_month: 'Jan', persondays_lakh: '9.50', households: '78000', expenditure_cr: '12000.00' },
    ];
    setData(sample);
  };

  return (
    <div className="container">
      <header className="navbar">
        <div className="brand">
          <img src="/logo.png" alt="MGNREGA logo" className="logo" />
          <div className="brand-text">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>

        <div className="nav-actions">
          <select value={state} onChange={() => {}} className="state-select" aria-label="Select state">
            <option value="MAHARASHTRA">Maharashtra</option>
          </select>
          <button className="lang-btn" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>{lang === 'en' ? 'हिंदी' : 'English'}</button>
        </div>
      </header>

      <div className="selectors">
        <div className="select-group">
          <label>{t.selectState}</label>
          <select value={state} onChange={() => {}}>
            <option value="MAHARASHTRA">Maharashtra</option>
          </select>
        </div>

        <div className="select-group">
          <label>{t.selectDistrict}</label>
          <select value={district} onChange={e => setDistrict(e.target.value)} disabled={districts.length === 0}>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div className="loading-text">{t.loading}</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: '70%' }} /></div>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {!loading && district && (
        <>
          <div className="cards">
            <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <h3><Briefcase size={32} /> {t.personDays}</h3>
              <div className="value">{formatNumber(summary.totalPersonDays)}</div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <h3><Users size={32} /> {t.households}</h3>
              <div className="value">{formatNumber(summary.totalHouseholds)}</div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <h3><DollarSign size={32} /> {t.expenditure}</h3>
              <div className="value">₹{formatNumber(summary.totalExpenditure)}</div>
            </div>
          </div>

          <div className="chart-box">
            <h3><TrendingUp size={24} /> {t.monthlyTrend}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="personDays" stroke="#667eea" strokeWidth={3} name={t.personDays} />
                <Line type="monotone" dataKey="households" stroke="#f5576c" strokeWidth={3} name={t.households} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h3><Calendar size={24} /> {t.performance}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="expenditure" fill="#4facfe" name={t.expenditure} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="made-by">Made by <strong>Aditya Mohite</strong></div>
          <div className="socials">
            <a href="https://github.com/adityamohite0106" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span className="sep">•</span>
            <a href="https://www.linkedin.com/in/aditya-mohite0106/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <span className="sep">•</span>
            <a href="mailto:adityamohite4973@gmail.com">adityamohite4973@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;