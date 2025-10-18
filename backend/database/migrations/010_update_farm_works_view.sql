-- Migration: Update v_farm_works_detailed view to include work status information
-- Generated: 2024-01-XX

USE land_management;

-- Drop and recreate the view with work status information
DROP VIEW IF EXISTS v_farm_works_detailed;

CREATE VIEW v_farm_works_detailed AS
SELECT 
    fw.id,
    fw.title,
    fw.description,
    fw.land_id,
    l.land_name,
    l.land_code,
    fw.work_type_id,
    wt.name as work_type_name,
    wt.icon as work_type_icon,
    wc.id as category_id,
    wc.name as category_name,
    wc.color as category_color,
    wc.icon as category_icon,
    fw.priority_level,
    fw.status,  -- Keep for backward compatibility
    fw.work_status_id,
    ws.name as status_name,
    ws.display_name as status_display_name,
    ws.color as status_color,
    ws.icon as status_icon,
    ws.is_final as status_is_final,
    fw.creator_user_id,
    CONCAT(creator.first_name, ' ', creator.last_name) as creator_name,
    fw.assigner_user_id,
    CONCAT(assigner.first_name, ' ', assigner.last_name) as assigner_name,
    fw.assigned_team_id,
    t.name as assigned_team_name,
    fw.assigned_date,
    fw.due_date,
    fw.started_date,
    fw.completed_date,
    fw.created_at,
    fw.updated_at,
    CASE 
        WHEN fw.due_date IS NULL THEN NULL
        WHEN fw.due_date < NOW() AND COALESCE(ws.is_final, 0) = 0 THEN 'overdue'
        WHEN fw.due_date <= DATE_ADD(NOW(), INTERVAL 1 DAY) AND COALESCE(ws.is_final, 0) = 0 THEN 'due_soon'
        ELSE 'on_time'
    END as due_status
FROM farm_works fw
LEFT JOIN lands l ON fw.land_id = l.id
LEFT JOIN work_types wt ON fw.work_type_id = wt.id
LEFT JOIN work_categories wc ON wt.category_id = wc.id
LEFT JOIN work_statuses ws ON fw.work_status_id = ws.id
LEFT JOIN users creator ON fw.creator_user_id = creator.id
LEFT JOIN users assigner ON fw.assigner_user_id = assigner.id
LEFT JOIN teams t ON fw.assigned_team_id = t.id;

-- Migration complete
SELECT 'v_farm_works_detailed view updated successfully' as status;






