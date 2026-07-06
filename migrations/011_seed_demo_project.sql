-- The Go layer scans nullable text columns into plain strings, so every
-- text column must be non-NULL here.
INSERT INTO projects (
    id, user_id, external_project_id, tenant_id, slug, name, description,
    status, visibility, public_token_hash, default_theme, default_locale,
    render_enabled, badge_enabled, widget_enabled
)
VALUES (
    'demo', '', 'demo', 'demo', 'demo', 'Demo Project',
    'Public demo project backing the homepage live examples',
    'active', 'public', '', '', '',
    TRUE, TRUE, TRUE
)
ON CONFLICT DO NOTHING;
