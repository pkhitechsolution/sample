import React from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import LoginPage from "./pages/auth/LoginPage";

import AccountsListPage from "./pages/accounts/AccountsListPage";
import AccountsFormPage from "./pages/accounts/AccountsFormPage";

import TalentRegistryListPage from "./pages/talent-registry/TalentRegistryListPage";
import TalentRegistryFormPage from "./pages/talent-registry/TalentRegistryFormPage";

import TeamsListPage from "./pages/teams/TeamsListPage";
import TeamsFormPage from "./pages/teams/TeamsFormPage";

import TournamentsListPage from "./pages/tournaments/TournamentsListPage";
import TournamentFormPage from "./pages/tournaments/TournamentFormPage";
import TournamentDetailPage from "./pages/tournaments/TournamentDetailPage";
import TournamentFixturesPage from "./pages/tournaments/TournamentFixturesPage";

import MatchesListPage from "./pages/matches/MatchesListPage";
import MatchesFormPage from "./pages/matches/MatchesFormPage";

import OfficialsListPage from "./pages/officials/OfficialsListPage";
import OfficialsFormPage from "./pages/officials/OfficialsFormPage";

import CommunicationsListPage from "./pages/communications/CommunicationsListPage";
import CommunicationsFormPage from "./pages/communications/CommunicationsFormPage";

import MediaListPage from "./pages/media/MediaListPage";
import MediaFormPage from "./pages/media/MediaFormPage";

import InventoryListPage from "./pages/inventory/InventoryListPage";
import InventoryFormPage from "./pages/inventory/InventoryFormPage";

import PerformanceListPage from "./pages/performance/PerformanceListPage";
import PerformanceFormPage from "./pages/performance/PerformanceFormPage";

import GrantsListPage from "./pages/grants/GrantsListPage";
import GrantsFormPage from "./pages/grants/GrantsFormPage";

import ReportsListPage from "./pages/reports/ReportsListPage";
import ReportsFormPage from "./pages/reports/ReportsFormPage";

import NotFound from "./pages/NotFound";

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },

          { path: "accounts", element: <AccountsListPage /> },
          { path: "accounts/add", element: <AccountsFormPage /> },
          { path: "accounts/edit/:id", element: <AccountsFormPage /> },

          { path: "talent-registry", element: <TalentRegistryListPage /> },
          { path: "talent-registry/add", element: <TalentRegistryFormPage /> },
          { path: "talent-registry/edit/:id", element: <TalentRegistryFormPage /> },

          { path: "teams", element: <TeamsListPage /> },
          { path: "teams/add", element: <TeamsFormPage /> },
          { path: "teams/edit/:id", element: <TeamsFormPage /> },

          { path: "tournaments", element: <TournamentsListPage /> },
          { path: "tournaments/add", element: <TournamentFormPage /> },
          { path: "tournaments/edit/:id", element: <TournamentFormPage /> },
          { path: "tournaments/:id", element: <TournamentDetailPage /> },
          { path: "tournaments/:id/fixtures", element: <TournamentFixturesPage /> },

          { path: "matches", element: <MatchesListPage /> },
          { path: "matches/add", element: <MatchesFormPage /> },
          { path: "matches/edit/:id", element: <MatchesFormPage /> },

          { path: "officials", element: <OfficialsListPage /> },
          { path: "officials/add", element: <OfficialsFormPage /> },
          { path: "officials/edit/:id", element: <OfficialsFormPage /> },

          { path: "communications", element: <CommunicationsListPage /> },
          { path: "communications/add", element: <CommunicationsFormPage /> },
          { path: "communications/edit/:id", element: <CommunicationsFormPage /> },

          { path: "media", element: <MediaListPage /> },
          { path: "media/add", element: <MediaFormPage /> },
          { path: "media/edit/:id", element: <MediaFormPage /> },

          { path: "inventory", element: <InventoryListPage /> },
          { path: "inventory/add", element: <InventoryFormPage /> },
          { path: "inventory/edit/:id", element: <InventoryFormPage /> },

          { path: "performance", element: <PerformanceListPage /> },
          { path: "performance/add", element: <PerformanceFormPage /> },
          { path: "performance/edit/:id", element: <PerformanceFormPage /> },

          { path: "grants", element: <GrantsListPage /> },
          { path: "grants/add", element: <GrantsFormPage /> },
          { path: "grants/edit/:id", element: <GrantsFormPage /> },

          { path: "reports", element: <ReportsListPage /> },
          { path: "reports/add", element: <ReportsFormPage /> },
          { path: "reports/edit/:id", element: <ReportsFormPage /> },

          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;