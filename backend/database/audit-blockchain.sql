-- Tabla de Blockchain Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_index SERIAL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Datos del evento
    event_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    
    -- Usuario que realizó la acción
    user_id VARCHAR(255),
    user_role VARCHAR(50),
    user_ip VARCHAR(45),
    
    -- Datos adicionales
    action_details JSONB,
    
    -- Blockchain fields
    previous_hash VARCHAR(64),
    current_hash VARCHAR(64) NOT NULL,
    nonce INTEGER DEFAULT 0,
    
    -- Verificación
    is_valid BOOLEAN DEFAULT true,
    
    UNIQUE(block_index)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);

-- Función para prevenir modificaciones
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

-- Trigger para hacer la tabla inmutable
CREATE TRIGGER audit_immutable_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER audit_immutable_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();