import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/_core/hooks/useAuth';

export type Role = 'master' | 'admin' | 'user';

export interface Permissions {
    pages: { read: boolean; write: boolean };
    ab_tests: { read: boolean; write: boolean };
    metas: { read: boolean; write: boolean };
    configuracoes: { read: boolean; write: boolean };
}

export interface UserRole {
    id: string;
    email: string;
    role: Role;
    permissions: Permissions;
}

const DEFAULT_PERMISSIONS: Permissions = {
    pages: { read: false, write: false },
    ab_tests: { read: false, write: false },
    metas: { read: false, write: false },
    configuracoes: { read: false, write: false },
};

export function useUserRole() {
    const { user, isAuthenticated } = useAuth();
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || !user?.email) {
            setUserRole(null);
            setLoading(false);
            return;
        }

        fetchUserRole(user.email);
    }, [isAuthenticated, user?.email]);

    async function fetchUserRole(email: string) {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('*')
                .eq('email', email)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching user role:', error);
            }

            if (data) {
                setUserRole(data as UserRole);
            } else {
                // Default to 'user' role with no permissions if not in table
                setUserRole({
                    id: '',
                    email,
                    role: 'user',
                    permissions: DEFAULT_PERMISSIONS,
                });
            }
        } catch (e) {
            console.error('Error in fetchUserRole:', e);
        } finally {
            setLoading(false);
        }
    }

    // Check if user has permission for a feature
    const hasPermission = useCallback((feature: keyof Permissions, action: 'read' | 'write'): boolean => {
        if (!userRole) return false;

        // Master has all permissions
        if (userRole.role === 'master') return true;

        // Admin uses configurable permissions
        if (userRole.role === 'admin') {
            return userRole.permissions[feature]?.[action] ?? false;
        }

        // User role has no admin permissions
        return false;
    }, [userRole]);

    // Check if user can access admin section at all
    const canAccessAdmin = useCallback((): boolean => {
        if (!userRole) return false;
        if (userRole.role === 'master') return true;
        if (userRole.role === 'admin') {
            // Admin can access if they have at least one read permission
            return Object.values(userRole.permissions).some(p => p.read);
        }
        return false;
    }, [userRole]);

    // Check if user is master
    const isMaster = userRole?.role === 'master';

    return {
        userRole,
        loading,
        hasPermission,
        canAccessAdmin,
        isMaster,
        refetch: () => user?.email && fetchUserRole(user.email),
    };
}
