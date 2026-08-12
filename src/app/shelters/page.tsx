'use client';

import { useState } from 'react';
import { SHELTERS_DB, Shelter } from '@/lib/shelters';
import SheltersMapWrapper from '@/components/SheltersMapWrapper';
import { useLanguage } from '@/context/LanguageContext';

export default function SheltersPage() {
  const { language, t } = useLanguage();
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  const handleShelterClick = (shelter: Shelter) => {
    setSelectedShelter(shelter);
  };

  // Helper to translate district names
  const getTranslatedDistrict = (dist: string) => {
    if (language === 'en') return `${dist} District`;
    const d = dist.toLowerCase();
    if (d.includes('kamrup')) return 'কামৰূপ মহানগৰ জিলা';
    if (d.includes('dibrugarh')) return 'ডিব্ৰুগড় জিলা';
    if (d.includes('jorhat')) return 'যোৰহাট জিলা';
    if (d.includes('cachar')) return 'কাছাৰ জিলা';
    if (d.includes('sonitpur')) return 'শোণিতপুৰ জিলা';
    if (d.includes('dima')) return 'ডিমা হাচাও জিলা';
    return dist;
  };

  // Helper to translate addresses
  const getTranslatedAddress = (address: string) => {
    if (language === 'en') return address;
    const addrMap: Record<string, string> = {
      'Nehru Stadium Road, Guwahati': 'নেহৰু ষ্টেডিয়াম পথ, গুৱাহাটী',
      'University Campus, Dibrugarh': 'বিশ্ববিদ্যালয় চৌহদ, ডিব্ৰুগড়',
      'KB Road, Jorhat': 'কে.বি. ৰোড, যোৰহাট',
      'College Road, Silchar': 'কলেজ ৰোড, ছিলচৰ',
      'Tezpur College Ground, Tezpur': 'তেজপুৰ মহাবিদ্যালয় খেলপথাৰ, তেজপুৰ',
      'Hill View Road, Haflong': 'হিল ভিউ ৰোড, হাফলং'
    };
    return addrMap[address] || address;
  };

  // Localized shelter details database matching SHELTERS_DB values exactly
  const getTranslatedShelterDetails = (shelter: Shelter) => {
    if (language === 'en') {
      return { name: shelter.name, desc: shelter.description };
    }

    const nameMap: Record<string, { name: string; desc: string }> = {
      'Guwahati Sports Complex Relief Hub': {
        name: 'গুৱাহাটী ক্ৰীড়া প্ৰকল্প সাহায্য কেন্দ্ৰ',
        desc: 'শুকান খাদ্য সামগ্ৰী, খোৱা পানী আৰু ২৪ ঘণ্টা প্ৰাথমিক চিকিৎসা সেৱাৰ সুন্দৰ সুবিধা থকা আশ্ৰয় শিবিৰ।'
      },
      'Dibrugarh University Relief camp': {
        name: 'ডিব্ৰুগড় বিশ্ববিদ্যালয় আশ্ৰয় শিবিৰ',
        desc: 'উত্তৰ অসম অঞ্চলৰ এক বৃহৎ আশ্ৰয় শিবিৰ। অধিক ক্ষমতা সম্পন্ন যদিও বৰ্তমান ভৰ্তি হোৱাৰ দিশে।'
      },
      'Jorhat Town Hall Relief Station': {
        name: 'যোৰহাট টাউন হ’ল সাহায্য শিবিৰ',
        desc: 'যোৰহাট টাউন হ’লত স্থাপিত সাহায্য শিবিৰ। নিৰাপদ শৌচালয় আৰু অনাময় ব্যৱস্থা সক্ৰিয় হৈ আছে।'
      },
      'Silchar Government Relief Center': {
        name: 'ছিলচৰ চৰকাৰী সাহায্য কেন্দ্ৰ',
        desc: 'বৰাক উপত্যকাৰ সাহায্য শিবিৰ। বৰাক নদীৰ জলস্তৰ বিপদসীমাৰ ওপৰলৈ যোৱাৰ বাবে বৰ্তমান ইয়াত সাহায্য কাম তীব্ৰতৰ কৰা হৈছে।'
      },
      'Tezpur Government College Camp': {
        name: 'তেজপুৰ চৰকাৰী মহাবিদ্যালয় শিবিৰ',
        desc: 'শোণিতপুৰ জিলাৰ ওখ আৰু নিৰাপদ আশ্ৰয় স্থান। বানাক্ৰান্ত লোকৰ বাবে সামূহিক পাকঘৰৰ ব্যৱস্থা সক্ৰিয় হৈ আছে।'
      },
      'Haflong District Community Hall': {
        name: 'হাফলং জিলা সামূহিক প্ৰেক্ষাগৃহ',
        desc: 'ডিমা হাচাও পাহাৰীয়া এলেকাৰ বাবে নিৰ্মিত সামূহিক আশ্ৰয় কেন্দ্ৰ। ভূমিস্খলন প্ৰতিৰোধী গধুৰ যন্ত্ৰপাতিৰ সুবিধা ওচৰতে মজুত ৰখা হৈছে।'
      }
    };

    return nameMap[shelter.name] || { name: shelter.name, desc: shelter.description };
  };

  return (
    <div className="subpage-container">
      <div className="subpage-header">
        <h1>
          {language === 'en' ? 'Assam Evacuation & Relief Hubs' : 'অসম উদ্ধাৰ আৰু আশ্ৰয় শিবিৰসমূহ'}
        </h1>
        <p>
          {language === 'en' 
            ? 'Directory of safe shelters, active occupancy rates, resource checklists, and emergency hotlines.'
            : 'নিৰাপদ আশ্ৰয় শিবিৰ, সক্ৰিয় আশ্ৰয়প্ৰাপ্ত লোকৰ সংখ্যা, সাহায্য সামগ্ৰীৰ তালিকা আৰু জৰুৰীকালীন হেল্পলাইন নম্বৰৰ ঠিকনা।'}
        </p>
      </div>

      <div className="shelters-layout-grid">
        {/* Left Side: Directory Cards */}
        <div className="shelters-list-panel">
          <h2 className="panel-title">
            {language === 'en' ? 'Active Shelter Network' : 'sক্ৰিয় আশ্ৰয় শিবিৰ নেটৱৰ্ক'}
          </h2>
          <div className="shelters-cards-grid">
            {SHELTERS_DB.map((shelter) => {
              const occupancyRate = (shelter.occupied / shelter.capacity) * 100;
              const isFull = occupancyRate > 90;
              const isModerate = occupancyRate > 60 && occupancyRate <= 90;
              const progressColor = isFull ? '#ef4444' : isModerate ? '#f97316' : '#10b981';
              const isSelected = selectedShelter?.id === shelter.id;
              
              const localized = getTranslatedShelterDetails(shelter);

              return (
                <div 
                  key={shelter.id} 
                  className={`shelter-full-card ${isSelected ? 'active-shelter-card' : ''}`}
                  onClick={() => handleShelterClick(shelter)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="shelter-card-top">
                    <div>
                      <span className="district-tag">{getTranslatedDistrict(shelter.district)}</span>
                      <h3>{localized.name}</h3>
                    </div>
                    <span className="occupancy-pill" style={{ color: progressColor, borderColor: `${progressColor}33`, backgroundColor: `${progressColor}08` }}>
                      {Math.round(occupancyRate)}% {language === 'en' ? 'Full' : 'ভৰ্তি'}
                    </span>
                  </div>

                  <p className="address">{getTranslatedAddress(shelter.locationName)}</p>
                  <p className="description">{localized.desc}</p>

                  {/* Occupancy Progress */}
                  <div className="progress-section">
                    <div className="progress-labels">
                      <span>{t('occupancy_status')}</span>
                      <span>{shelter.occupied} / {shelter.capacity} {language === 'en' ? 'occupied' : 'আশ্ৰয়প্ৰাপ্ত'}</span>
                    </div>
                    <div className="progress-bar-outer">
                      <div 
                        className="progress-bar-inner" 
                        style={{ 
                          width: `${occupancyRate}%`, 
                          backgroundColor: progressColor 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Supplies checklist grid */}
                  <div className="supplies-grid">
                    <div className="supply-tag">
                      <span>{t('food_ration')}</span>
                      <strong className={`status-${shelter.supplies.food}`}>
                        {shelter.supplies.food === 'adequate' 
                          ? (language === 'en' ? 'ADEQUATE' : 'পৰ্যাপ্ত') 
                          : (language === 'en' ? 'CRITICAL' : 'জৰুৰী')}
                      </strong>
                    </div>
                    <div className="supply-tag">
                      <span>{t('medical_kit')}</span>
                      <strong className={`status-${shelter.supplies.medicine}`}>
                        {shelter.supplies.medicine === 'adequate' 
                          ? (language === 'en' ? 'ADEQUATE' : 'পৰ্যাপ্ত') 
                          : (language === 'en' ? 'CRITICAL' : 'জৰুৰী')}
                      </strong>
                    </div>
                    <div className="supply-tag">
                      <span>{t('backup_power')}</span>
                      <strong>
                        {shelter.supplies.powerGenerator 
                          ? (language === 'en' ? 'RUNNING' : 'সক্ৰিয়') 
                          : (language === 'en' ? 'NONE' : 'নাই')}
                      </strong>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="contact-section">
                    <span>{language === 'en' ? 'Emergency Helpline:' : 'জৰুৰীকালীন হেল্পলাইন:'}</span>
                    <strong>{shelter.contactNumber}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Map Viewer */}
        <div className="shelters-map-panel">
          <div className="map-sticky-header">
            <h2 className="panel-title">
              {language === 'en' ? 'Geospatial Shelter Map' : 'ভৌগোলিক আশ্ৰয় শিবিৰ মানচিত্ৰ'}
            </h2>
            <p>
              {selectedShelter 
                ? (language === 'en' ? `Centered on: ${selectedShelter.name}` : `কেন্দ্ৰীভূত কৰা হৈছে: ${getTranslatedShelterDetails(selectedShelter).name}`) 
                : (language === 'en' ? 'Click any shelter card to center coordinates and view details.' : 'সবিশেষ চাবলৈ যিকোনো আশ্ৰয় শিবিৰৰ কাৰ্ডত ক্লিক কৰক।')}
            </p>
          </div>
          <div className="map-wrapper-box">
            <SheltersMapWrapper 
              shelters={SHELTERS_DB} 
              selectedShelter={selectedShelter} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
