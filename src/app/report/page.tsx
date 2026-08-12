'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReportMapWrapper from '@/components/ReportMapWrapper';
import { useLanguage } from '@/context/LanguageContext';

type AlertCategory = 'waterlogging' | 'road_closure' | 'pothole' | 'power_outage' | 'other';

interface LocalityPreset {
  name: string;
  lat: number;
  lng: number;
}

interface DistrictPreset {
  name: string;
  localities: LocalityPreset[];
}

const DISTRICT_PRESETS: Record<string, DistrictPreset> = {
  guwahati: {
    name: 'Kamrup Metropolitan (Guwahati)',
    localities: [
      { name: 'Dispur (Capital Complex)', lat: 26.13620, lng: 91.79080 },
      { name: 'Paltan Bazaar (Station Area)', lat: 26.17550, lng: 91.74380 },
      { name: 'Khanapara (Border Area)', lat: 26.11890, lng: 91.82110 },
      { name: 'Jalukbari (University Sector)', lat: 26.14320, lng: 91.66780 },
      { name: 'Hatigaon Locality', lat: 26.13110, lng: 91.79990 }
    ]
  },
  dibrugarh: {
    name: 'Dibrugarh District',
    localities: [
      { name: 'Dibrugarh University Area', lat: 27.45800, lng: 94.89800 },
      { name: 'Chowkidingee Junction', lat: 27.48120, lng: 94.90800 },
      { name: 'Graham Bazaar Sector', lat: 27.48900, lng: 94.89950 },
      { name: 'Banipur Locality', lat: 27.44750, lng: 94.92120 }
    ]
  },
  jorhat: {
    name: 'Jorhat District',
    localities: [
      { name: 'Barua Chariali (Town Center)', lat: 26.75620, lng: 94.20980 },
      { name: 'Lichubari Camp Sector', lat: 26.73210, lng: 94.22320 },
      { name: 'Tarajan Locality', lat: 26.76110, lng: 94.19780 },
      { name: 'Garmur Village Plain', lat: 26.77250, lng: 94.23890 }
    ]
  },
  silchar: {
    name: 'Cachar District (Silchar)',
    localities: [
      { name: 'Tarapur (Railway Belt)', lat: 24.84120, lng: 92.77120 },
      { name: 'Rangirkhari Junction', lat: 24.81120, lng: 92.79150 },
      { name: 'College Road Relief Hub', lat: 24.81800, lng: 92.77800 }
    ]
  },
  tezpur: {
    name: 'Sonitpur District (Tezpur)',
    localities: [
      { name: 'Mission Chariali Hub', lat: 26.65080, lng: 92.78850 },
      { name: 'Cole Park Area', lat: 26.62680, lng: 92.79810 },
      { name: 'Ketekibari Locality', lat: 26.63850, lng: 92.76620 }
    ]
  },
  haflong: {
    name: 'Dima Hasao (Haflong Hills)',
    localities: [
      { name: 'Haflong Town Center', lat: 25.18330, lng: 93.01670 },
      { name: 'Jatinga (Landslide Zone)', lat: 25.14820, lng: 93.03150 },
      { name: 'Lower Haflong Valley', lat: 25.17020, lng: 93.01890 }
    ]
  }
};

