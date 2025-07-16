import LoginForm from '@/components/auth/login-form';
import { DataProvider } from '@/context/data-context';

export default function Home() {
  return (
    <DataProvider>
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </main>
    </DataProvider>
  );
}
