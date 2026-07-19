import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import "./styles/variables.css";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login/Login";
import Register from "./pages/Login/Register";
import Welcome from "./pages/Welcome/Welcome";
import DashboardPage from "./pages/Dashboard/Dashboard";
import Movements from "./pages/Treasury/Movements/Movements";
import MovementDetail from "./pages/Treasury/Movements/MovementDetail";
import NewMovement from "./pages/Treasury/NewMovement/NewMovement";

import NewExpense from "./pages/Treasury/NewExpense/NewExpense";
import Cementerio from "./pages/Treasury/Cementerio/Cementerio";
import CementerioDetalle from "./pages/Treasury/Cementerio/CementerioDetalle";
import ServiceHistory from "./pages/Treasury/ServiceHistory/ServiceHistory";
import Members from "./pages/Members/Members";
import NewMember from "./pages/Members/NewMember/NewMember";
import DetalleSocio from "./pages/Members/Detalle/Detalle";
import Persons from "./pages/Persons/Persons";
import DetallePersona from "./pages/Persons/Detalle/Detalle";
import NewPerson from "./pages/Persons/NewPerson/NewPerson";
import Config from "./pages/Config/Config";
import Variables from "./pages/Config/Variables";
import Calendario from "./pages/Calendario/Calendario";
import Reportes from "./pages/Reportes/Reportes";
import Usuarios from "./pages/Usuarios/Usuarios";

const OWNER_OR_ADMIN: Array<"owner" | "admin"> = ["owner", "admin"];

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Welcome />} />
          <Route path="tesoreria/dashboard" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="tesoreria/movimientos" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <Movements />
            </ProtectedRoute>
          } />
          <Route path="tesoreria/movimientos/detalle/:id" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <MovementDetail />
            </ProtectedRoute>
          } />
          <Route path="tesoreria/nuevo-movimiento" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <NewMovement />
            </ProtectedRoute>
          } />
          <Route path="tesoreria/nuevo-movimiento/:id" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <NewMovement />
            </ProtectedRoute>
          } />

          <Route path="tesoreria/egresos/nuevo-egreso" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <NewExpense />
            </ProtectedRoute>
          } />
          <Route path="tesoreria/cementerio" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <Cementerio />
            </ProtectedRoute>
          } />
          <Route path="tesoreria/cementerio/:nicho" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <CementerioDetalle />
            </ProtectedRoute>
          } />
          <Route path="tesoreria/historial-servicios" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <ServiceHistory />
            </ProtectedRoute>
          } />
          <Route path="socios" element={<Members />} />
          <Route path="socios/nuevo" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <NewMember />
            </ProtectedRoute>
          } />
          <Route path="socios/editar/:id" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <NewMember />
            </ProtectedRoute>
          } />
          <Route path="socios/detalle/:id" element={<DetalleSocio />} />
          <Route path="personas" element={<Persons />} />
          <Route path="personas/nuevo" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <NewPerson />
            </ProtectedRoute>
          } />
          <Route path="personas/editar/:id" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <NewPerson />
            </ProtectedRoute>
          } />
          <Route path="personas/detalle/:id" element={<DetallePersona />} />
          <Route path="configuracion" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <Config />
            </ProtectedRoute>
          } />
          <Route path="configuracion/variables" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <Variables />
            </ProtectedRoute>
          } />
          <Route path="reportes" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <Reportes />
            </ProtectedRoute>
          } />
          <Route path="calendario" element={<Calendario />} />
          <Route path="usuarios" element={
            <ProtectedRoute allowedRoles={OWNER_OR_ADMIN}>
              <Usuarios />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
