
"use client";

import { useEffect, useMemo } from 'react';
import type { User } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataContext } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';

const allUserRoles: User['role'][] = ['Admin', 'Supervisor', 'Viewer'];

const userSchema = z.object({
  username: z.string().min(2, "Username is too short"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(allUserRoles, { required_error: "Role is required" }),
});

// For editing, password is not required
const editUserSchema = userSchema.omit({ password: true }).extend({
    password: z.string().optional()
});


type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingUser: User | null;
  currentUser: User | null;
}

export function UserForm({ isOpen, setIsOpen, editingUser, currentUser }: UserFormProps) {
  const { addUser, updateUser } = useDataContext();
  const { toast } = useToast();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(editingUser ? editUserSchema : userSchema),
  });

  const availableRoles = useMemo(() => {
    if (currentUser?.role === 'Supervisor') {
      return allUserRoles.filter(role => role !== 'Admin');
    }
    return allUserRoles;
  }, [currentUser]);


  useEffect(() => {
    if (isOpen) {
        if (editingUser) {
            reset(editingUser);
        } else {
            reset({ username: '', email: '', password: '', role: undefined });
        }
    }
  }, [editingUser, isOpen, reset]);

  const onSubmit = async (data: UserFormData) => {
    try {
        if (editingUser) {
            const { password, ...updateData } = data; // Exclude password from general update
            await updateUser({ ...editingUser, ...updateData });
            toast({ title: 'Success', description: 'User updated successfully.' });
        } else {
            await addUser(data);
            toast({ title: 'Success', description: 'New user added.' });
        }
        setIsOpen(false);
    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {editingUser ? "Update the user's details. Password can be changed via 'Reset Password'." : "Fill in the details for the new user."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" {...register('username')} />
            {errors.username && <p className="text-destructive text-xs mt-1">{errors.username.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>
          {!editingUser && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>
          )}
          <div>
            <Label>Role</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-destructive text-xs mt-1">{errors.role.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">{editingUser ? 'Save Changes' : 'Add User'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
