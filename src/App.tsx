import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import "./styles/variables.css";
import Layout from "./components/Layout/Layout";
import DashboardPage from "./pages/Dashboard/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
