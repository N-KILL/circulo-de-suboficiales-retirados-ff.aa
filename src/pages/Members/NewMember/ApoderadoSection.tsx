import React, { useCallback, useRef, useState } from "react";
import { Search, User, Loader } from "lucide-react";
import type { Person } from "../../../models/members";
import { fetchPersons } from "../../../services/membersApi";

export interface ApoderadoSectionProps {
  title: string;
  apoderado: Person | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  visible: boolean;
  onVisibleChange: (v: boolean) => void;
  onSelect: (person: Person) => void;
  onRemove: () => void;
}

const ApoderadoSection: React.FC<ApoderadoSectionProps> = ({
  title,
  apoderado,
  searchValue,
  onSearchChange,
  visible,
  onVisibleChange,
  onSelect,
  onRemove,
}) => {
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchPersons(q);
      setResults(result);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (value: string) => {
    onSearchChange(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleFocus = () => {
    onVisibleChange(true);
    if (searchValue) doSearch(searchValue);
  };

  const handleSelect = (p: Person) => {
    onSelect(p);
    onSearchChange("");
    onVisibleChange(false);
    setResults([]);
  };

  return (
    <div className="sidebar-section">
      <h4>{title}</h4>
      {apoderado ? (
        <div className="person-card">
          <div className="person-card-header">
            <div className="person-avatar">
              <User size={20} />
            </div>
            <div className="person-info">
              <span className="person-name">{apoderado.nombre}</span>
              <span className="person-doc">DNI: {apoderado.documento}</span>
            </div>
          </div>
          <button className="header-btn small btn-remove" onClick={onRemove}>
            Quitar
          </button>
        </div>
      ) : (
        <div className="search-wrapper">
          <div className="input-with-icon">
            <input
              className="search-input"
              placeholder="Buscar por nombre o DNI..."
              value={searchValue}
              onFocus={handleFocus}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Search size={16} className="input-icon" />
          </div>
          {visible && (
            <div className="search-results">
              {loading ? (
                <div className="search-result-item" style={{ justifyContent: "center" }}>
                  <Loader size={14} className="spin" /> Buscando...
                </div>
              ) : searchValue && results.length === 0 ? (
                <div className="search-result-item" style={{ justifyContent: "center", color: "var(--muted)" }}>
                  Sin resultados
                </div>
              ) : (
                results.map((p) => (
                  <div
                    key={p.id || p.documento}
                    className="search-result-item"
                    onClick={() => handleSelect(p)}
                  >
                    <div className="search-result-name">{p.nombre}</div>
                    <div className="search-result-doc">{p.documento}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApoderadoSection;
