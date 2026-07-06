-- Shared no-signup public project: /svg/free/... counts per page_id.
-- The Go layer scans nullable text columns into plain strings, so every
-- text column must be non-NULL here.
INSERT INTO projects (
    id, user_id, external_project_id, tenant_id, slug, name, description,
    status, visibility, public_token_hash, default_theme, default_locale,
    render_enabled, badge_enabled, widget_enabled
)
VALUES (
    'free', '', 'free', 'free', 'free', 'Free Public Node',
    'Shared public project for no-signup visitor badges',
    'active', 'public', '', '', '',
    TRUE, TRUE, TRUE
)
ON CONFLICT DO NOTHING;
