// src/components/ExistingTags.tsx

import React from 'react';
import { Tag } from 'primereact/tag';
import useTags from '../../hooks/TagHook';

const ExistingTags: React.FC = () => {
  const { edgeNames, error } = useTags();

  return (
    <div className="existing-tags-grid">
      {error && <div>{error}</div>}
      {edgeNames.map((tag, index) => (
        <div key={index} className="tag-item">
          <Tag value={tag} severity="info" />
        </div>
      ))}
    </div>
  );
};

export default ExistingTags;
