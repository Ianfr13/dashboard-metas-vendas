import { useUserRoleContext } from '@/contexts/UserRoleContext';
export type { Role, Permissions, UserRole } from '@/contexts/UserRoleContext';

export function useUserRole() {
    return useUserRoleContext();
}
