import UserProfilePage from "@/components/features/UserProfilePage";

export default function CashierProfilePage() {
  return (
    <UserProfilePage 
      userType="cashier" 
      dashboardPath="/pos" 
      pageTitle="Cashier Profile"
    />
  );
}