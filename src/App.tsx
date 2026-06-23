import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout';
import { AdminLayout } from './pages/admin/AdminLayout';
import { Home } from './pages/Home';
import { CategoryDetail } from './pages/CategoryDetail';
import { PaymentRedirect } from './pages/PaymentRedirect';
import { Confirmation } from './pages/Confirmation';
import { Leaderboard } from './pages/Leaderboard';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminOverview } from './pages/admin/Overview';
import { AdminTransactions } from './pages/admin/Transactions';
import { AdminCategories } from './pages/admin/Categories';
import { AdminSettings } from './pages/admin/Settings';
import { AdminUsers } from './pages/admin/Users';
import { AdminExport } from './pages/admin/Export';
import { AdminActionLog } from './pages/admin/ActionLog';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="category/:id" element={<CategoryDetail />} />
        <Route path="category/:id/payment" element={<PaymentRedirect />} />
        <Route path="confirmation" element={<Confirmation />} />
        <Route path="leaderboard" element={<Leaderboard />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="leaderboard" element={<Leaderboard adminView />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="export" element={<AdminExport />} />
        <Route path="action-log" element={<AdminActionLog />} />
      </Route>
    </Routes>
  );
}

export default App;
