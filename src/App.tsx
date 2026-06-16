import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import "./styles/variables.css";
import Layout from "./components/Layout/Layout";
import DashboardPage from "./pages/Dashboard/Dashboard";
import Treasury from "./pages/Treasury/Treasury";
import NewPayment from "./pages/Treasury/NewPayment/NewPayment";
import Movements from "./pages/Treasury/Movements/Movements";
import Incomes from "./pages/Treasury/Incomes/Incomes";
import Expenses from "./pages/Treasury/Expenses/Expenses";
import Members from "./pages/Members/Members";
import MemberDetails from "./pages/Members/MemberDetails";
import NewMember from "./pages/Members/NewMember/NewMember";

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tesoreria" element={<Treasury />} />
          <Route path="tesoreria/movimientos" element={<Movements />} />
          <Route path="tesoreria/ingresos" element={<Incomes />} />
          <Route path="tesoreria/egresos" element={<Expenses />} />
          <Route
            path="tesoreria/ingresos/nuevo-pago"
            element={<NewPayment />}
          />
          <Route path="socios" element={<Members />} />
          <Route path="socios/nuevo" element={<NewMember />} />
          <Route path="socios/:id" element={<MemberDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
