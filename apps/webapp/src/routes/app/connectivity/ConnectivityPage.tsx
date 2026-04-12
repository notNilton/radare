import { useState } from 'react';
import { Activity, Copy, Key, Plus, RefreshCw, Trash2, Wifi, WifiOff } from 'lucide-react';
import {
  useApiKeys,
  useConnectivityStatus,
  useCreateApiKey,
  useCreateMapping,
  useExternalMappings,
  useIngestValue,
  useRevokeApiKey
} from '../../../hooks/useConnectivity';
import { useTags } from '../../../hooks/useTags';

const CONNECTOR_LABELS: Record<string, string> = {
  redis: 'Redis Cache',
  mqtt: 'MQTT Broker',
  influxdb: 'InfluxDB',
  manual: 'Ingest Manual',
};

function StatusDot({ online }: { online: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: online ? '#10b981' : '#6b7280',
      boxShadow: online ? '0 0 6px #10b981' : 'none',
      flexShrink: 0,
    }} />
  );
}

function ConnectorCard({ name, status, last_seen }: { name: string; status: string; last_seen?: string }) {
  const online = status === 'online';
  const label = CONNECTOR_LABELS[name] ?? name;
  const lastSeenStr = last_seen ? new Date(last_seen).toLocaleTimeString() : '—';

  return (
    <div style={{
      padding: '16px 20px',
      border: `1px solid ${online ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
      borderRadius: 4,
      background: online ? 'rgba(16,185,129,0.04)' : 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      {online ? <Wifi size={18} style={{ color: '#10b981', flexShrink: 0 }} /> : <WifiOff size={18} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-1)', margin: 0 }}>{label}</p>
        {last_seen && (
          <p style={{ fontSize: 10, color: 'var(--tx-3)', margin: '2px 0 0' }}>
            Último contato: {lastSeenStr}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusDot online={online} />
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: online ? '#10b981' : 'var(--tx-3)' }}>
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
}

export function ConnectivityPage() {
  const { data: connectivity, isLoading: loadingStatus, refetch } = useConnectivityStatus();
  const { data: mappings = [], isLoading: loadingMappings } = useExternalMappings();
  const { data: tags = [] } = useTags();
  const createMapping = useCreateMapping();
  const ingestValue = useIngestValue();
  const { data: apiKeys = [] } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();

  const [newMapping, setNewMapping] = useState<{ tag_id: number; connector_type: 'mqtt' | 'influxdb' | 'manual'; external_name: string; topic: string }>({ tag_id: 0, connector_type: 'mqtt', external_name: '', topic: '' });
  const [ingestForm, setIngestForm] = useState({ tagId: 0, value: '' });
  const [ingestMsg, setIngestMsg] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px',
    fontSize: 12,
    background: 'var(--panel)',
    border: '1px solid var(--border-md)',
    borderRadius: 4,
    color: 'var(--tx-1)',
    outline: 'none',
    width: '100%',
  };

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid var(--accent-bd)',
    borderRadius: 4,
    background: 'var(--accent-bg)',
    color: 'var(--accent)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  const lblStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--tx-3)',
    marginBottom: 4,
    display: 'block',
  };

  const thStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--tx-3)',
    padding: '10px 16px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    fontWeight: 600,
    background: 'var(--surface)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: 12,
    color: 'var(--tx-1)',
    borderBottom: '1px solid var(--border)',
  };

  async function submitIngest() {
    if (!ingestForm.tagId || !ingestForm.value) return;
    try {
      await ingestValue.mutateAsync({ tagId: ingestForm.tagId, value: parseFloat(ingestForm.value) });
      setIngestMsg('Valor enviado com sucesso.');
      setTimeout(() => setIngestMsg(''), 3000);
    } catch {
      setIngestMsg('Erro ao enviar valor.');
    }
  }

  async function createKey() {
    if (!apiKeyName.trim()) return;
    try {
      const created = await createApiKey.mutateAsync({ name: apiKeyName.trim() });
      setGeneratedKey(created.key);
      setApiKeyName('');
    } catch {
      setGeneratedKey(null);
    }
  }

  async function copyKey() {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full custom-scrollbar">
      {/* Header */}
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={16} style={{ color: 'var(--accent)' }} />
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--tx-1)' }}>CONECTIVIDADE</h1>
            <p className="text-xs" style={{ color: 'var(--tx-2)', marginTop: 2 }}>Status dos conectores e mapeamento De-Para de tags.</p>
          </div>
        </div>
        <button type="button" onClick={() => void refetch()} style={{ ...btnStyle, background: 'transparent', border: '1px solid var(--border-md)', color: 'var(--tx-2)' }}>
          <RefreshCw size={12} />
          Atualizar
        </button>
      </header>

      {/* Connector Status Grid */}
      <section>
        <p style={{ ...lblStyle, marginBottom: 10 }}>Status dos Conectores</p>
        {loadingStatus ? (
          <p style={{ fontSize: 12, color: 'var(--tx-3)' }}>Carregando...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {(connectivity?.connectors ?? []).map((c) => (
              <ConnectorCard key={c.name} {...c} />
            ))}
          </div>
        )}
      </section>

      {/* Manual Ingest */}
      <section style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)' }}>
        <p style={{ ...lblStyle, marginBottom: 14 }}>Ingest Manual de Valor</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <label>
            <span style={lblStyle}>Tag</span>
            <select
              value={ingestForm.tagId}
              onChange={(e) => setIngestForm((f) => ({ ...f, tagId: Number(e.target.value) }))}
              style={inputStyle}
            >
              <option value={0}>Selecione uma tag</option>
              {tags.map((t) => <option key={t.ID} value={t.ID}>{t.name} ({t.unit})</option>)}
            </select>
          </label>
          <label>
            <span style={lblStyle}>Valor</span>
            <input
              type="number"
              step="any"
              placeholder="ex: 42.5"
              value={ingestForm.value}
              onChange={(e) => setIngestForm((f) => ({ ...f, value: e.target.value }))}
              style={inputStyle}
            />
          </label>
          <button type="button" onClick={() => void submitIngest()} disabled={ingestValue.isPending} style={btnStyle}>
            Enviar
          </button>
        </div>
        {ingestMsg && <p style={{ marginTop: 8, fontSize: 11, color: 'var(--tx-2)' }}>{ingestMsg}</p>}
      </section>

      {/* De-Para Mapping */}
      <section style={{ border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ ...lblStyle, margin: 0 }}>Mapeamento De-Para (Tags Externas)</p>
        </div>

        {/* Create form */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <label>
            <span style={lblStyle}>Tag Interna</span>
            <select
              value={newMapping.tag_id}
              onChange={(e) => setNewMapping((m) => ({ ...m, tag_id: Number(e.target.value) }))}
              style={inputStyle}
            >
              <option value={0}>Selecione</option>
              {tags.map((t) => <option key={t.ID} value={t.ID}>{t.name}</option>)}
            </select>
          </label>
          <label>
            <span style={lblStyle}>Conector</span>
            <select
              value={newMapping.connector_type}
              onChange={(e) => setNewMapping((m) => ({ ...m, connector_type: e.target.value as 'mqtt' | 'influxdb' | 'manual' }))}
              style={inputStyle}
            >
              <option value="mqtt">MQTT</option>
              <option value="influxdb">InfluxDB</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <label>
            <span style={lblStyle}>Nome Externo</span>
            <input
              value={newMapping.external_name}
              onChange={(e) => setNewMapping((m) => ({ ...m, external_name: e.target.value }))}
              placeholder="ex: FT-101"
              style={inputStyle}
            />
          </label>
          <label>
            <span style={lblStyle}>Tópico / Chave</span>
            <input
              value={newMapping.topic}
              onChange={(e) => setNewMapping((m) => ({ ...m, topic: e.target.value }))}
              placeholder="ex: plant/flow/FT-101"
              style={inputStyle}
            />
          </label>
          <button
            type="button"
            disabled={!newMapping.tag_id || !newMapping.external_name || createMapping.isPending}
            onClick={() => void createMapping.mutateAsync(newMapping).then(() => setNewMapping({ tag_id: 0, connector_type: 'mqtt', external_name: '', topic: '' }))}
            style={btnStyle}
          >
            <Plus size={12} />
            Adicionar
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th style={thStyle}>Tag Interna</th>
                <th style={thStyle}>Conector</th>
                <th style={thStyle}>Nome Externo</th>
                <th style={thStyle}>Tópico / Chave</th>
              </tr>
            </thead>
            <tbody>
              {loadingMappings ? (
                <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: 'var(--tx-3)' }}>Carregando...</td></tr>
              ) : mappings.length === 0 ? (
                <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: 'var(--tx-3)' }}>Nenhum mapeamento configurado.</td></tr>
              ) : mappings.map((m) => {
                const tag = tags.find((t) => t.ID === m.tag_id);
                return (
                  <tr key={m.ID}>
                    <td style={tdStyle}>{tag ? `${tag.name} (${tag.unit})` : `#${m.tag_id}`}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 3, background: 'var(--panel)', color: 'var(--tx-2)' }}>
                        {m.connector_type}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{m.external_name}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: 'var(--tx-2)' }}>{m.topic || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* API Keys */}
      <section style={{ border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-2">
            <Key size={14} style={{ color: 'var(--accent)' }} />
            <p style={{ ...lblStyle, margin: 0 }}>Chaves de API (Ingestão Externa)</p>
          </div>
        </div>

        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
          <label style={{ flex: 1, minWidth: 220 }}>
            <span style={lblStyle}>Nome da chave</span>
            <input
              value={apiKeyName}
              onChange={(e) => setApiKeyName(e.target.value)}
              placeholder="ex: Conector PLC A"
              style={inputStyle}
            />
          </label>
          <button type="button" onClick={() => void createKey()} disabled={createApiKey.isPending} style={btnStyle}>
            <Plus size={12} />
            Criar chave
          </button>
        </div>

        {generatedKey && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <code style={{ fontSize: 12, color: 'var(--tx-1)', wordBreak: 'break-all', flex: 1 }}>{generatedKey}</code>
            <button type="button" onClick={() => void copyKey()} style={{ ...btnStyle, background: 'transparent', border: '1px solid var(--border-md)', color: 'var(--tx-2)' }}>
              <Copy size={12} />
              Copiar
            </button>
          </div>
        )}

        <div style={{ padding: '14px 16px' }}>
          {apiKeys.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--tx-3)' }}>Nenhuma chave criada.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th style={thStyle}>Nome</th>
                  <th style={thStyle}>Prefixo</th>
                  <th style={thStyle}>Último uso</th>
                  <th style={thStyle}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td style={tdStyle}>{key.name}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--tx-2)' }}>{key.prefix}</td>
                    <td style={tdStyle}>{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : '—'}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => revokeApiKey.mutate(key.id)}
                        disabled={revokeApiKey.isPending}
                        style={{ ...btnStyle, background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}
                      >
                        <Trash2 size={12} />
                        Revogar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
