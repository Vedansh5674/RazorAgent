import { AuditService } from '../services/auditService.js';

export class AuditController {
  static async getLogs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit || '50', 10);
      const offset = parseInt(req.query.offset || '0', 10);
      const logs = await AuditService.getLogs(req.merchantId, { limit, offset });

      const parsed = logs.map(l => ({
        ...l,
        input_data: typeof l.input_data === 'string' ? JSON.parse(l.input_data) : l.input_data,
        output_data: typeof l.output_data === 'string' ? JSON.parse(l.output_data) : l.output_data
      }));

      res.json(parsed);
    } catch (err) {
      next(err);
    }
  }

  static async getLogById(req, res, next) {
    try {
      const { id } = req.params;
      const log = await AuditService.getLogById(req.merchantId, id);

      if (!log) {
        return res.status(404).json({ error: 'NotFound', message: 'Audit entry not found.' });
      }

      log.input_data = typeof log.input_data === 'string' ? JSON.parse(log.input_data) : log.input_data;
      log.output_data = typeof log.output_data === 'string' ? JSON.parse(log.output_data) : log.output_data;
      res.json(log);
    } catch (err) {
      next(err);
    }
  }
}
