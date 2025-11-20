import UserProfilePage from "@/components/features/UserProfilePage";

export default function AdminProfilePage() {
  return (
    <UserProfilePage 
      userType="admin" 
      dashboardPath="/admin" 
      pageTitle="Admin Profile" 
    />
  );
}
