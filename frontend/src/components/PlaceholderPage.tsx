import { CheckCircle2 } from 'lucide-react';

interface Feature {
  label: string;
}

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  features: Feature[];
}

export default function PlaceholderPage({ eyebrow, title, features }: PlaceholderPageProps) {
  return (
    <main className="page" style={{ paddingTop: 80 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">Esta sección está en desarrollo.</p>
        </div>
      </div>
      <div className="placeholder-card">
        <div className="placeholder-badge">Próximamente</div>
        <div className="placeholder-title">¿Qué va a incluir?</div>
        <ul className="placeholder-list">
          {features.map((f, i) => (
            <li key={i} className="placeholder-item">
              <CheckCircle2 size={15} strokeWidth={2} className="placeholder-check" />
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
