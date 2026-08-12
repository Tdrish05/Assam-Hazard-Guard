'use client';

import { useState, useCallback, useEffect } from 'react';
import MapWrapper from '@/components/MapWrapper';
import { getNearestShelters, NearestShelterResult } from '@/lib/shelters';
import { useLanguage } from '@/context/LanguageContext';

interface HazardWarning {
  id: string;
  type: 'rain' | 'flood' | 'earthquake' | 'fire' | 'landslide' | 'cloud_burst' | 'thunderstorm';
  severity: 'red' | 'orange' | 'yellow';
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  details?: Record<string, any>;
}

interface FloodZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  riskLevel: 'high' | 'moderate' | 'low';
  probability: number;
  precipitationForecast: number;
  description: string;
}

interface CityForecast {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  currentTemp: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  weatherCode: number;
  summary: string;
}

export default function Home() {
  const { t, language } = useLanguage();

  // Layer visibility toggles
  const [showWeather, setShowWeather] = useState(true);
  const [showFloods, setShowFloods] = useState(true);
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showFires, setShowFires] = useState(true);
  const [showHistoricalFloods, setShowHistoricalFloods] = useState(true);

  // Map flying location trigger state
  const [flyToLocation, setFlyToLocation] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  // Tab State: warnings, shelters, analytics
  const [activeTab, setActiveTab] = useState<'warnings' | 'shelters' | 'analytics'>('warnings');

  // Selected warning for routing calculations
  const [selectedWarning, setSelectedWarning] = useState<HazardWarning | null>(null);
  const [nearestShelters, setNearestShelters] = useState<NearestShelterResult[]>([]);

  // State containing loaded dataset from map
  const [warnings, setWarnings] = useState<HazardWarning[]>([]);
  const [floodZones, setFloodZones] = useState<FloodZone[]>([]);
  const [forecasts, setForecasts] = useState<CityForecast[]>([]);

  const [locatingUser, setLocatingUser] = useState(false);

  // Gemini AI Advisory States
  const [advisoryText, setAdvisoryText] = useState<string>('');
  const [advisoryLoading, setAdvisoryLoading] = useState<boolean>(false);

  // Reset advisory when selected warning changes
  useEffect(() => {
    setAdvisoryText('');
  }, [selectedWarning]);

  // Callback to capture dataset from Map once it fetches from /api/warnings
  const handleDataLoaded = useCallback((data: {
    warnings: HazardWarning[];
    floodZones: FloodZone[];
    forecasts: CityForecast[];
    historicalFloods?: any[];
  }) => {
    setWarnings(data.warnings || []);
    setFloodZones(data.floodZones || []);
    setForecasts(data.forecasts || []);

    // Auto-select first high-severity warning on load
    if (data.warnings && data.warnings.length > 0) {
      setSelectedWarning(data.warnings[0]);
    }
  }, []);

  // Compute nearest shelters whenever selectedWarning changes
  useEffect(() => {
    if (selectedWarning) {
      const shelters = getNearestShelters(selectedWarning.latitude, selectedWarning.longitude, 3);
      setNearestShelters(shelters);
    } else {
      setNearestShelters([]);
    }
  }, [selectedWarning]);

  // Filtered active warnings to show in the sidebar feed
  const activeAlerts = warnings.filter(w => {
    if (w.type === 'earthquake' && !showEarthquakes) return false;
    if (w.type === 'fire' && !showFires) return false;
    if (w.type === 'flood' && !showFloods) return false;
    if ((w.type === 'rain' || w.type === 'landslide' || w.type === 'cloud_burst' || w.type === 'thunderstorm') && !showWeather) return false;
    return true;
  });

  // Calculate statistics
  const redAlertCount = activeAlerts.filter(w => w.severity === 'red').length;
  const orangeAlertCount = activeAlerts.filter(w => w.severity === 'orange').length;
  const yellowAlertCount = activeAlerts.filter(w => w.severity === 'yellow').length;

  const getSeverityLabel = (severity: string) => {
    if (severity === 'red') return language === 'en' ? '🔴 CRITICAL' : '🔴 জৰুৰী';
    if (severity === 'orange') return language === 'en' ? '🟠 WARNING' : '🟠 সতৰ্কবাণী';
    return language === 'en' ? '🟡 ADVISORY' : '🟡 পৰামৰ্শ';
  };

  const getHazardIcon = (type: string) => {
    if (type === 'rain') return '🌧️';
    if (type === 'flood') return '🌊';
    if (type === 'earthquake') return '🌋';
    if (type === 'fire') return '🔥';
    if (type === 'landslide') return '⛰️';
    if (type === 'cloud_burst') return '⛈️';
    return '⚡';
  };

  // Live hazard titles translator for Assamese support
  const getTranslatedTitle = (warning: HazardWarning): string => {
    if (language === 'en') return warning.title;
    
    if (warning.type === 'cloud_burst') {
      return `⛈️ মেঘ বিস্ফোৰণৰ সতৰ্কতা: ${warning.locationName}`;
    }
    if (warning.type === 'landslide') {
      return `⛰️ ভূমিস্খলনৰ আশংকা: ${warning.locationName}`;
    }
    if (warning.type === 'thunderstorm') {
      return `⚡ বজ্ৰপাতসহ ধুমুহা: ${warning.locationName}`;
    }
    if (warning.type === 'flood') {
      return `🌊 বানপানীৰ ভয়াৱহতা: ${warning.locationName}`;
    }
    if (warning.type === 'earthquake') {
      const mag = warning.details?.magnitude ? `ম্যাগ্নিটিউড ${warning.details.magnitude}` : '';
      return `🌋 ভূমিকম্পৰ জোকাৰণি (${mag})`;
    }
    if (warning.type === 'fire') {
      return `🔥 বনজুইৰ সতৰ্কতা: ${warning.locationName}`;
    }
    if (warning.type === 'rain') {
      return `🌧️ বৰষুণৰ সতৰ্কবাণী: ${warning.locationName}`;
    }
    return warning.title;
  };

  // Live hazard descriptions translator for Assamese support
  const getTranslatedDescription = (warning: HazardWarning): string => {
    if (language === 'en') return warning.description;

    if (warning.type === 'cloud_burst') {
      const rateMatch = warning.description.match(/at\s+([\d.]+)\s*mm/);
      const rate = rateMatch ? rateMatch[1] : '10';
      return `ভয়াবহ সতৰ্কবাণী: ঘন্টাত ${rate} মি.মি. বেগত অতি ধাৰাষাৰ বৰষুণ (Cloud Burst) হোৱাৰ সম্ভাৱনা আছে। পাহাৰীয়া আৰু নামনি অঞ্চলসমূহত জৰুৰীকালীন ফ্লাছ ফ্লাডৰ তীব্ৰ আশংকা আছে। অনুগ্ৰহ কৰি এতিয়াই সুৰক্ষিত আশ্ৰয় লওক।`;
    }

    if (warning.type === 'landslide') {
      const rainMatch = warning.description.match(/\(([\d.]+)\s*mm\)/);
      const rain = rainMatch ? rainMatch[1] : '';
      const rainStr = rain ? ` (${rain} মি.মি.)` : '';
      return `পাহাৰীয়া ভূখণ্ডৰ মাটিৰ আৰ্দ্ৰতা আশংকাজনকভাৱে বৃদ্ধি পাইছে। ধাৰাষাৰ বৰষুণৰ${rainStr} বাবে পাহাৰৰ মাটি খহি পৰাৰ প্ৰৱল সম্ভাৱনা আছে। পাহাৰীয়া যাত্ৰা আৰু পাহাৰ কটা অঞ্চলসমূহ সম্পূৰ্ণ বৰ্জন কৰক।`;
    }

    if (warning.type === 'thunderstorm') {
      return `বজ্ৰপাত আৰু তীব্ৰ ধুমুহাৰ সংকেত। সক্ৰিয় বিজুলী-ধুমুহা, শিলাবৃষ্টি আৰু ধুমুহা বতাহৰ সম্ভাৱনা আছে। মুকলি পথাৰ, নদী-জলাশয় আৰু বিদ্যুতৰ খুঁটিৰ ওচৰত থকাটো বৰ্জন কৰক।`;
    }

    if (warning.type === 'rain') {
      const hoursMatch = warning.description.match(/for\s+(\d+)\s+hours/);
      const timeMatch = warning.description.match(/around\s+([^.]+)\./);
      const rainMatch = warning.description.match(/Accumulation:\s*([\d.]+)mm/);
      
      const hours = hoursMatch ? hoursMatch[1] : '';
      const time = timeMatch ? timeMatch[1] : '';
      const rain = rainMatch ? rainMatch[1] : '';
      
      return `ধাৰাবাহিক বৰষুণৰ সতৰ্কবাণী: অহা ${hours || 'কেইবা'} ঘণ্টা ধৰি ধাৰাবাহিকভাৱে বৰষুণ হোৱাৰ সম্ভাৱনা আছে (প্ৰায় ${time || 'সন্ধিয়াৰ'} পৰা)। আনুমানিক বৰষুণৰ পৰিমাণ: ${rain || '১০'} মি.মি.।`;
    }

    if (warning.type === 'flood') {
      const probMatch = warning.description.match(/is\s+(\d+)%/);
      const rainMatch = warning.description.match(/of\s+([\d.]+)mm/);
      
      const prob = probMatch ? probMatch[1] : '80';
      const rain = rainMatch ? rainMatch[1] : '';
      
      return `বানপানীৰ সতৰ্কবাণী: পৰৱৰ্তী ২৪ ঘণ্টাত ${rain || 'ধাৰাষাৰ'} বৰষুণৰ ফলত এই অববাহিকাত বানপানী হোৱাৰ সম্ভাৱনা ${prob}%। নামনি অঞ্চলৰ লোকসকলক জৰুৰীকালীন সুৰক্ষা প্ৰস্তুতি চলাবলৈ পৰামৰ্শ দিয়া হৈছে।`;
    }

    if (warning.type === 'fire') {
      return `বনজুইৰ গুৰুতৰ আশংকা। শুকান বতৰ আৰু কম আৰ্দ্ৰতাৰ বাবে বনাঞ্চলৰ ঘাঁহ আৰু শুকান গছত অতি সহজে জুই লাগিব পাৰে। বনাঞ্চল বা উদ্যানৰ কাষৰীয়া এলেকাত সাৱধানতা অৱলম্বন কৰক।`;
    }

    if (warning.type === 'earthquake') {
      const depthMatch = warning.description.match(/depth of\s*([\d.]+)\s*km/);
      const originMatch = warning.description.match(/Origin:\s*([^.]+)/);
      
      const depth = depthMatch ? depthMatch[1] : '১০';
      const origin = originMatch ? originMatch[1] : 'অসম-ম্যানমাৰ সীমান্ত';
      
      return `ভূমিকম্পৰ জোকাৰণি: ভূ-পৃষ্ঠৰ পৰা ${depth} কি.মি. গভীৰতাত ভূমিকম্প সংঘটিত হৈছে। উৎপত্তিস্থল: ${origin}।`;
    }

    if (warning.id.startsWith('db-')) {
      const cleanDesc = warning.description.replace(/\[Calculated Trust Confidence:.*?\]/, '').trim();
      const confidence = warning.details?.confidence ?? '30';
      return `ৰাইজৰ প্ৰতিবেদন: ${cleanDesc} (বিশ্বাসযোগ্যতা সূচক: ${confidence}%)`;
    }

    return warning.description;
  };

  // Helper to translate shelter names
  const getTranslatedShelterName = (name: string) => {
    if (language === 'en') return name;
    const names: Record<string, string> = {
      'Guwahati Sports Complex Relief Hub': 'গুৱাহাটী ক্ৰীড়া প্ৰকল্প সাহায্য কেন্দ্ৰ',
      'Dibrugarh University Relief camp': 'ডিব্ৰুগড় বিশ্ববিদ্যালয় আশ্ৰয় শিবিৰ',
      'Jorhat Town Hall Relief Station': 'যোৰহাট টাউন হ’ল সাহায্য শিবিৰ',
      'Silchar Government Relief Center': 'ছিলচৰ চৰকাৰী সাহায্য কেন্দ্ৰ',
      'Tezpur Government College Camp': 'তেজপুৰ চৰকাৰী মহাবিদ্যালয় শিবিৰ',
      'Haflong District Community Hall': 'হাফলং জিলা সামূহিক প্ৰেক্ষাগৃহ'
    };
    return names[name] || name;
  };

  // Helper to translate addresses
  const getTranslatedLocationName = (locName: string) => {
    if (language === 'en') return locName;
    const locs: Record<string, string> = {
      'Nehru Stadium Road, Guwahati': 'নেহৰু ষ্টেডিয়াম পথ, গুৱাহাটী',
      'University Campus, Dibrugarh': 'বিশ্ববিদ্যালয় চৌহদ, ডিব্ৰুগড়',
      'KB Road, Jorhat': 'কে.বি. ৰোড, যোৰহাট',
      'College Road, Silchar': 'কলেজ ৰোড, ছিলচৰ',
      'Tezpur College Ground, Tezpur': 'তেজপুৰ মহাবিদ্যালয় খেলপথাৰ, তেজপুৰ',
      'Hill View Road, Haflong': 'হিল ভিউ ৰোড, হাফলং'
    };
    return locs[locName] || locName;
  };

  // Recenter map on selected warning card coordinates
  const handleWarningClick = (warning: HazardWarning) => {
    setSelectedWarning(warning);
    let zoomLevel = 10;
    if (warning.type === 'cloud_burst') zoomLevel = 11;
    if (warning.type === 'earthquake') zoomLevel = 9;
    if (warning.type === 'flood') zoomLevel = 10;

    setFlyToLocation({
      lat: warning.latitude,
      lng: warning.longitude,
      zoom: zoomLevel
    });
  };

  // Active current location geotracker routing
  const handleRouteFromMyLocation = () => {
    if (!navigator.geolocation) {
      alert(language === 'en' ? 'Your browser does not support GPS Geolocation.' : 'আপোনাৰ ব্ৰাউজাৰে GPS অৱস্থান ধৰা পেলাব পৰা নাই।');
      return;
    }

    setLocatingUser(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatingUser(false);
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Verify if user coordinates fit inside Northeast India/Assam bounds
        const isInsideAssam = userLat >= 24.0 && userLat <= 28.5 && userLng >= 89.5 && userLng <= 96.5;
        const finalLat = isInsideAssam ? userLat : 26.1445; // Guwahati fallback
        const finalLng = isInsideAssam ? userLng : 91.7362;

        if (!isInsideAssam) {
          alert(
            language === 'en' 
              ? 'GPS positioning: You are currently located outside Assam boundaries. We have simulated your position in Guwahati (26.1445° N, 91.7362° E) for routing evaluation.' 
              : 'GPS অৱস্থান: আপুনি বৰ্তমান অসমৰ সীমাৰ বাহিৰত আছে। পৰীক্ষা কৰিবলৈ আমি গুৱাহাটীত (২৬.১৪৪৫° উত্তৰ, ৯১.৭৩৬২° পূব) আপোনাৰ অৱস্থান অনুকৰণ কৰিছো।'
          );
        }

        const mockLocationIncident: HazardWarning = {
          id: 'user-gps-coordinate-incident',
          type: 'rain',
          severity: 'orange',
          title: language === 'en' ? 'Evacuation Route from My Location' : 'মোৰ স্থানৰ পৰা স্থানান্তৰণ পথ',
          description: language === 'en' 
            ? `Direct routing vector mapped from coordinates (${finalLat.toFixed(4)}° N, ${finalLng.toFixed(4)}° E) to the closest safe relief camp.`
            : `স্থানাংক (${finalLat.toFixed(4)}° উ, ${finalLng.toFixed(4)}° পূ) ৰ পৰা নিকটৱৰ্তী আশ্ৰয় শিবিৰলৈ প্ৰত্যক্ষ পথ নিৰ্ধাৰণ কৰা হৈছে।`,
          locationName: isInsideAssam 
            ? (language === 'en' ? 'My Live Location' : 'মোৰ বৰ্তমান স্থান') 
            : (language === 'en' ? 'Guwahati (Simulated)' : 'গুৱাহাটী (অনুকৰণ কৰা স্থান)'),
          latitude: finalLat,
          longitude: finalLng,
          timestamp: new Date().toISOString()
        };

        setSelectedWarning(mockLocationIncident);
        setFlyToLocation({ lat: finalLat, lng: finalLng, zoom: 10 });
        setActiveTab('shelters'); // immediately switch to safe shelters tab to show distance details
      },
      (error) => {
        setLocatingUser(false);
        alert(`Failed to capture location coordinates: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Triggers the Gemini AI Advisory endpoint
  const generateAdvisory = async () => {
    if (!selectedWarning || nearestShelters.length === 0) return;
    setAdvisoryLoading(true);
    setAdvisoryText('');
    
    try {
      const response = await fetch('/api/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedWarning.type,
          severity: selectedWarning.severity,
          description: selectedWarning.description,
          locationName: selectedWarning.locationName,
          latitude: selectedWarning.latitude,
          longitude: selectedWarning.longitude,
          nearestShelter: {
            name: nearestShelters[0].name,
            distance: nearestShelters[0].distance,
            occupied: nearestShelters[0].occupied,
            capacity: nearestShelters[0].capacity,
            supplies: nearestShelters[0].supplies
          },
          language: language
        })
      });
      const data = await response.json();
      if (data.success) {
        setAdvisoryText(data.text);
      } else {
        alert(language === 'en' ? 'Failed to generate AI advisory.' : 'এআই পৰামৰ্শ প্ৰস্তুত কৰাত ব্যৰ্থ হৈছে।');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error.');
    } finally {
      setAdvisoryLoading(false);
    }
  };

  // Formats the Markdown headers and list items returned by the AI route
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} style={{ fontSize: '0.85rem', color: '#fb923c', marginTop: '0.75rem', marginBottom: '0.35rem', fontWeight: 700 }}>
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('* ')) {
        return (
          <div key={index} style={{ fontSize: '0.75rem', color: '#cbd5e1', paddingLeft: '0.5rem', marginBottom: '0.25rem', lineHeight: '1.45', display: 'flex', gap: '0.35rem' }}>
            <span style={{ color: '#fb923c' }}>•</span>
            <span>{line.replace('* ', '')}</span>
          </div>
        );
      }
      if (line.trim() === '') return null;
      return (
        <p key={index} style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: '0.25rem 0', lineHeight: '1.45' }}>
          {line}
        </p>
      );
    });
  };

  // Analytics helper calculations
  const rainCount = activeAlerts.filter(w => w.type === 'rain' || w.type === 'cloud_burst' || w.type === 'thunderstorm').length;
  const floodCount = activeAlerts.filter(w => w.type === 'flood').length;
  const quakeCount = activeAlerts.filter(w => w.type === 'earthquake').length;
  const fireCount = activeAlerts.filter(w => w.type === 'fire').length;
  const slideCount = activeAlerts.filter(w => w.type === 'landslide').length;

  const categoryAnalytics = [
    { label: language === 'en' ? 'Meteorological (Rain/Storms)' : 'বতৰ বিজ্ঞান (বৰষুণ/ধুমুহা)', count: rainCount, color: '#3b82f6' },
    { label: language === 'en' ? 'Hydrological (Floods)' : 'জল বিজ্ঞান (বানপানী)', count: floodCount, color: '#10b981' },
    { label: language === 'en' ? 'Seismological (USGS)' : 'ভূমিকম্প বিজ্ঞান (Seismic)', count: quakeCount, color: '#ef4444' },
    { label: language === 'en' ? 'Forest Fire Danger' : 'বনজুইৰ আশংকা', count: fireCount, color: '#fb923c' },
    { label: language === 'en' ? 'Landslide Saturation' : 'ভূমিস্খলনৰ আশংকা', count: slideCount, color: '#facc15' },
  ];

  const maxAnalyticVal = Math.max(...categoryAnalytics.map(c => c.count), 1);
  const totalWarningsCount = activeAlerts.length;

  return (
    <div className="app-container">
      {/* Sidebar Dashboard */}
      <aside className="sidebar">
        <div className="brand">
          <h1>{t('sidebar_title')}</h1>
          <p>{t('sidebar_subtitle')}</p>
        </div>

        {/* Dynamic Route From My Location Button */}
        <button
          onClick={handleRouteFromMyLocation}
          disabled={locatingUser}
          className="btn-primary"
          style={{
            width: '100%',
            marginBottom: '1rem',
            padding: '0.65rem',
            fontSize: '0.8rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
            border: 'none',
            justifyContent: 'center',
            gap: '0.45rem',
            cursor: 'pointer'
          }}
        >
          {locatingUser ? t('gps_fetching') : t('btn_gps_route')}
        </button>

        {/* Global Navigation Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'warnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('warnings')}
          >
            {t('tab_alerts')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'shelters' ? 'active' : ''}`}
            onClick={() => setActiveTab('shelters')}
          >
            {t('tab_shelters')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            {t('tab_trends')}
          </button>
        </div>

        {/* Tab 1: Warnings Ticker inside Scroll Wrapper */}
        {activeTab === 'warnings' && (
          <div className="sidebar-scroll-wrapper">
            <div className="analytics-section">
              <h3>{language === 'en' ? 'Emergency Status' : 'জৰুৰীকালীন অৱস্থা'}</h3>
              <div className="stats-grid">
                <div className={`stat-card red-hazard ${redAlertCount > 0 ? 'critical-active' : ''}`}>
                  <span className="count">{redAlertCount}</span>
                  <span className="label">{t('stat_critical')}</span>
                </div>
                <div className="stat-card orange-hazard">
                  <span className="count">{orangeAlertCount}</span>
                  <span className="label">{t('stat_warnings')}</span>
                </div>
                <div className="stat-card yellow-hazard">
                  <span className="count">{yellowAlertCount}</span>
                  <span className="label">{t('stat_advisories')}</span>
                </div>
                <div className="stat-card total-warnings">
                  <span className="count">{activeAlerts.length}</span>
                  <span className="label">{t('stat_active')}</span>
                </div>
              </div>
            </div>

            <div className="layers-control-section">
              <h3>{t('map_layers')}</h3>
              <div className="control-switches">
                <label className="switch-item">
                  <input 
                    type="checkbox" 
                    checked={showWeather} 
                    onChange={(e) => setShowWeather(e.target.checked)} 
                  />
                  <span className="custom-checkbox"></span>
                  <span className="switch-label">{t('layer_rain')}</span>
                </label>
                <label className="switch-item">
                  <input 
                    type="checkbox" 
                    checked={showFloods} 
                    onChange={(e) => setShowFloods(e.target.checked)} 
                  />
                  <span className="custom-checkbox"></span>
                  <span className="switch-label">{t('layer_flood')}</span>
                </label>
                <label className="switch-item">
                  <input 
                    type="checkbox" 
                    checked={showEarthquakes} 
                    onChange={(e) => setShowEarthquakes(e.target.checked)} 
                  />
                  <span className="custom-checkbox"></span>
                  <span className="switch-label">{t('layer_quake')}</span>
                </label>
                <label className="switch-item">
                  <input 
                    type="checkbox" 
                    checked={showFires} 
                    onChange={(e) => setShowFires(e.target.checked)} 
                  />
                  <span className="custom-checkbox"></span>
                  <span className="switch-label">{t('layer_fire')}</span>
                </label>
                <label className="switch-item">
                  <input 
                    type="checkbox" 
                    checked={showHistoricalFloods} 
                    onChange={(e) => setShowHistoricalFloods(e.target.checked)} 
                  />
                  <span className="custom-checkbox" style={{ borderColor: '#a855f7' }}></span>
                  <span className="switch-label">{language === 'en' ? 'Previous Flood Affected Areas' : 'অতীতৰ বানপীড়িত অঞ্চলসমূহ'}</span>
                </label>
              </div>
            </div>

            <div className="warnings-feed-section" style={{ flex: 'none', overflow: 'visible' }}>
              <h3>{language === 'en' ? 'Broadcast Warning Feed' : 'সতৰ্কবাণী সম্প্ৰচাৰ লানি'}</h3>
              <p style={{ fontSize: '0.725rem', color: '#64748b', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                {t('feed_instruction')}
              </p>
              <div className="warning-cards-container" style={{ overflowY: 'visible', flex: 'none' }}>
                {activeAlerts.length === 0 ? (
                  <div className="no-warnings-card">
                    <span>🛡️</span>
                    <p>{language === 'en' ? 'No active warnings.' : 'কোনো সক্ৰিয় সতৰ্কবাণী নাই।'}</p>
                  </div>
                ) : (
                  activeAlerts.map((warning) => (
                    <div 
                      key={warning.id} 
                      className={`warning-feed-card severity-${warning.severity} ${selectedWarning?.id === warning.id ? 'active-selection' : ''}`}
                      onClick={() => handleWarningClick(warning)}
                    >
                      <div className="card-header">
                        <span className="hazard-icon">{getHazardIcon(warning.type)}</span>
                        <span className="severity-badge">{getSeverityLabel(warning.severity)}</span>
                      </div>
                      <h4>{getTranslatedTitle(warning)}</h4>
                      <p>{getTranslatedDescription(warning)}</p>
                      <div className="card-footer">
                        <span>📍 {warning.locationName}</span>
                        <span>🕒 {new Date(warning.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Safe Evacuation Shelters Finder inside Scroll Wrapper */}
        {activeTab === 'shelters' && (
          <div className="sidebar-scroll-wrapper">
            <div className="shelter-router-section">
              <h3>{t('evac_router_title')}</h3>
              {selectedWarning ? (
                <div className="router-context-badge">
                  <span className="badge-bullet">📍</span>
                  <div>
                    <span className="label">{t('evac_routing_for')}</span>
                    <div className="warning-title">{getTranslatedTitle(selectedWarning)}</div>
                    <span className="warning-coord">({selectedWarning.latitude.toFixed(4)}°, {selectedWarning.longitude.toFixed(4)}°)</span>
                  </div>
                </div>
              ) : (
                <div className="router-context-badge fallback-badge">
                  <p>{language === 'en' ? 'No active incident selected.' : 'কোনো ঘটনা বাছনি কৰা হোৱা নাই।'}</p>
                </div>
              )}

              {/* Gemini AI Safety Advisor Section */}
              {selectedWarning && nearestShelters.length > 0 && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.04)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginTop: '0.75rem',
                  marginBottom: '1rem',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      🤖 {language === 'en' ? 'Gemini AI Safety Advisor' : 'জেমিনি এআই সুৰক্ষা পৰামৰ্শ'}
                    </span>
                    {advisoryText && (
                      <button
                        onClick={generateAdvisory}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        🔄 {language === 'en' ? 'Regenerate' : 'পুনৰ প্ৰস্তুত কৰক'}
                      </button>
                    )}
                  </div>

                  {!advisoryText && !advisoryLoading && (
                    <button
                      onClick={generateAdvisory}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        fontSize: '0.75rem',
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        cursor: 'pointer',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}
                    >
                      ✨ {language === 'en' ? 'Generate AI Emergency Advisory' : 'এআই সুৰক্ষা নিৰ্দেশনা প্ৰস্তুত কৰক'}
                    </button>
                  )}

                  {advisoryLoading && (
                    <div style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        border: '2px solid rgba(96, 165, 250, 0.1)',
                        borderTop: '2px solid #60a5fa',
                        borderRadius: '50%',
                        width: '14px',
                        height: '14px',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                        {language === 'en' ? 'Generating specialized safety advisory...' : 'বিশেষ সুৰক্ষা পৰামৰ্শ প্ৰস্তুত কৰা হৈছে...'}
                      </span>
                    </div>
                  )}

                  {advisoryText && (
                    <div style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      paddingTop: '0.5rem',
                      maxHeight: '260px',
                      overflowY: 'auto'
                    }} className="warning-cards-container">
                      {renderMarkdown(advisoryText)}
                    </div>
                  )}
                </div>
              )}

              <h3>{t('evac_closest_camps')}</h3>
              <p style={{ fontSize: '0.725rem', color: '#64748b', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                {language === 'en' ? 'Dotted paths connect user to safety camps.' : 'বিন্দুযুক্ত ৰেখাই শিবিৰলৈ যাবলগীয়া সুৰক্ষিত পথ দেখুৱাইছে।'}
              </p>
              <div className="shelter-list-container" style={{ overflowY: 'visible', flex: 'none' }}>
                {nearestShelters.length === 0 ? (
                  <div className="no-warnings-card">
                    <span>🏡</span>
                    <p>{language === 'en' ? 'Select an alert to calculate nearest shelters.' : 'উচৰৰ শিবিৰসমূহ চাবলৈ যিকোনো একটা সতৰ্কবাণীত ক্লিক কৰক।'}</p>
                  </div>
                ) : (
                  nearestShelters.map((shelter) => {
                    const occupancyRate = (shelter.occupied / shelter.capacity) * 100;
                    const isFull = occupancyRate > 90;
                    const isModerate = occupancyRate > 60 && occupancyRate <= 90;
                    const progressColor = isFull ? '#ef4444' : isModerate ? '#f97316' : '#10b981';

                    return (
                      <div key={shelter.id} className="shelter-route-card">
                        <div className="shelter-card-header">
                          <h4>{getTranslatedShelterName(shelter.name)}</h4>
                          <span className="distance-pill">{shelter.distance} km</span>
                        </div>
                        <p className="shelter-location">📍 {getTranslatedLocationName(shelter.locationName)}</p>
                        
                        {/* Occupancy Progress Bar */}
                        <div className="occupancy-progress-section">
                          <div className="occupancy-label">
                            <span>{t('occupancy_status')}</span>
                            <span>{shelter.occupied}/{shelter.capacity} beds</span>
                          </div>
                          <div className="progress-bg">
                            <div 
                              className="progress-fill" 
                              style={{ 
                                width: `${occupancyRate}%`, 
                                backgroundColor: progressColor 
                              }} 
                            />
                          </div>
                        </div>

                        {/* Supplies Checklist */}
                        <div className="supplies-checklist">
                          <div className="supply-item">
                            <span>🍚 {t('food_ration')}</span>
                            <strong className={`status-${shelter.supplies.food}`}>
                              {shelter.supplies.food === 'adequate' 
                                ? (language === 'en' ? 'ADEQUATE' : 'পৰ্যাপ্ত') 
                                : (language === 'en' ? 'CRITICAL' : 'জৰুৰী')}
                            </strong>
                          </div>
                          <div className="supply-item">
                            <span>💊 {t('medical_kit')}</span>
                            <strong className={`status-${shelter.supplies.medicine}`}>
                              {shelter.supplies.medicine === 'adequate' 
                                ? (language === 'en' ? 'ADEQUATE' : 'পৰ্যাপ্ত') 
                                : (language === 'en' ? 'CRITICAL' : 'জৰুৰী')}
                            </strong>
                          </div>
                          <div className="supply-item">
                            <span>⚡ {t('backup_power')}</span>
                            <strong>
                              {shelter.supplies.powerGenerator 
                                ? (language === 'en' ? '✔️ ACTIVE' : '✔️ সক্ৰিয়') 
                                : (language === 'en' ? '❌ NONE' : '❌ নাই')}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Disaster Analytics Charts inside Scroll Wrapper */}
        {activeTab === 'analytics' && (
          <div className="sidebar-scroll-wrapper">
            <div className="analytics-tab-section">
              <h3>{language === 'en' ? 'Disaster Category Analysis' : 'বিপদ শ্ৰেণী বিভাজন বিশ্লেষণ'}</h3>
              <p style={{ fontSize: '0.725rem', color: '#64748b', marginBottom: '1rem' }}>
                {language === 'en' ? 'Weekly incident metrics across models.' : 'সক্ৰিয় বিপদসমূহৰ পৰিসংখ্যা বিশ্লেষণ।'}
              </p>

              {/* Custom SVG Bar Chart */}
              <div className="svg-chart-container">
                {categoryAnalytics.map((item) => {
                  const percentage = (item.count / maxAnalyticVal) * 100;
                  return (
                    <div key={item.label} className="chart-bar-row">
                      <div className="chart-bar-header">
                        <span className="chart-bar-label">{item.label}</span>
                        <span className="chart-bar-value">{item.count}</span>
                      </div>
                      <div className="chart-bar-outer">
                        <div 
                          className="chart-bar-inner" 
                          style={{ 
                            width: `${Math.max(percentage, 3)}%`, 
                            backgroundColor: item.color 
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 style={{ marginTop: '2rem' }}>{language === 'en' ? 'Severity Proportion' : 'তীব্ৰতাৰ অনুপাত'}</h3>
              {totalWarningsCount > 0 ? (
                <div className="severity-donut-wrapper">
                  <svg width="120" height="120" viewBox="0 0 120 120" className="donut-svg">
                    {/* Base Circle */}
                    <circle cx="60" cy="60" r="45" fill="none" stroke="#1e293b" strokeWidth="18" />
                    
                    {/* Segment: Red */}
                    {redAlertCount > 0 && (
                      <circle 
                        cx="60" cy="60" r="45" fill="none" 
                        stroke="#ef4444" strokeWidth="18"
                        strokeDasharray={`${(redAlertCount / totalWarningsCount) * 282.7} 282.7`}
                        strokeDashoffset="0"
                        transform="rotate(-90 60 60)"
                      />
                    )}
                    
                    {/* Segment: Orange */}
                    {orangeAlertCount > 0 && (
                      <circle 
                        cx="60" cy="60" r="45" fill="none" 
                        stroke="#f97316" strokeWidth="18"
                        strokeDasharray={`${(orangeAlertCount / totalWarningsCount) * 282.7} 282.7`}
                        strokeDashoffset={`-${(redAlertCount / totalWarningsCount) * 282.7}`}
                        transform="rotate(-90 60 60)"
                      />
                    )}

                    {/* Segment: Yellow */}
                    {yellowAlertCount > 0 && (
                      <circle 
                        cx="60" cy="60" r="45" fill="none" 
                        stroke="#eab308" strokeWidth="18"
                        strokeDasharray={`${(yellowAlertCount / totalWarningsCount) * 282.7} 282.7`}
                        strokeDashoffset={`-${((redAlertCount + orangeAlertCount) / totalWarningsCount) * 282.7}`}
                        transform="rotate(-90 60 60)"
                      />
                    )}
                  </svg>
                  <div className="donut-legend">
                    <div className="legend-item"><span className="legend-bullet" style={{ backgroundColor: '#ef4444' }} /> {language === 'en' ? 'Critical' : 'জৰুৰী'} (Red): {redAlertCount}</div>
                    <div className="legend-item"><span className="legend-bullet" style={{ backgroundColor: '#f97316' }} /> {language === 'en' ? 'Warning' : 'সতৰ্কবাণী'} (Orange): {orangeAlertCount}</div>
                    <div className="legend-item"><span className="legend-bullet" style={{ backgroundColor: '#eab308' }} /> {language === 'en' ? 'Advisory' : 'পৰামৰ্শ'} (Yellow): {yellowAlertCount}</div>
                  </div>
                </div>
              ) : (
                <div className="no-warnings-card">
                  <span>🛡️</span>
                  <p>No data available to chart.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="footer">
          <p>Multi-Hazard Alert System &bull; Phase 3</p>
          <p style={{ marginTop: '0.25rem', opacity: 0.65 }}>
            Automated Proximity Routers & Evacuations
          </p>
        </div>
      </aside>

      {/* Map display section */}
      <main className="map-container-section">
        <MapWrapper
          showWeather={showWeather}
          showFloods={showFloods}
          showEarthquakes={showEarthquakes}
          showFires={showFires}
          showHistoricalFloods={showHistoricalFloods}
          flyToLocation={flyToLocation}
          onDataLoaded={handleDataLoaded}
          selectedWarning={selectedWarning}
          nearestShelters={nearestShelters}
        />
      </main>
    </div>
  );
}