export default function ReportPage() {
  const { language, t } = useLanguage();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<AlertCategory>('waterlogging');
  const [description, setDescription] = useState('');
  
  // Coordinates State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  // Cascading Dropdowns State
  const [districtKey, setDistrictKey] = useState<string>('custom');
  const [localityIndex, setLocalityIndex] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTranslatedDistrictName = (key: string) => {
    if (language === 'en') return DISTRICT_PRESETS[key]?.name || key;
    const names: Record<string, string> = {
      guwahati: 'কামৰূপ মহানগৰ (গুৱাহাটী)',
      dibrugarh: 'ডিব্ৰুগড় জিলা',
      jorhat: 'যোৰহাট জিলা',
      silchar: 'কাছাৰ জিলা (ছিলচৰ)',
      tezpur: 'শোণিতপুৰ জিলা (তেজপুৰ)',
      haflong: 'ডিমা হাচাও (হাফলং)'
    };
    return names[key] || key;
  };

  const getTranslatedLocalityName = (locName: string) => {
    if (language === 'en') return locName;
    const m: Record<string, string> = {
      'Dispur (Capital Complex)': 'দিছপুৰ (ৰাজধানী অঞ্চল)',
      'Paltan Bazaar (Station Area)': 'পল্টনবজাৰ (ষ্টেচন এলেকা)',
      'Khanapara (Border Area)': 'খানাপাৰা (সীমাঞ্চল)',
      'Jalukbari (University Sector)': 'জালukবাৰী (বিশ্ববিদ্যালয় অঞ্চল)',
      'Hatigaon Locality': 'হাটীগাঁও অঞ্চল',
      'Dibrugarh University Area': 'ডিব্ৰুগড় বিশ্ববিদ্যালয় এলেকা',
      'Chowkidingee Junction': 'চকীডিঙী চাৰিআলি',
      'Graham Bazaar Sector': 'গ্ৰাহাম বজাৰ খণ্ড',
      'Banipur Locality': 'বাণীপুৰ অঞ্চল',
      'Barua Chariali (Town Center)': 'বৰুৱা চাৰিআলি (চহৰৰ কেন্দ্ৰবিন্দু)',
      'Lichubari Camp Sector': 'লিচুবাৰী আশ্ৰয় এলেকা',
      'Tarajan Locality': 'তাৰাজান অঞ্চল',
      'Garmur Village Plain': 'গৰমূৰ গাঁও সমভূমি',
      'Tarapur (Railway Belt)': 'তাৰাপুৰ (ৰেলৱে বেল্ট)',
      'Rangirkhari Junction': 'ৰংগীৰখাৰী চাৰিআলি',
      'College Road Relief Hub': 'কলেজ ৰোড আশ্ৰয় কেন্দ্ৰ',
      'Mission Chariali Hub': 'মিছন চাৰিআলি কেন্দ্ৰ',
      'Cole Park Area': 'ক’ল পাৰ্ক এলেকা',
      'Ketekibari Locality': 'কেটেকীবাৰী অঞ্চল',
      'Haflong Town Center': 'হাফলং চহৰ কেন্দ্ৰ',
      'Jatinga (Landslide Zone)': 'জাতিংগা (ভূমিস্খলন প্ৰৱণ এলেকা)',
      'Lower Haflong Valley': 'লোৱাৰ হাফলং উপত্যকা'
    };
    return m[locName] || locName;
  };

  const handleDistrictChange = (val: string) => {
    setDistrictKey(val);
    if (val === 'custom') {
      setLatitude(null);
      setLongitude(null);
      setLocalityIndex('');
    } else {
      const preset = DISTRICT_PRESETS[val];
      if (preset && preset.localities.length > 0) {
        setLocalityIndex('0');
        setLatitude(preset.localities[0].lat);
        setLongitude(preset.localities[0].lng);
      }
    }
  };

  const handleLocalityChange = (indexStr: string) => {
    setLocalityIndex(indexStr);
    const index = parseInt(indexStr);
    const preset = DISTRICT_PRESETS[districtKey];
    if (preset && preset.localities[index]) {
      const loc = preset.localities[index];
      setLatitude(loc.lat);
      setLongitude(loc.lng);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setDistrictKey('custom'); // revert dropdowns to custom map pin if user clicks on the map manually
    setLocalityIndex('');
  };

  // Verify if coordinates fit inside administrative boundaries of Assam, India
  const isInsideAssam = (lat: number, lng: number): boolean => {
    return lat >= 24.0 && lat <= 28.5 && lng >= 89.5 && lng <= 96.5;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (description.trim().length < 8) {
        setError(language === 'en' ? 'Please write a descriptive summary of at least 8 characters.' : 'অনুগ্ৰহ কৰি নূন্যতম ৮ টা আখৰৰ বিৱৰণ এটা লিখক।');
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (latitude === null || longitude === null) {
        setError(language === 'en' ? 'Please select a locality dropdown or click on the map to place a pin.' : 'অনুগ্ৰহ কৰি ড্ৰপডাউন বাছক বা মানচিত্ৰত ক্লিক কৰি স্থান টো বাছনি কৰক।');
        return;
      }
      
      // Strict False Alert Prevention: Geographical bounding checks
      if (!isInsideAssam(latitude, longitude)) {
        setError(
          language === 'en' 
            ? 'Geographic Bounds Error: Coords must fall inside Assam (24.0°N to 28.5°N, 89.5°E to 96.5°E).' 
            : 'ভৌগোলিক সীমাৰ ত্ৰুটি: স্থানাংকসমূহ অসমৰ ভিতৰত হব লাগিব (২৪.০° উত্তৰৰ পৰা ২৮.৫° উত্তৰ, ৮৯.৫° পূবৰ পৰা ৯৬.৫° পূব)।'
        );
        return;
      }

      setError(null);
      setStep(3);
    }
  };

  const handleBackStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (latitude === null || longitude === null || !description.trim()) {
      setError('Missing required data fields.');
      return;
    }

    // Strict False Alert Prevention: Spam local rate limiting
    const lastReportTime = localStorage.getItem('last_hazard_report_time');
    if (lastReportTime) {
      const differenceMs = Date.now() - Number(lastReportTime);
      const limitMs = 3 * 60 * 1000; // 3 minutes rate limit
      
      if (differenceMs < limitMs) {
        const remainingSec = Math.round((limitMs - differenceMs) / 1000);
        setError(
          language === 'en' 
            ? `Spam protection active. Please wait ${remainingSec} seconds before logging another community alert.`
            : `স্পাম প্ৰতিৰোধ সক্ৰিয় হৈ আছে। অনুগ্ৰহ কৰি আন এটা তথ্য জমা কৰিবলৈ ${remainingSec} চেকেণ্ড অপেক্ষা কৰক।`
        );
        return;
      }
    }

    // Bounding check again
    if (!isInsideAssam(latitude, longitude)) {
      setError('Coordinates out of Assam state boundaries. Alert rejected.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          description: description.trim(),
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report database entry.');
      }

      // Lock submission timestamp locally for spam avoidance
      localStorage.setItem('last_hazard_report_time', String(Date.now()));
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setCategory('waterlogging');
    setDescription('');
    setLatitude(null);
    setLongitude(null);
    setDistrictKey('custom');
    setLocalityIndex('');
    setSuccess(false);
    setError(null);
  };

  const getCategoryLabel = (cat: AlertCategory) => {
    if (language === 'as') {
      if (cat === 'waterlogging') return 'বানপানী / নিষ্কাশন (Waterlogging)';
      if (cat === 'road_closure') return 'পথ বন্ধ / ক্ৰসিং (Road Block)';
      if (cat === 'pothole') return 'পথৰ গাত (Pothole)';
      if (cat === 'power_outage') return 'বিদ্যুৎ ব্যাহত (Power Outage)';
      return 'অন্যান্য বিপদ (Other Hazard)';
    }
    if (cat === 'waterlogging') return 'Waterlogging / Drainage';
    if (cat === 'road_closure') return 'Road Block / Closure';
    if (cat === 'pothole') return 'Pothole Damage';
    if (cat === 'power_outage') return 'Power Grid Outage';
    return 'Other Hazard';
  };

  if (success) {
    return (
      <div className="subpage-container wizard-success-view">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h1>
            {language === 'en' ? 'Incident Logged Successfully!' : 'প্ৰতিবেদন সফলভাৱে জমা কৰা হ’ল!'}
          </h1>
          <p>
            {language === 'en' 
              ? 'Your community alert has been added to the database. First responders and public dashboard consoles will see it immediately.'
              : 'আপোনাৰ সতৰ্কবাণী তথ্যকোষত সংৰক্ষিত কৰা হৈছে। উদ্ধাৰকাৰী দল আৰু মানচিত্ৰত ইয়াক এতিয়াই দেখা যাব।'}
          </p>
          
          <div className="success-summary">
            <h3>{language === 'en' ? 'Logged Details' : 'নথিভুক্ত বিৱৰণ'}</h3>
            <div className="summary-field">
              <span>{language === 'en' ? 'Category:' : 'বিভাগ:'}</span>
              <strong>{getCategoryLabel(category)}</strong>
            </div>
            <div className="summary-field">
              <span>{language === 'en' ? 'Coordinates:' : 'স্থানাংক:'}</span>
              <strong>({latitude?.toFixed(5)}°, {longitude?.toFixed(5)}°)</strong>
            </div>
            <div className="summary-field">
              <span>{language === 'en' ? 'Description:' : 'বিৱৰণ:'}</span>
              <p>{description}</p>
            </div>
          </div>

          <div className="success-actions">
            <button onClick={handleReset} className="btn-secondary">
              {language === 'en' ? 'Report Another Issue' : 'আন এটা বিপদৰ খবৰ দিয়ক'}
            </button>
            <Link href="/" className="btn-primary">
              {language === 'en' ? 'Go to Live Map' : 'লাইভ মানচিত্ৰলৈ যাওক'}
            </Link>
            <Link href="/history" className="btn-secondary">
              {language === 'en' ? 'View Incidents List' : 'घटनाৰ তালিকা চাওক'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subpage-container">
      <div className="subpage-header">
        <h1>{t('report_title')}</h1>
        <p>{t('report_subtitle')}</p>
      </div>

      <div className="wizard-card-wrapper">
        {/* Step Indicator Header */}
        <div className="wizard-indicators">
          <div className={`ind-step ${step >= 1 ? 'active' : ''}`}>{t('step_details')}</div>
          <div className="ind-line"></div>
          <div className={`ind-step ${step >= 2 ? 'active' : ''}`}>{t('step_pin')}</div>
          <div className="ind-line"></div>
          <div className={`ind-step ${step >= 3 ? 'active' : ''}`}>{t('step_confirm')}</div>
        </div>

        {error && <div className="wizard-error-banner">{error}</div>}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="wizard-step-content">
            <div className="form-group">
              <label>{language === 'en' ? '1. Select Hazard Category' : '১. বিপদৰ শ্ৰেণী বাছক'}</label>
              <div className="category-select-grid">
                {(['waterlogging', 'road_closure', 'pothole', 'power_outage', 'other'] as AlertCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`cat-btn-option ${category === cat ? 'selected' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label htmlFor="description">
                {language === 'en' ? '2. Describe the Incident' : '২. ঘটনাৰ সবিশেষ বৰ্ণনা কৰক'}
              </label>
              <textarea
                id="description"
                rows={5}
                placeholder={
                  language === 'en' 
                    ? "Provide details of the hazard (e.g., 'Severe waterlogging under the flyover, water is knee-deep, small cars cannot pass...')"
                    : "বিপদৰ সবিশেষ তথ্য আৰু বৰ্ণনা দিয়ক (যেনে: ফ্লাইঅভাৰৰ তলত আঁঠু পৰ্যন্ত বানপানী হৈছে, সৰু গাড়ী চলিব পৰা নাই)..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <span className="char-counter">
                {description.trim().length}{' '}
                {language === 'as' ? 'আখৰ (নূন্যতম ৮)' : 'chars (minimum 8)'}
              </span>
            </div>

            <div className="wizard-nav-buttons justify-end">
              <button onClick={handleNextStep} className="btn-primary">
                {language === 'en' ? 'Choose Location →' : 'স্থান বাছক →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Cascading Selectors & Interactive Map */}
        {step === 2 && (
          <div className="wizard-step-content">
            <div className="map-step-header" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label>{language === 'en' ? 'Pin the Incident on the Map' : 'মানচিত্ৰত স্থান নিৰ্ধাৰণ কৰক'}</label>
                <p>
                  {language === 'en' 
                    ? 'Choose a District and Locality from the dropdowns below to focus the map. If you are reporting from a village or custom spot, you can still click anywhere on the map to set the exact pin coordinates.'
                    : 'তলৰ ড্ৰপডাউনৰ পৰা জিলা আৰু অঞ্চল বাছনি কৰি মানচিত্ৰখন কেন্দ্ৰীভূত কৰক। যদি আপুনি কোনো গাঁও বা কাষ্টম স্থানৰ পৰা খবৰ দিব বিচাৰে, মানচিত্ৰত ক্লিক কৰিও পিন বহুৱাব পাৰে।'}
                </p>
              </div>
              
              {/* Cascading Dropdown Selector Grid */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {/* 1. District Selection */}
                <div className="form-group" style={{ minWidth: '220px', flex: 1 }}>
                  <label htmlFor="district-select" style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                    {t('select_town')}
                  </label>
                  <select 
                    id="district-select"
                    value={districtKey} 
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '0.5rem',
                      fontSize: '0.8rem',
                      outline: 'none',
                      height: '36px',
                      width: '100%'
                    }}
                  >
                    <option value="custom">
                      {language === 'as' ? '📍 মানচিত্ৰত ক্লিক কৰক' : '📍 Custom Pin (Click Map)'}
                    </option>
                    <option value="guwahati">{getTranslatedDistrictName('guwahati')}</option>
                    <option value="dibrugarh">{getTranslatedDistrictName('dibrugarh')}</option>
                    <option value="jorhat">{getTranslatedDistrictName('jorhat')}</option>
                    <option value="silchar">{getTranslatedDistrictName('silchar')}</option>
                    <option value="tezpur">{getTranslatedDistrictName('tezpur')}</option>
                    <option value="haflong">{getTranslatedDistrictName('haflong')}</option>
                  </select>
                </div>

                {/* 2. Locality Selection (Enabled only if a district is chosen) */}
                {districtKey !== 'custom' && (
                  <div className="form-group" style={{ minWidth: '220px', flex: 1 }}>
                    <label htmlFor="locality-select" style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                      {t('select_locality')}
                    </label>
                    <select 
                      id="locality-select"
                      value={localityIndex} 
                      onChange={(e) => handleLocalityChange(e.target.value)}
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        outline: 'none',
                        height: '36px',
                        width: '100%'
                      }}
                    >
                      {DISTRICT_PRESETS[districtKey]?.localities.map((loc, idx) => (
                        <option key={idx} value={idx}>
                          {getTranslatedLocalityName(loc.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="coordinates-badge" style={{ marginTop: '0.4rem' }}>
                {latitude !== null && longitude !== null ? (
                  <span>
                    {language === 'en' ? 'Selected Coordinates:' : 'বাছনি কৰা স্থানাংক:'}{' '}
                    <strong style={{ color: '#fb923c' }}>{latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E</strong>
                  </span>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>
                    {language === 'en' ? '❌ No coordinates selected. Click on map below.' : '❌ স্থানাংক বাছনি কৰা নাই। মানচিত্ৰত ক্লিক কৰক।'}
                  </span>
                )}
              </div>
            </div>

            <div className="report-map-container-box" style={{ marginTop: '0.5rem' }}>
              <ReportMapWrapper 
                onLocationSelect={handleLocationSelect}
                lat={latitude}
                lng={longitude}
              />
            </div>

            <div className="wizard-nav-buttons">
              <button onClick={handleBackStep} className="btn-secondary">
                &larr; {language === 'en' ? 'Back' : 'পাছলৈ'}
              </button>
              <button onClick={handleNextStep} className="btn-primary">
                {language === 'en' ? 'Review Summary →' : 'পৰ্যালোচনা কৰক →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="wizard-step-content">
            <label>{language === 'en' ? 'Review and Submit Incident' : 'পৰ্যালোচনা আৰু জমাকৰণ'}</label>
            <p>
              {language === 'en' 
                ? 'Please double check the details below before writing to the database.' 
                : 'অনুগ্ৰহ কৰি তথ্যকোষত জমা কৰাৰ আগতে তলৰ তথ্যসমূহ আকৌ এবাৰ পৰীক্ষা কৰক।'}
            </p>

            <div className="review-details-box">
              <div className="review-row">
                <span className="label">{language === 'en' ? 'Category:' : 'বিভাগ:'}</span>
                <span className="value">{getCategoryLabel(category)}</span>
              </div>
              <div className="review-row">
                <span className="label">{language === 'en' ? 'Coordinates:' : 'স্থানাংক:'}</span>
                <span className="value">({latitude?.toFixed(5)}°, {longitude?.toFixed(5)}°)</span>
              </div>
              <div className="review-row flex-col">
                <span className="label">{language === 'en' ? 'Description Details:' : 'বিৱৰণ:'}</span>
                <p className="value description-block">{description}</p>
              </div>
            </div>

            <div className="wizard-nav-buttons">
              <button onClick={handleBackStep} className="btn-secondary" disabled={submitting}>
                &larr; {language === 'en' ? 'Back' : 'পাছলৈ'}
              </button>
              <button 
                onClick={handleSubmit} 
                className="btn-primary" 
                style={{ backgroundColor: '#10b981' }}
                disabled={submitting}
              >
                {submitting 
                  ? (language === 'en' ? 'Logging to Database...' : 'তথ্যকোষত জমা কৰা হৈছে...') 
                  : `✔️ ${language === 'en' ? 'Confirm & Submit' : 'নিশ্চিত কৰি জমা কৰক'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
