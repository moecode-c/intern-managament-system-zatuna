import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Activities from "./pages/Activities.jsx";
import Applications from "./pages/Applications.jsx";
import Apply from "./pages/Apply.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Home from "./pages/Home.jsx";
import Interns from "./pages/Interns.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import Register from "./pages/Register.jsx";
import Tasks from "./pages/Tasks.jsx";
import InternProfile from "./pages/InternProfile.jsx"

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route index element={<Home />} />
        <Route path="apply" element={<Apply />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Any signed-in user */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="activities"
          element={
            <ProtectedRoute>
              <Activities />
            </ProtectedRoute>
          }
        />

        {/* Staff only */}
        <Route
          path="applications"
          element={
            <ProtectedRoute roles={["admin", "mentor"]}>
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="interns"
          element={
            <ProtectedRoute roles={["admin", "mentor"]}>
              <Interns />
            </ProtectedRoute>
          }
        />
        <Route
          path="interns/:id"
          element={
            <ProtectedRoute roles={["admin", "mentor"]}>
              <InternProfile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
