// backend/src/modules/superadmin/backup.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface BackupInfo {
  filename: string;
  descripcion: string;
  fechaCreacion: string;
  tamanoBytes: number;
  tamanoLegible: string;
  tablas: number;
}

@Injectable()
export class BackupService {
  private readonly backupsDir = path.join(process.cwd(), 'backups');

  constructor(private readonly auditService: AuditService) {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async crearBackup(descripcion?: string, userId?: string): Promise<BackupInfo> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19);

    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(this.backupsDir, filename);

    const dbHost = process.env.DB_HOST || 'postgres';
    const dbPort = process.env.DB_PORT || '5432';
    const dbUser = process.env.DB_USER || 'hospital_admin';
    const dbName = process.env.DB_NAME || 'hospital_db';
    const dbPass = process.env.DB_PASSWORD || 'hospital_secure_2024';

    const cmd = `PGPASSWORD="${dbPass}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-owner --no-acl --inserts --on-conflict-do-nothing -f "${filepath}"`;

    try {
      await execAsync(cmd, { maxBuffer: 100 * 1024 * 1024 });
    } catch (error: any) {
      if (!fs.existsSync(filepath)) {
        throw new Error('Error ejecutando pg_dump: ' + error.message);
      }
    }

    if (!fs.existsSync(filepath)) {
      throw new Error('El archivo de backup no fue creado');
    }

    const stats = fs.statSync(filepath);
    const contenido = fs.readFileSync(filepath, 'utf8');
    const tablas = (contenido.match(/^CREATE TABLE/gm) || []).length;

    const meta: BackupInfo = {
      filename,
      descripcion: descripcion || 'Backup manual',
      fechaCreacion: new Date().toISOString(),
      tamanoBytes: stats.size,
      tamanoLegible: this.formatSize(stats.size),
      tablas,
    };

    const metaPath = filepath.replace('.sql', '.json');
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    await this.auditService.logEvent({
      eventType: 'CREATE',
      resourceType: 'USERS',
      resourceId: filename,
      userId: userId ?? 'SUPERADMIN',
      actionDetails: {
        action: 'BACKUP_CREADO',
        filename,
        descripcion: meta.descripcion,
        tamanoBytes: stats.size,
        tablas,
      },
    }).catch(() => {});

    return meta;
  }

  async listarBackups(): Promise<BackupInfo[]> {
    if (!fs.existsSync(this.backupsDir)) return [];

    const archivos = fs.readdirSync(this.backupsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .reverse();

    return archivos.map(filename => {
      const filepath = path.join(this.backupsDir, filename);
      const metaPath = filepath.replace('.sql', '.json');
      const stats = fs.statSync(filepath);

      if (fs.existsSync(metaPath)) {
        try {
          return JSON.parse(fs.readFileSync(metaPath, 'utf8')) as BackupInfo;
        } catch {}
      }

      return {
        filename,
        descripcion: 'Backup',
        fechaCreacion: stats.mtime.toISOString(),
        tamanoBytes: stats.size,
        tamanoLegible: this.formatSize(stats.size),
        tablas: 0,
      };
    });
  }

  async restaurarBackup(filename: string): Promise<{ success: boolean; mensaje: string }> {
    if (filename.includes("..") || filename.includes("/")) throw new Error("Nombre invalido");
    const filepath = path.join(this.backupsDir, filename);
    if (!fs.existsSync(filepath)) throw new NotFoundException("Backup no encontrado");
    const scriptPath = path.join(process.cwd(), "restore_all.sh");
    const dbPass = process.env.DB_PASSWORD || "hospital_secure_2024";
    const dbHost = process.env.DB_HOST || "hospital_db";
    const cmd = `sh ${scriptPath} ${filename}`;
    try {
      const { stdout } = await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });
      console.log("Restauracion completada:", stdout);
    } catch (e: any) {
      console.error("Error en restauracion:", e.message);
      throw new Error("Error al restaurar: " + e.message);
    }
    await this.auditService.logEvent({ eventType: "UPDATE", resourceType: "USERS",
      resourceId: filename, userId: "SUPERADMIN",
      actionDetails: { action: "BACKUP_RESTAURADO", filename },
    }).catch(() => {});
    return { success: true, mensaje: `Backup ${filename} restaurado correctamente` };
  }

  async eliminarBackup(filename: string): Promise<{ success: boolean }> {
    if (filename.includes('..') || filename.includes('/')) {
      throw new Error('Nombre de archivo invÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lido');
    }

    const filepath = path.join(this.backupsDir, filename);
    const metaPath = filepath.replace('.sql', '.json');

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Backup no encontrado');
    }

    fs.unlinkSync(filepath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);

    await this.auditService.logEvent({
      eventType: 'DELETE',
      resourceType: 'USERS',
      resourceId: filename,
      userId: 'SUPERADMIN',
      actionDetails: { action: 'BACKUP_ELIMINADO', filename },
    }).catch(() => {});

    return { success: true };
  }
}



