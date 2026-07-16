import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import "./styles/variables.css";
import Layout from "./components/Layout/Layout";
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
import Calendario from "./pages/Calendario/Calendario";
import Reportes from "./pages/Reportes/Reportes";

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Welcome />} />
          <Route path="tesoreria/movimientos" element={<Movements />} />
          <Route path="tesoreria/movimientos/detalle/:id" element={<MovementDetail />} />
          <Route path="tesoreria/nuevo-movimiento" element={<NewMovement />} />
          <Route path="tesoreria/nuevo-movimiento/:id" element={<NewMovement />} />

          <Route path="tesoreria/egresos/nuevo-egreso" element={<NewExpense />} />
          <Route path="tesoreria/dashboard" element={<DashboardPage />} />
          <Route path="tesoreria/cementerio" element={<Cementerio />} />
          <Route path="tesoreria/cementerio/:nicho" element={<CementerioDetalle />} />
          <Route path="tesoreria/historial-servicios" element={<ServiceHistory />} />
          <Route path="socios" element={<Members />} />
          <Route path="socios/nuevo" element={<NewMember />} />
          <Route path="socios/editar/:id" element={<NewMember />} />
          <Route path="socios/detalle/:id" element={<DetalleSocio />} />
          <Route path="personas" element={<Persons />} />
          <Route path="personas/nuevo" element={<NewPerson />} />
          <Route path="personas/editar/:id" element={<NewPerson />} />
          <Route path="personas/detalle/:id" element={<DetallePersona />} />
          <Route path="configuracion" element={<Config />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="calendario" element={<Calendario />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
