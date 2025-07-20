
"use client";

import type { User } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDataContext } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ResetPasswordFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
}

export function ResetPasswordForm({ isOpen, setIsOpen, user }: ResetPasswordFormProps) {
  const { updateUser } = useDataContext();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    if (user) {
        try {
            await updateUser({ ...user, password: data.password });
            toast({ title: 'Success', description: 'Password has been reset successfully.' });
            setIsOpen(false);
            reset();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) reset(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for {user?.username}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => {setIsOpen(false); reset();}}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">Set New Password</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
