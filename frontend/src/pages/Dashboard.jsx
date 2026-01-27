import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountCard from "@/components/AccountCard";
import AddAccountModal from "@/components/AddAccountModal";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/accounts`);
      setAccounts(response.data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddAccount = async (name, webhookUrl) => {
    try {
      await axios.post(`${API}/accounts`, {
        name,
        webhook_url: webhookUrl || null,
      });
      toast.success("Account created successfully");
      fetchAccounts();
      setShowAddModal(false);
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Failed to create account");
    }
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      await axios.delete(`${API}/accounts/${accountId}`);
      toast.success("Account deleted successfully");
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  };

  const handleUpdateWebhook = async (accountId, webhookUrl) => {
    try {
      await axios.put(`${API}/accounts/${accountId}/webhook`, {
        webhook_url: webhookUrl,
      });
      toast.success("Webhook updated successfully");
      fetchAccounts();
    } catch (error) {
      console.error("Error updating webhook:", error);
      toast.error("Failed to update webhook");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] dark">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="px-6 md:px-8 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-xl font-bold text-white">W</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              WhatsApp Monitor
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="add-account-button"
              onClick={() => setShowAddModal(true)}
              className="bg-accent hover:bg-accent/90 text-white font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
            <Button
              data-testid="logout-button"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 md:px-8 lg:px-12 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 rounded-xl bg-card border border-border animate-pulse"
              />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState onAddAccount={() => setShowAddModal(true)} />
        ) : (
          <div
            data-testid="accounts-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onDelete={handleDeleteAccount}
                onUpdateWebhook={handleUpdateWebhook}
              />
            ))}
          </div>
        )}
      </main>

      <AddAccountModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAccount}
      />
    </div>
  );
};

export default Dashboard;
