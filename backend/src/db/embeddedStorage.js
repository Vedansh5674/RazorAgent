import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

class EmbeddedStorage {
  constructor() {
    this.tables = {
      merchants: [],
      users: [],
      merchant_policies: [],
      products: [],
      customers: [],
      customer_consents: [],
      carts: [],
      cart_items: [],
      orders: [],
      payments: [],
      opportunities: [],
      recommendations: [],
      actions: [],
      whatsapp_messages: [],
      audit_logs: [],
      emails: [],
      autopilot_settings: [],
      autopilot_events: []
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const loaded = JSON.parse(raw);
        this.tables = { ...this.tables, ...loaded };
      } catch (err) {
        console.warn('[EmbeddedStorage] Failed to read existing store, re-initializing:', err.message);
      }
    } else {
      this.persist();
    }
  }

  persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.tables, null, 2), 'utf-8');
    } catch (err) {
      console.error('[EmbeddedStorage] Error persisting data:', err.message);
    }
  }

  getTable(name) {
    if (!this.tables[name]) {
      this.tables[name] = [];
    }
    return this.tables[name];
  }

  reset() {
    for (const key of Object.keys(this.tables)) {
      this.tables[key] = [];
    }
    this.persist();
  }

  // Generic SQL Query Simulator for Embedded Mode
  async query(text, params = []) {
    const rawSql = text.trim();
    const sql = rawSql.replace(/\s+/g, ' ');

    // 1. DDL Statements (CREATE TABLE, etc.) -> No-op
    if (/^CREATE TABLE/i.test(sql) || /^ALTER TABLE/i.test(sql) || /^DROP TABLE/i.test(sql)) {
      return { rows: [], rowCount: 0 };
    }

    // 2. INSERT INTO table (cols) VALUES ($1, $2, ...) RETURNING *
    const insertMatch = sql.match(/^INSERT INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)(?:\s*RETURNING\s+(.+))?/i);
    if (insertMatch) {
      const tableName = insertMatch[1].toLowerCase();
      const cols = insertMatch[2].split(',').map(c => c.trim().toLowerCase());
      const table = this.getTable(tableName);

      const newRow = {};
      cols.forEach((col, idx) => {
        let val = params[idx];
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          try { val = JSON.parse(val); } catch (e) {}
        }
        newRow[col] = val;
      });

      if (!newRow.created_at) newRow.created_at = new Date().toISOString();
      if (!newRow.updated_at) newRow.updated_at = new Date().toISOString();

      // Check primary key / unique constraint on id
      const existingIdx = newRow.id ? table.findIndex(r => r.id === newRow.id) : -1;
      if (existingIdx >= 0) {
        table[existingIdx] = { ...table[existingIdx], ...newRow, updated_at: new Date().toISOString() };
      } else {
        table.push(newRow);
      }

      this.persist();
      return { rows: [newRow], rowCount: 1 };
    }

    // 3. UPDATE table SET col1 = $1, col2 = $2 WHERE col = $3 RETURNING *
    const updateMatch = sql.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)\s+WHERE\s+(.+?)(?:\s*RETURNING\s+(.+))?$/i);
    if (updateMatch) {
      const tableName = updateMatch[1].toLowerCase();
      const setClause = updateMatch[2];
      const whereClause = updateMatch[3];
      const table = this.getTable(tableName);

      // Parse SET fields respecting parentheses (e.g. COALESCE($1, col))
      const setAssignments = [];
      let currentSet = '';
      let parenDepth = 0;
      for (const char of setClause) {
        if (char === '(') parenDepth++;
        else if (char === ')') parenDepth--;
        if (char === ',' && parenDepth === 0) {
          setAssignments.push(currentSet.trim());
          currentSet = '';
        } else {
          currentSet += char;
        }
      }
      if (currentSet.trim()) setAssignments.push(currentSet.trim());

      const updatedRows = [];

      table.forEach((row, idx) => {
        if (this._evalWhere(row, whereClause, params)) {
          setAssignments.forEach(assignment => {
            const eqIndex = assignment.indexOf('=');
            if (eqIndex === -1) return;
            const col = assignment.slice(0, eqIndex).trim().toLowerCase();
            const valPlaceholder = assignment.slice(eqIndex + 1).trim();
            const phMatch = valPlaceholder.match(/\$(\d+)/);
            const isCoalesce = /COALESCE/i.test(valPlaceholder);
            if (phMatch) {
              const pIndex = parseInt(phMatch[1], 10) - 1;
              let val = params[pIndex];
              if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                try { val = JSON.parse(val); } catch (e) {}
              }
              if (isCoalesce) {
                if (val !== undefined && val !== null) {
                  row[col] = val;
                }
              } else {
                row[col] = val;
              }
            } else {
              let val = valPlaceholder;
              if (val.startsWith("'") && val.endsWith("'")) {
                val = val.slice(1, -1);
              } else if (val.toLowerCase() === 'null') {
                val = null;
              } else if (val.toLowerCase() === 'true') {
                val = true;
              } else if (val.toLowerCase() === 'false') {
                val = false;
              } else if (!isNaN(Number(val))) {
                val = Number(val);
              }
              row[col] = val;
            }
          });
          row.updated_at = new Date().toISOString();
          updatedRows.push(row);
        }
      });

      this.persist();
      return { rows: updatedRows, rowCount: updatedRows.length };
    }

    // 4. DELETE FROM table WHERE ...
    const deleteMatch = sql.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i);
    if (deleteMatch) {
      const tableName = deleteMatch[1].toLowerCase();
      const whereClause = deleteMatch[2];
      const table = this.getTable(tableName);

      let deletedCount = 0;
      if (!whereClause) {
        deletedCount = table.length;
        this.tables[tableName] = [];
      } else {
        const remaining = [];
        table.forEach(row => {
          if (this._evalWhere(row, whereClause, params)) {
            deletedCount++;
          } else {
            remaining.push(row);
          }
        });
        this.tables[tableName] = remaining;
      }
      this.persist();
      return { rows: [], rowCount: deletedCount };
    }

    // 5. SELECT queries
    const selectMatch = sql.match(/^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+(?:LEFT|RIGHT|INNER)?\s*JOIN\s+.+?)?(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+(.+?))?(?:\s+LIMIT\s+(\d+|\$\d+))?(?:\s+OFFSET\s+(\d+|\$\d+))?$/i);
    if (selectMatch || /^SELECT/i.test(sql)) {
      return this._handleSelect(sql, params);
    }

    return { rows: [], rowCount: 0 };
  }

  _evalWhere(row, whereClause, params) {
    if (!whereClause) return true;

    // Simple parser for AND conditions
    const conditions = whereClause.split(/\s+AND\s+/i);
    for (const cond of conditions) {
      const eqMatch = cond.match(/([a-zA-Z0-9_.]+)\s*(=|!=|<>|>|<|>=|<=|ILIKE|LIKE|IS)\s*(.+)/i);
      if (!eqMatch) continue;

      const colName = eqMatch[1].split('.').pop().toLowerCase();
      const op = eqMatch[2].toUpperCase();
      let rightVal = eqMatch[3].trim();

      let targetVal;
      const phMatch = rightVal.match(/\$(\d+)/);
      if (phMatch) {
        targetVal = params[parseInt(phMatch[1], 10) - 1];
      } else if (rightVal === 'NULL') {
        targetVal = null;
      } else if (rightVal.startsWith("'") && rightVal.endsWith("'")) {
        targetVal = rightVal.slice(1, -1);
      } else if (rightVal.toLowerCase() === 'true') {
        targetVal = true;
      } else if (rightVal.toLowerCase() === 'false') {
        targetVal = false;
      } else if (!isNaN(Number(rightVal))) {
        targetVal = Number(rightVal);
      } else {
        targetVal = rightVal;
      }

      const rowVal = row[colName];

      if (op === '=' || op === 'IS') {
        if (targetVal === null) {
          if (rowVal !== null && rowVal !== undefined) return false;
        } else if (rowVal != targetVal && String(rowVal).toLowerCase() !== String(targetVal).toLowerCase()) {
          return false;
        }
      } else if (op === '!=' || op === '<>') {
        if (rowVal == targetVal) return false;
      } else if (op === '>') {
        if (Number(rowVal) <= Number(targetVal)) return false;
      } else if (op === '>=') {
        if (Number(rowVal) < Number(targetVal)) return false;
      } else if (op === '<') {
        if (Number(rowVal) >= Number(targetVal)) return false;
      } else if (op === '<=') {
        if (Number(rowVal) > Number(targetVal)) return false;
      } else if (op === 'ILIKE' || op === 'LIKE') {
        const cleanTarget = String(targetVal).replace(/%/g, '').toLowerCase();
        if (!String(rowVal).toLowerCase().includes(cleanTarget)) return false;
      }
    }
    return true;
  }

  _handleSelect(sql, params) {
    // Determine target table
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) return { rows: [], rowCount: 0 };
    const tableName = fromMatch[1].toLowerCase();
    const table = this.getTable(tableName);

    // Parse joins
    const joinRegex = /(?:LEFT|RIGHT|INNER)?\s*JOIN\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)/gi;
    let joinMatch;
    const joins = [];
    while ((joinMatch = joinRegex.exec(sql)) !== null) {
      joins.push({
        table: joinMatch[1].toLowerCase(),
        alias: (joinMatch[2] || joinMatch[1]).toLowerCase(),
        leftCol: joinMatch[3].toLowerCase(),
        rightCol: joinMatch[4].toLowerCase()
      });
    }

    // Parse select fields if aliases exist
    const selectFieldsMatch = sql.match(/^SELECT\s+(.+?)\s+FROM/i);
    const selectAliases = [];
    if (selectFieldsMatch) {
      const fieldParts = selectFieldsMatch[1].split(',');
      for (const fp of fieldParts) {
        const asMatch = fp.trim().match(/([a-zA-Z0-9_.]+)\s+AS\s+([a-zA-Z0-9_]+)/i);
        if (asMatch) {
          selectAliases.push({
            source: asMatch[1].toLowerCase(),
            target: asMatch[2].toLowerCase()
          });
        }
      }
    }

    let sourceRows = table.map(baseRow => {
      let row = { ...baseRow };
      for (const j of joins) {
        const otherTable = this.getTable(j.table);
        const leftProp = j.leftCol.split('.').pop();
        const rightProp = j.rightCol.split('.').pop();
        const otherRow = otherTable.find(r => 
          (r[rightProp] !== undefined && row[leftProp] !== undefined && r[rightProp] == row[leftProp]) ||
          (r[leftProp] !== undefined && row[rightProp] !== undefined && r[leftProp] == row[rightProp])
        );
        if (otherRow) {
          for (const sa of selectAliases) {
            const [srcAlias, srcProp] = sa.source.split('.');
            if (srcAlias === j.alias && otherRow[srcProp] !== undefined) {
              row[sa.target] = otherRow[srcProp];
            }
          }
          if (otherRow.name && !row.customer_name && j.table === 'customers') row.customer_name = otherRow.name;
          if (otherRow.phone && !row.customer_phone && j.table === 'customers') row.customer_phone = otherRow.phone;
          if (otherRow.email && !row.customer_email && j.table === 'customers') row.customer_email = otherRow.email;
          if (otherRow.store_name && !row.store_name && j.table === 'merchants') row.store_name = otherRow.store_name;
          if (otherRow.recovery_token && !row.recovery_token) row.recovery_token = otherRow.recovery_token;
          if (otherRow.total_amount !== undefined && row.total_amount === undefined) row.total_amount = otherRow.total_amount;
          if (otherRow.customer_id && !row.customer_id) row.customer_id = otherRow.customer_id;
          if (otherRow.cart_id && !row.cart_id) row.cart_id = otherRow.cart_id;
          if (otherRow.title && !row.opportunity_title && j.table === 'opportunities') row.opportunity_title = otherRow.title;
        }
      }
      return row;
    });

    // Extract WHERE
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s+LIMIT|\s+OFFSET|$)/i);
    const whereClause = whereMatch ? whereMatch[1] : null;

    let filtered = sourceRows.filter(row => this._evalWhere(row, whereClause, params));

    // Handle ORDER BY
    const orderMatch = sql.match(/ORDER BY\s+([a-zA-Z0-9_.]+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const col = orderMatch[1].split('.').pop().toLowerCase();
      const dir = (orderMatch[2] || 'ASC').toUpperCase();
      filtered.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA < valB) return dir === 'ASC' ? -1 : 1;
        if (valA > valB) return dir === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    // Handle LIMIT & OFFSET
    const limitMatch = sql.match(/LIMIT\s+(\d+|\$\d+)/i);
    const offsetMatch = sql.match(/OFFSET\s+(\d+|\$\d+)/i);

    let offset = 0;
    if (offsetMatch) {
      const raw = offsetMatch[1];
      if (raw.startsWith('$')) {
        offset = parseInt(params[parseInt(raw.slice(1), 10) - 1], 10) || 0;
      } else {
        offset = parseInt(raw, 10) || 0;
      }
    }

    let limit = filtered.length;
    if (limitMatch) {
      const raw = limitMatch[1];
      if (raw.startsWith('$')) {
        limit = parseInt(params[parseInt(raw.slice(1), 10) - 1], 10) || filtered.length;
      } else {
        limit = parseInt(raw, 10) || filtered.length;
      }
    }

    const rows = filtered.slice(offset, offset + limit);

    // If query is COUNT(*)
    if (/SELECT\s+COUNT\(\*\)/i.test(sql)) {
      return { rows: [{ count: filtered.length }], rowCount: 1 };
    }

    return { rows, rowCount: rows.length };
  }
}

export const embeddedStorage = new EmbeddedStorage();
