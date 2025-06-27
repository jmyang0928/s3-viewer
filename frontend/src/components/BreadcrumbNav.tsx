import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbNavProps {
  path: string[];
  onNavigate: (index: number) => void;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ path, onNavigate }) => {
  return (
    <div className="breadcrumb-container">
      <nav className="breadcrumb">
        <button
          className="breadcrumb-item"
          onClick={() => onNavigate(-1)}
          type="button"
        >
          <Home size={16} />
          <span>Home</span>
        </button>
        
        {path.map((segment, index) => (
          <React.Fragment key={index}>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <button
              className={`breadcrumb-item ${index === path.length - 1 ? 'active' : ''}`}
              onClick={() => index < path.length - 1 ? onNavigate(index) : undefined}
              disabled={index === path.length - 1}
              type="button"
            >
              {segment}
            </button>
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};

export default BreadcrumbNav;