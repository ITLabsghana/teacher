
"use client";

import { useState, useMemo } from 'react';
import type { User } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Edit, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserForm } from './user-form';
import { ResetPasswordForm } from './reset-password-form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDataContext } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';

interface UsersTabProps {
  users: User[];
}

export default function UsersTab({ users: initialUsers }: UsersTabProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResetPasswordFormOpen, setIsResetPasswordFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const { currentUser, addUser, updateUser, deleteUser } = useDataContext();
  const { toast } = useToast();

  const handleAdd = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  
  const handleResetPassword = (user: User) => {
    setUserToResetPassword(user);
    setIsResetPasswordFormOpen(true);
  }

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ title: 'Success', description: 'User deleted successfully.' });
    } catch(err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleVariant = (role: User['role']): "default" | "secondary" | "outline" => {
    switch (role) {
      case 'Admin': return 'default';
      case 'Supervisor': return 'secondary';
      case 'Viewer': return 'outline';
    }
  };

  const visibleUsers = useMemo(() => {
    if (currentUser?.role === 'Supervisor') {
      return users.filter(user => user.role !== 'Admin');
    }
    return users;
  }, [users, currentUser]);
  
  const handleUserAction = (user: User) => {
    if(editingUser) {
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    } else {
        setUsers(prev => [user, ...prev]);
    }
    setIsFormOpen(false);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Add, edit, and manage application users.</CardDescription>
            </div>
            <Button size="sm" onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.length > 0 ? visibleUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.id === currentUser?.id}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive hover:!text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <UserForm 
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        editingUser={editingUser}
        currentUser={currentUser}
        onUserAction={handleUserAction}
      />
      <ResetPasswordForm
        isOpen={isResetPasswordFormOpen}
        setIsOpen={setIsResetPasswordFormOpen}
        user={userToResetPassword}
      />
    </>
  );
}
