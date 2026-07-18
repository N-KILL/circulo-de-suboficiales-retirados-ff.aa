import React from "react";
import { Save, Loader, Trash2 } from "lucide-react";
import { useMembersStore } from "../../../store/membersStore";
import type { MembersState, Member } from "../../../models/members";
import DateInput from "../../../components/ui/DateInput";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export interface MemberFormProps {
  isEditing: boolean;
  saving: boolean;
  saveError: string | null;
  deleting: boolean;
  showConfirmDelete: boolean;
  onShowConfirmDeleteChange: (v: boolean) => void;
  onSave: (e?: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({
  isEditing,
  saving,
  saveError,
  deleting,
  showConfirmDelete,
  onShowConfirmDeleteChange,
  onSave,
  onDelete,
  onCancel,
}) => {
  const form = useMembersStore((s: MembersState) => s.form);
  const setField = useMembersStore((s: MembersState) => s.setField);

  const handleChange = (key: keyof Member, value: Member[keyof Member]) => setField(key, value);

  return (
    <form onSubmit={onSave} className="card-custom">
      <div className="form-grid">
        <div className="form-group full-width">
          <label>Nombre y Apellido</label>
          <input
            className="form-control"
            value={form.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
          />
        </div>
      </div>

      <div className="form-grid form-grid-4">
        <div className="form-group">
          <label>N°</label>
          <input
            className="form-control"
            value={form.numeroDeSocio}
            onChange={(e) => handleChange("numeroDeSocio", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Sexo</label>
          <select
            className="form-control"
            value={form.sexo}
            onChange={(e) => handleChange("sexo", e.target.value)}
          >
            <option value="">-</option>
            <option>Masculino</option>
            <option>Femenino</option>
            <option>Otro</option>
          </select>
        </div>

        <div className="form-group">
          <label>N° de familia</label>
          <input
            className="form-control"
            value={form.nroFamilia}
            onChange={(e) => handleChange("nroFamilia", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>N° de Fam. A/Fall</label>
          <input
            className="form-control"
            value={form.nroFamAFall}
            onChange={(e) => handleChange("nroFamAFall", e.target.value)}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Tipo de Documento</label>
          <select
            className="form-control"
            value={form.tipoDoc}
            onChange={(e) => handleChange("tipoDoc", e.target.value)}
          >
            <option>DNI</option>
            <option>LE</option>
            <option>LC</option>
            <option>Pasaporte</option>
          </select>
        </div>

        <div className="form-group">
          <label>Documento</label>
          <input
            className="form-control"
            value={form.documento}
            onChange={(e) => handleChange("documento", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>N° de Cuil</label>
          <input
            className="form-control"
            value={form.cuil}
            onChange={(e) => handleChange("cuil", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Tipo de Socio</label>
          <select
            className="form-control"
            value={form.tipoSocio}
            onChange={(e) => handleChange("tipoSocio", e.target.value)}
          >
            <option value="">-</option>
            <option>Activo</option>
            <option>Activo Tipo A</option>
            <option>Adherente</option>
            <option>Honorario</option>
            <option>Part</option>
            <option>Vitalicio</option>
          </select>
        </div>

        <DateInput
          id="fecha-nac"
          label="Fecha Nacimiento"
          value={form.fechaNac}
          onChange={(v) => handleChange("fechaNac", v)}
        />

        <div className="form-group">
          <label>Cod. Postal</label>
          <input
            className="form-control"
            value={form.codPostal}
            onChange={(e) => handleChange("codPostal", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Localidad</label>
          <input
            className="form-control"
            value={form.localidad}
            onChange={(e) => handleChange("localidad", e.target.value)}
          />
        </div>

        <div className="form-group full-width">
          <label>Domicilio</label>
          <input
            className="form-control"
            value={form.domicilio}
            onChange={(e) => handleChange("domicilio", e.target.value)}
          />
        </div>

        <div className="form-group full-width">
          <label>Residencia</label>
          <input
            className="form-control"
            value={form.residencia}
            onChange={(e) => handleChange("residencia", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Teléfono</label>
          <input
            className="form-control"
            value={form.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
          />
        </div>
      </div>

      <div className="form-grid">
        <DateInput
          id="fecha-ingreso"
          label="Fecha de ingreso"
          value={form.fechaIngreso}
          onChange={(v) => handleChange("fechaIngreso", v)}
        />

        <div className="form-group">
          <label>Cobra IAF</label>
          <select
            className="form-control"
            value={form.cobraIAF}
            onChange={(e) => handleChange("cobraIAF", e.target.value)}
          >
            <option>No</option>
            <option>Si</option>
          </select>
        </div>

        <div className="form-group">
          <label>Paga por</label>
          <input
            className="form-control"
            value={form.pagaPor}
            onChange={(e) => handleChange("pagaPor", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Depositar en</label>
          <input
            className="form-control"
            value={form.depositarEn}
            onChange={(e) => handleChange("depositarEn", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Cementerio</label>
          <input
            className="form-control"
            value={form.cementerio}
            onChange={(e) => handleChange("cementerio", e.target.value)}
          />
        </div>
      </div>

      <div className="optional-section">
        <h4 className="section-title">Opcionales</h4>
        <div className="checkbox-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-control-checkbox"
              checked={form.planSalud}
              onChange={(e) => handleChange("planSalud", e.target.checked)}
            />
            Plan Salud (INT)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-control-checkbox"
              checked={form.asistencial}
              onChange={(e) => handleChange("asistencial", e.target.checked)}
            />
            Asistencial
          </label>
        </div>
      </div>

      <div className="military-section-toggle">
        <h4 className="section-title">Solo para militares</h4>
        <label className="checkbox-label">
          <input
            type="checkbox"
            className="form-control-checkbox"
            checked={form.militar}
            onChange={(e) => handleChange("militar", e.target.checked)}
          />
          Militar
        </label>
      </div>

      {form.militar && (
        <div className="form-grid">
          <div className="form-group">
            <label>Fuerza</label>
            <input
              className="form-control"
              value={form.fuerza}
              onChange={(e) => handleChange("fuerza", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Grado</label>
            <input
              className="form-control"
              value={form.grado}
              onChange={(e) => handleChange("grado", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select
              className="form-control"
              value={form.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
            >
              <option value="">-</option>
              <option>En servicio</option>
              <option>Retirado</option>
              <option>Baja</option>
              <option>Pensionado</option>
            </select>
          </div>
        </div>
      )}

      {saveError && (
        <div className="form-error">{saveError}</div>
      )}
      <div className="form-actions-panel">
        {isEditing && (
          <button
            type="button"
            className="btn-delete"
            disabled={saving}
            onClick={() => onShowConfirmDeleteChange(true)}
          >
            <Trash2 size={16} /> Eliminar
          </button>
        )}
        <button
          type="button"
          className="btn-cancel"
          disabled={saving}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button type="submit" className="btn-save" disabled={saving}>
          {saving ? (
            <><Loader size={16} className="spin" /> Guardando...</>
          ) : (
            <><Save size={16} /> {isEditing ? "Actualizar" : "Guardar"}</>
          )}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Eliminar socio"
        message={`¿Estás seguro de que querés eliminar al socio <strong>${form.nombre}</strong> (N° ${form.numeroDeSocio})?`}
        warning="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => onShowConfirmDeleteChange(false)}
      />
    </form>
  );
};

export default MemberForm;
