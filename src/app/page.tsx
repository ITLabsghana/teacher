
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/login-form';
import { DataProvider, useDataContext } from '@/context/data-context';

function HomePageContent() {
  const { currentUser, isLoading } = useDataContext();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if user is logged in and the initial load is complete
    if (!isLoading && currentUser) {
      router.replace('/dashboard');
    }
  }, [currentUser, isLoading, router]);

  // Don't render the login form until we're sure the user isn't logged in
  if (isLoading || currentUser) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <DataProvider>
      <HomePageContent />
    </DataProvider>
  );
}
