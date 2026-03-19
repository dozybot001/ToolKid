import React from 'react';

const MainContent: React.FC = () => {
  return (
    <div className="main-content">
      <div className="content-header">
        <div className="header-title">Translated Content</div>
      </div>
      <div className="content-body">
        <div className="empty-state">
          <div className="empty-icon">📑</div>
          <div className="empty-text">Upload a PDF file and click TRANSLATE to begin</div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
