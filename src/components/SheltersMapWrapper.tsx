'use client';

import dynamic from 'next/dynamic';
import { Shelter } from '@/lib/shelters';

const SheltersMap = dynamic(() => import('./SheltersMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minHeight: '380px',
      backgroundColor: '#0b0f17',
      borderRadius: '12px',
      color: '#94a3b8',
      fontSize: '1rem',
      fontWeight: '500',
      boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          border: '3px solid #1e293b',
          borderTop: '3px solid #10b981',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px auto'
        }} />
        Loading Safe Shelter Geometries...
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  ),
});

export default function SheltersMapWrapper(props: { shelters: Shelter[]; selectedShelter: Shelter | null }) {
  return <SheltersMap {...props} />;
}
