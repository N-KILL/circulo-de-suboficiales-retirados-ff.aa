import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import "./styles/variables.css";
import Layout from "./components/Layout/Layout";
import Welcome from "./pages/Welcome/Welcome";
import DashboardPage from "./pages/Dashboard/Dashboard";
import Movements from "./pages/Treasury/Movements/Movements";
import Treasury from "./pages/Treasury/NewMovement/NewMovement";
import NewPayment from "./pages/Treasury/NewPayment/NewPayment";
import NewExpense from "./pages/Treasury/NewExpense/NewExpense";
import Members from "./pages/Members/Members";
import MemberDetails from "./pages/Members/MemberDetails";
import NewMember from "./pages/Members/NewMember/NewMember";
import Persons from "./pages/Persons/Persons";
import NewPerson from "./pages/Persons/NewPerson/NewPerson";
import Config from "./pages/Config/Config";

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Welcome />} />
          <Route path="tesoreria/movimientos" element={<Movements />} />
          <Route path="tesoreria/nuevo-movimiento" element={<Treasury />} />
          <Route path="tesoreria/ingresos/nuevo-pago" element={<NewPayment />} />
          <Route path="tesoreria/egresos/nuevo-egreso" element={<NewExpense />} />
          <Route path="tesoreria/dashboard" element={<DashboardPage />} />
          <Route path="socios" element={<Members />} />
          <Route path="socios/nuevo" element={<NewMember />} />
          <Route path="socios/editar/:id" element={<NewMember />} />
          <Route path="socios/:id" element={<MemberDetails />} />
          <Route path="personas" element={<Persons />} />
          <Route path="personas/nuevo" element={<NewPerson />} />
          <Route path="personas/editar/:id" element={<NewPerson />} />
          <Route path="configuracion" element={<Config />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
