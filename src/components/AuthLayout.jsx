import { TriangleAlert } from 'lucide-react';
import { authMode } from '../services/authService';
import PredictiveArcEcho from './PredictiveArcEcho';

export default function AuthLayout({ children, wide, mockCode }) {
  return (
    <main className="auth-page">
      {/* Background Predictive Arc WebGL Animation Layer */}
      <div className="bg-canvas-wrapper" aria-hidden="true">
        <PredictiveArcEcho style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0 }} />
      </div>

      <span className="shape shape-1" /><span className="shape shape-2" /><span className="shape shape-3" />
      {authMode === 'mock' && (
        <div className="mock-banner" role="status">
          <div className="alert warn">
            <TriangleAlert size={18} />
            <div>
              <strong>Development mock mode.</strong> No email or SMS is sent.
              {mockCode && <> Your local test code is <span className="mock-code">{mockCode}</span></>}
            </div>
          </div>
        </div>
      )}
      <section className={`card ${wide ? 'wide' : ''}`}>{children}</section>
    </main>
  );
}
