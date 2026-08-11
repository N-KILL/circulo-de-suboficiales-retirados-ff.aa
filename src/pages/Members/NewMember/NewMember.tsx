import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader } from "lucide-react";
import "./NewMember.css";
import { useMembersStore } from "../../../store/membersStore";
import { fetchMemberById, deleteMember } from "../../../services/membersApi";
import type { MembersState } from "../../../models/members";
import MemberForm from "./MemberForm";
import ApoderadoSection from "./ApoderadoSection";

const NewMember: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(isEditing);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const setForm = useMembersStore((s: MembersState) => s.setForm);
  const apoderado1 = useMembersStore((s: MembersState) => s.apoderado1);
  const apoderado2 = useMembersStore((s: MembersState) => s.apoderado2);
  const ap1Search = useMembersStore((s: MembersState) => s.ap1Search);
  const ap1Visible = useMembersStore((s: MembersState) => s.ap1Visible);
  const ap2Search = useMembersStore((s: MembersState) => s.ap2Search);
  const ap2Visible = useMembersStore((s: MembersState) => s.ap2Visible);
  const setApoderado1 = useMembersStore((s: MembersState) => s.setApoderado1);
  const setApoderado2 = useMembersStore((s: MembersState) => s.setApoderado2);
  const setAp1Search = useMembersStore((s: MembersState) => s.setAp1Search);
  const setAp1Visible = useMembersStore((s: MembersState) => s.setAp1Visible);
  const setAp2Search = useMembersStore((s: MembersState) => s.setAp2Search);
  const setAp2Visible = useMembersStore((s: MembersState) => s.setAp2Visible);
  const save = useMembersStore((s: MembersState) => s.save);
  const reset = useMembersStore((s: MembersState) => s.reset);

  useEffect(() => {
    if (id) {
      let mounted = true;
      fetchMemberById(id).then((member) => {
        if (mounted) setForm(member);
      }).catch((err) => {
        if (mounted) setFetchError(err instanceof Error ? err.message : "Error al cargar socio");
      }).finally(() => {
        if (mounted) setLoading(false);
      });
      return () => { mounted = false; };
    } else {
      reset();
    }
  }, [id, setForm, reset]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await save();
      navigate(-1);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setSaveError(null);
    try {
      await deleteMember(id);
      setShowConfirmDelete(false);
      navigate("/socios");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al eliminar");
      setShowConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="new-member-container">
      <div className="treasury-header-row">
        <button
          onClick={() => navigate(id ? `/socios/detalle/${id}` : "/socios")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none",
            color: "var(--azul-institucional)", fontWeight: 600,
            cursor: "pointer", padding: "4px 0", fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          <ArrowLeft size={18} /> Volver al detalle
        </button>
      </div>
      {loading && (
        <div className="table-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 32 }}>
          <Loader size={20} className="spin" />
          <span style={{ color: "var(--muted)" }}>Cargando datos del socio...</span>
        </div>
      )}
      {fetchError && (
        <div className="table-card" style={{ padding: 20, color: "var(--danger, #dc3545)" }}>
          {fetchError}
        </div>
      )}

      {!loading && !fetchError && (
      <div className="new-member-layout">
        <div className="new-member-form-section">
          <MemberForm
            isEditing={isEditing}
            saving={saving}
            saveError={saveError}
            deleting={deleting}
            showConfirmDelete={showConfirmDelete}
            onShowConfirmDeleteChange={setShowConfirmDelete}
            onSave={handleSave}
            onDelete={handleDelete}
            onCancel={() => { reset(); navigate(-1); }}
          />
        </div>

        <div className="new-member-sidebar">
          <ApoderadoSection
            title="Apoderado 1"
            apoderado={apoderado1}
            searchValue={ap1Search}
            onSearchChange={setAp1Search}
            visible={ap1Visible}
            onVisibleChange={setAp1Visible}
            onSelect={(p) => setApoderado1(p)}
            onRemove={() => setApoderado1(null)}
          />
          <ApoderadoSection
            title="Apoderado 2"
            apoderado={apoderado2}
            searchValue={ap2Search}
            onSearchChange={setAp2Search}
            visible={ap2Visible}
            onVisibleChange={setAp2Visible}
            onSelect={(p) => setApoderado2(p)}
            onRemove={() => setApoderado2(null)}
          />
        </div>
      </div>
      )}
    </div>
  );
};

export default NewMember;
