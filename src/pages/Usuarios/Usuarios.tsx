import React, { useEffect, useState } from "react";
import { Loader, Shield, Trash2, Edit2, Save, X } from "lucide-react";
import { useAuthStore, type AppRole } from "../../store/authStore";
import "./Usuarios.css";

type AppUser = {
    id: string;
    auth_user_id: string;
    email: string;
    name: string | null;
    role: AppRole;
    created_at: string;
    updated_at: string;
};

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
    { value: "secretario", label: "Secretario/a" },
    { value: "admin", label: "Administrador" },
];

const ROLE_LABELS: Record<string, string> = {
    owner: "Propietario",
    admin: "Administrador",
    secretario: "Secretario/a",
};

const Usuarios: React.FC = () => {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<AppRole>("secretario");

    const isOwner = currentUser?.role === "owner";

    useEffect(() => {
        void (async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/users");
                if (res.ok) {
                    setUsers(await res.json());
                }
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleRoleChange = async (authUserId: string, newRole: AppRole) => {
        try {
            const res = await fetch("/api/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ auth_user_id: authUserId, role: newRole }),
            });
            if (res.ok) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u.auth_user_id === authUserId ? { ...u, role: newRole } : u
                    )
                );
                setEditingId(null);
            }
        } catch {
            // silent
        }
    };

    const handleDelete = async (authUserId: string) => {
        if (!window.confirm("¿Eliminar este usuario del sistema?")) return;
        try {
            const res = await fetch(`/api/users?auth_user_id=${encodeURIComponent(authUserId)}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setUsers((prev) => prev.filter((u) => u.auth_user_id !== authUserId));
            }
        } catch {
            // silent
        }
    };

    if (loading) {
        return (
            <div className="usuarios-page">
                <div className="usuarios-loading">
                    <Loader size={28} className="spin" style={{ color: "var(--azul-armada)" }} />
                    <span>Cargando usuarios...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="usuarios-page">
            <div className="usuarios-header">
                <Shield size={28} style={{ color: "var(--azul-armada)" }} />
                <h1>Gestion de Usuarios</h1>
            </div>

            <div className="usuarios-table-wrapper">
                <table className="usuarios-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Creado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.auth_user_id} className={u.auth_user_id === currentUser?.id ? "usuarios-self" : ""}>
                                <td>{u.name || "-"}</td>
                                <td>{u.email}</td>
                                <td>
                                    {editingId === u.auth_user_id ? (
                                        <select
                                            className="usuarios-role-select"
                                            value={editRole}
                                            onChange={(e) => setEditRole(e.target.value as AppRole)}
                                        >
                                            {ROLE_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={`usuarios-badge usuarios-badge-${u.role}`}>
                                            {ROLE_LABELS[u.role] ?? u.role}
                                        </span>
                                    )}
                                </td>
                                <td>{new Date(u.created_at).toLocaleDateString("es-AR")}</td>
                                <td className="usuarios-actions">
                                    {editingId === u.auth_user_id ? (
                                        <>
                                            <button
                                                className="usuarios-icon-btn usuarios-save"
                                                onClick={() => handleRoleChange(u.auth_user_id, editRole)}
                                                title="Guardar"
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                className="usuarios-icon-btn usuarios-cancel"
                                                onClick={() => setEditingId(null)}
                                                title="Cancelar"
                                            >
                                                <X size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="usuarios-icon-btn usuarios-edit"
                                                onClick={() => {
                                                    setEditingId(u.auth_user_id);
                                                    setEditRole(u.role);
                                                }}
                                                title="Editar rol"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            {isOwner && u.auth_user_id !== currentUser?.id && (
                                                <button
                                                    className="usuarios-icon-btn usuarios-delete"
                                                    onClick={() => handleDelete(u.auth_user_id)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="usuarios-empty">
                                    No hay usuarios registrados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Usuarios;
