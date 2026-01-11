-- ============================================
-- User Roles Table for RBAC
-- ============================================

-- Roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('master', 'admin', 'user')),
    permissions JSONB DEFAULT '{
        "pages": {"read": false, "write": false},
        "ab_tests": {"read": false, "write": false},
        "metas": {"read": false, "write": false},
        "configuracoes": {"read": false, "write": false}
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Masters can manage all roles
CREATE POLICY "Masters can manage all roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND ur.role = 'master'
        )
    );

-- Users can view their own role
CREATE POLICY "Users can view own role" ON user_roles
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Insert initial master user
INSERT INTO user_roles (email, role, permissions)
VALUES (
    'ianfrancio@douravita.com.br',
    'master',
    '{
        "pages": {"read": true, "write": true},
        "ab_tests": {"read": true, "write": true},
        "metas": {"read": true, "write": true},
        "configuracoes": {"read": true, "write": true}
    }'::jsonb
) ON CONFLICT (email) DO UPDATE SET role = 'master';

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
