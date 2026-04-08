// src/components/ReconciledDataComp.tsx

import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import ReconciledDataHook from '../../hooks/ReconciledDataHook';

const ReconciledDataComp: React.FC = () => {
  const { reconciledData, error } = ReconciledDataHook();

  return (
    <div className="reconciled-container">
      {error && <div>{error}</div>}
      {reconciledData.length > 0 ? (
        <DataTable
          value={reconciledData}
          scrollable
          scrollHeight="200px"
          style={{ width: '100%', fontSize: '12px' }}
          className="p-datatable-sm"
        >
          <Column
            field="id"
            header="ID"
            style={{ width: '100px', padding: '4px 8px' }}
          />
          {reconciledData[0] &&
            Object.keys(reconciledData[0])
              .filter((key) => key !== 'id')
              .map((key, index) => (
                <Column
                  key={index}
                  field={key}
                  header={`V${index + 1}`} // Cabeçalhos genéricos V1, V2, etc.
                  style={{ width: '80px', padding: '4px 8px' }}
                />
              ))}
        </DataTable>
      ) : (
        <div>Nenhum dado reconciliado disponível</div>
      )}
    </div>
  );
};

export default ReconciledDataComp;
