"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { School } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, you'd have authentication logic here.
    // For this UI-focused demo, we'll just redirect.
    router.push('/dashboard');
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <School className="h-8 w-8" />
        </div>
        <CardTitle className="font-headline text-3xl">Teacher Management</CardTitle>
        <CardDescription>Admin Login</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="admin@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full !mt-8 bg-accent hover:bg-accent/90">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
