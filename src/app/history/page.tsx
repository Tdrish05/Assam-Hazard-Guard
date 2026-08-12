import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { calculateTrustScore } from '@/lib/routing-engine';
import { ResolveButton, VerifyButton, LogoutButton } from './ClientButtons';

interface HistoryPageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.query || '';
  const category = resolvedParams.category || '';

  // 1. Session verification check
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  const isAuthorized = session?.value === 'authorized-coordinator-token-2026';

  // 2. Read language cookie for Server Component translation
  const langCookie = cookieStore.get('lang');
  const language = langCookie?.value === 'as' ? 'as' : 'en';

  // Build Prisma query filters dynamically
  const whereClause: any = {};

  if (category && category !== 'all') {
    whereClause.category = category;
  }

  if (query) {
    whereClause.description = {
      contains: query,
      mode: 'insensitive', // Case-insensitive matching in PostgreSQL
    };
  }

  // Fetch reports from Postgres database
  let reports: any[] = [];
  let allReportsForConsensus: any[] = [];
  let dbError = false;

  try {
    reports = await prisma.alert.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
    });

    allReportsForConsensus = await prisma.alert.findMany({
      where: {
        status: 'ACTIVE',
      }
    });
  } catch (err) {
    console.error('Prisma incident fetch error:', err);
    dbError = true;
  }

  // Pre-calculate trust ratings for the visible list
  const reportsWithTrust = reports.map((report) => {
    const trustDetails = calculateTrustScore(
      {
        category: report.category,
        latitude: report.latitude,
        longitude: report.longitude,
        upvotes: report.upvotes,
      },
      allReportsForConsensus,
      15.0
    );

    return {
      ...report,
      trust: trustDetails,
    };
  });

  const getCategoryLabel = (cat: string) => {
    if (language === 'as') {
      if (cat === 'waterlogging') return 'বানপানী / নিষ্কাশন';
      if (cat === 'road_closure') return 'পথ বন্ধ';
      if (cat === 'pothole') return 'পথৰ গাত';
      if (cat === 'power_outage') return 'বিদ্যুৎ ব্যাহত';
      return 'অন্যান্য বিপদ';
    }
    if (cat === 'waterlogging') return 'Waterlogging';
    if (cat === 'road_closure') return 'Road Block';
    if (cat === 'pothole') return 'Pothole';
    if (cat === 'power_outage') return 'Outage';
    return 'Other';
  };

  const getSeverityClass = (upvotes: number) => {
    if (upvotes >= 10) return 'severe-row';
    if (upvotes >= 5) return 'moderate-row';
    return 'info-row';
  };

  const getTranslatedTrustLabel = (label: string) => {
    if (language === 'en') return label;
    if (label.includes('Verified')) return 'সত্যাাপিত তথ্য';
    if (label.includes('Corroborated')) return 'সমৰ্থিত তথ্য';
    return 'অসত্যাাপিত তথ্য (মিছা খবৰৰ আশংকা)';
  };

  return (
    <div className="subpage-container">
      {/* Title & Auth State Banner */}
      <div className="subpage-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>
            {language === 'en' ? 'Incident History Directory' : 'ঘটনাৰ ইতিহাস তথ্যকোষ'}
          </h1>
          <p>
            {language === 'en' 
              ? 'Historical database of community-reported hazards and waterlogging logs submitted by citizens.'
              : 'ৰাইজৰ দ্বাৰা প্ৰতিবেদিত বিপদ আৰু বানপানীৰ ঐতিহাসিক তথ্যকোষ।'}
          </p>
        </div>

        {/* Auth control widget */}
        <div style={{ alignSelf: 'center' }}>
          {isAuthorized ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.725rem', color: '#10b981', fontWeight: 700 }}>
                {language === 'en' ? 'Coordinator Active' : 'সমন্বয়ক সক্ৰিয়'}
              </span>
              <LogoutButton />
            </div>
          ) : (
            <Link 
              href="/login" 
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}
            >
              {language === 'en' ? 'Coordinator Sign-In' : 'সমন্বয়ক প্ৰৱেশ'}
            </Link>
          )}
        </div>
      </div>

      {/* Database Search Filter Panel */}
      <div className="filter-archive-panel">
        <form method="GET" action="/history" className="archive-search-form">
          <div className="form-input-box">
            <label htmlFor="query-search">
              {language === 'en' ? 'Keyword Search' : 'শব্দ সন্ধান'}
            </label>
            <input
              id="query-search"
              type="text"
              name="query"
              placeholder={language === 'en' ? 'Search reports description...' : 'বিৱৰণ সন্ধান কৰক...'}
              defaultValue={query}
            />
          </div>
          <div className="form-input-box">
            <label htmlFor="category-select">
              {language === 'en' ? 'Incident Type' : 'বিপদৰ ধৰণ'}
            </label>
            <select id="category-select" name="category" defaultValue={category || 'all'}>
              <option value="all">{language === 'en' ? 'All Incidents' : 'সকলো ঘটনা'}</option>
              <option value="waterlogging">{language === 'en' ? 'Waterlogging / Drainage' : 'বানপানী / নিষ্কাশন'}</option>
              <option value="road_closure">{language === 'en' ? 'Road Closure / Blocks' : 'পথ বন্ধ'}</option>
              <option value="pothole">{language === 'en' ? 'Pothole Damage' : 'পথৰ গাত'}</option>
              <option value="power_outage">{language === 'en' ? 'Power Outages' : 'বিদ্যুৎ ব্যাহত'}</option>
              <option value="other">{language === 'en' ? 'Other Hazards' : 'অন্যান্য বিপদ'}</option>
            </select>
          </div>
          <div className="form-action-buttons">
            <button type="submit" className="btn-primary">
              {language === 'en' ? 'Filter Records' : 'সন্ধান কৰক'}
            </button>
            {(query || category) && (
              <Link href="/history" className="btn-secondary btn-clear">
                {language === 'en' ? 'Clear Filters' : 'ফিল্টাৰ মচক'}
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Directory Records Table */}
      <div className="database-table-panel">
        {dbError ? (
          <div className="db-alert db-error">
            <p>
              {language === 'en' 
                ? 'Database Connection Error. Ensure your PostgreSQL service is running.' 
                : 'তথ্যকোষ সংযোগত সমস্যা হৈছে। অনুগ্ৰহ কৰি পৰীক্ষা কৰক।'}
            </p>
          </div>
        ) : reportsWithTrust.length === 0 ? (
          <div className="db-alert db-empty">
            <p>
              {language === 'en' 
                ? 'No matching database records found for selected query filter guidelines.'
                : 'বাছনি কৰা শ্ৰেণীৰ কোনো ঘটনাৰ তথ্য পোৱা নগ’ল।'}
            </p>
            <Link href="/report" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              {language === 'en' ? 'Log First Incident' : 'প্ৰথম খবৰ দিয়ক'}
            </Link>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="archive-data-table">
              <thead>
                <tr>
                  <th>{language === 'en' ? 'Category' : 'বিভাগ'}</th>
                  <th>{language === 'en' ? 'Description' : 'সবিশেষ বিৱৰণ'}</th>
                  <th>{language === 'en' ? 'Coordinates' : 'স্থানাংক'}</th>
                  <th>{language === 'en' ? 'Status' : 'অৱস্থা'}</th>
                  <th>{language === 'en' ? 'Consensus Trust Index' : 'বিশ্বাসযোগ্যতা সূচক'}</th>
                  {isAuthorized && <th>{language === 'en' ? 'Auth Actions' : 'পদক্ষেপ'}</th>}
                  <th>{language === 'en' ? 'Logged Date' : 'নথিভুক্ত তাৰিখ'}</th>
                </tr>
              </thead>
              <tbody>
                {reportsWithTrust.map((report) => {
                  const trustColor = report.trust.status === 'verified' 
                    ? '#10b981' 
                    : report.trust.status === 'corroborated' 
                    ? '#f97316' 
                    : '#ef4444';

                  return (
                    <tr key={report.id} className={getSeverityClass(report.upvotes)}>
                      <td className="col-category">
                        <span className={`category-cell-tag cat-${report.category}`}>
                          {getCategoryLabel(report.category)}
                        </span>
                      </td>
                      <td className="col-description">
                        <p className="description-text">{report.description}</p>
                      </td>
                      <td className="col-coords">
                        <code>{report.latitude.toFixed(4)}°, {report.longitude.toFixed(4)}°</code>
                      </td>
                      <td className="col-status">
                        <span className={`status-pill status-${report.status.toLowerCase()}`}>
                          {report.status === 'ACTIVE' 
                            ? (language === 'en' ? 'ACTIVE' : 'সক্ৰিয়') 
                            : (language === 'en' ? 'RESOLVED' : 'সমাধান')}
                        </span>
                      </td>
                      
                      {/* Consensus Trust Gauge */}
                      <td className="col-trust" style={{ minWidth: '160px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', fontWeight: 600 }}>
                            <span style={{ color: trustColor }}>{getTranslatedTrustLabel(report.trust.label)}</span>
                            <span>{report.trust.confidence}%</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${report.trust.confidence}%`, 
                                backgroundColor: trustColor, 
                                borderRadius: '2px' 
                              }} 
                            />
                          </div>
                          <span style={{ fontSize: '0.6rem', color: '#64748b' }}>
                            {language === 'en' ? 'Upvotes:' : 'সমৰ্থন:'} {report.upvotes}
                          </span>
                        </div>
                      </td>

                      {/* Coordinator Actions */}
                      {isAuthorized && (
                        <td className="col-actions">
                          {report.status === 'ACTIVE' ? (
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <VerifyButton id={report.id} />
                              <ResolveButton id={report.id} />
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>
                              {language === 'en' ? 'Resolved' : 'সমাধান কৰা হ’ল'}
                            </span>
                          )}
                        </td>
                      )}

                      <td className="col-date">
                        {new Date(report.timestamp).toLocaleString(language === 'as' ? 'as-IN' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
