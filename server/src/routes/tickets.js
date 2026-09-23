const express = require('express');
const { body, query: queryValidator, validationResult } = require('express-validator');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const CATEGORIES = ['Software', 'Hardware', 'Network', 'Other'];

const TICKET_SELECT = `
  SELECT
    t.id,
    t.title,
    t.category,
    t.description,
    t.priority,
    t.status,
    t.created_by,
    t.assigned_to,
    t.created_at,
    t.updated_at,
    creator.name AS created_by_name,
    creator.email AS created_by_email,
    assignee.name AS assigned_to_name
  FROM tickets t
  INNER JOIN users creator ON creator.id = t.created_by
  LEFT JOIN users assignee ON assignee.id = t.assigned_to
`;

function mapTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    priority: row.priority,
    status: row.status,
    createdBy: {
      id: row.created_by,
      name: row.created_by_name,
      email: row.created_by_email,
    },
    assignedTo: row.assigned_to
      ? { id: row.assigned_to, name: row.assigned_to_name }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.use(authenticate);

router.get('/stats', async (req, res) => {
  try {
    const isOfficer = req.user.role === 'it_officer';
    const where = isOfficer ? '' : 'WHERE created_by = ?';
    const params = isOfficer ? [] : [req.user.id];

    const rows = await query(
      `
      SELECT
        COUNT(*) AS total,
        SUM(status = 'Open') AS open_count,
        SUM(status = 'In Progress') AS in_progress_count,
        SUM(status = 'Resolved') AS resolved_count
      FROM tickets
      ${where}
      `,
      params
    );

    const stats = rows[0] || {};
    return res.json({
      total: Number(stats.total) || 0,
      open: Number(stats.open_count) || 0,
      inProgress: Number(stats.in_progress_count) || 0,
      resolved: Number(stats.resolved_count) || 0,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ message: 'Unable to load dashboard stats' });
  }
});

router.get(
  '/',
  [
    queryValidator('status').optional().isIn(STATUSES),
    queryValidator('priority').optional().isIn(PRIORITIES),
    queryValidator('category').optional().isIn(CATEGORIES),
    queryValidator('q').optional().isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const filters = [];
      const params = [];

      if (req.user.role !== 'it_officer') {
        filters.push('t.created_by = ?');
        params.push(req.user.id);
      }

      if (req.query.status) {
        filters.push('t.status = ?');
        params.push(req.query.status);
      }
      if (req.query.priority) {
        filters.push('t.priority = ?');
        params.push(req.query.priority);
      }
      if (req.query.category) {
        filters.push('t.category = ?');
        params.push(req.query.category);
      }
      if (req.query.q) {
        filters.push('(t.title LIKE ? OR t.description LIKE ?)');
        const like = `%${req.query.q}%`;
        params.push(like, like);
      }

      const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
      const rows = await query(
        `${TICKET_SELECT} ${where} ORDER BY t.updated_at DESC, t.id DESC`,
        params
      );

      return res.json({ tickets: rows.map(mapTicket) });
    } catch (err) {
      console.error('List tickets error:', err);
      return res.status(500).json({ message: 'Unable to load tickets' });
    }
  }
);

router.get('/:id', async (req, res) => {
  try {
    const rows = await query(`${TICKET_SELECT} WHERE t.id = ?`, [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = mapTicket(rows[0]);
    if (req.user.role !== 'it_officer' && ticket.createdBy.id !== req.user.id) {
      return res.status(403).json({ message: 'You can only view your own tickets' });
    }

    const comments = await query(
      `
      SELECT
        c.id,
        c.body,
        c.is_resolution,
        c.created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.role AS user_role
      FROM comments c
      INNER JOIN users u ON u.id = c.user_id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
      `,
      [ticket.id]
    );

    return res.json({
      ticket: {
        ...ticket,
        comments: comments.map((c) => ({
          id: c.id,
          body: c.body,
          isResolution: Boolean(c.is_resolution),
          createdAt: c.created_at,
          user: {
            id: c.user_id,
            name: c.user_name,
            role: c.user_role,
          },
        })),
      },
    });
  } catch (err) {
    console.error('Get ticket error:', err);
    return res.status(500).json({ message: 'Unable to load ticket' });
  }
});

router.post(
  '/',
  requireRole('staff', 'it_officer'),
  [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),
    body('category').isIn(CATEGORIES).withMessage('Invalid category'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('priority').isIn(PRIORITIES).withMessage('Invalid priority'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, category, description, priority } = req.body;

    try {
      const result = await query(
        `
        INSERT INTO tickets (title, category, description, priority, status, created_by)
        VALUES (?, ?, ?, ?, 'Open', ?)
        `,
        [title, category, description, priority, req.user.id]
      );

      const rows = await query(`${TICKET_SELECT} WHERE t.id = ?`, [result.insertId]);
      return res.status(201).json({ ticket: mapTicket(rows[0]) });
    } catch (err) {
      console.error('Create ticket error:', err);
      return res.status(500).json({ message: 'Unable to create ticket' });
    }
  }
);

router.patch(
  '/:id/status',
  requireRole('it_officer'),
  [
    body('status').isIn(STATUSES).withMessage('Invalid status'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const nextStatus = req.body.status;

    try {
      const existing = await query('SELECT id, status FROM tickets WHERE id = ?', [req.params.id]);
      if (!existing.length) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      const current = existing[0].status;
      const allowed = {
        Open: ['In Progress'],
        'In Progress': ['Resolved'],
        Resolved: [],
      };

      if (current === nextStatus) {
        const rows = await query(`${TICKET_SELECT} WHERE t.id = ?`, [req.params.id]);
        return res.json({ ticket: mapTicket(rows[0]) });
      }

      if (!(allowed[current] || []).includes(nextStatus)) {
        return res.status(400).json({
          message: `Status must follow Open → In Progress → Resolved (cannot move from ${current} to ${nextStatus})`,
        });
      }

      await query(
        'UPDATE tickets SET status = ?, assigned_to = COALESCE(assigned_to, ?) WHERE id = ?',
        [nextStatus, req.user.id, req.params.id]
      );

      const rows = await query(`${TICKET_SELECT} WHERE t.id = ?`, [req.params.id]);
      return res.json({ ticket: mapTicket(rows[0]) });
    } catch (err) {
      console.error('Update status error:', err);
      return res.status(500).json({ message: 'Unable to update status' });
    }
  }
);

router.post(
  '/:id/comments',
  [
    body('body').trim().isLength({ min: 2 }).withMessage('Comment must be at least 2 characters'),
    body('isResolution').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const tickets = await query('SELECT id, created_by, status FROM tickets WHERE id = ?', [
        req.params.id,
      ]);
      if (!tickets.length) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      const ticket = tickets[0];
      const isOfficer = req.user.role === 'it_officer';
      if (!isOfficer && ticket.created_by !== req.user.id) {
        return res.status(403).json({ message: 'You can only comment on your own tickets' });
      }

      const isResolution = Boolean(req.body.isResolution) && isOfficer;

      const result = await query(
        `
        INSERT INTO comments (ticket_id, user_id, body, is_resolution)
        VALUES (?, ?, ?, ?)
        `,
        [ticket.id, req.user.id, req.body.body, isResolution ? 1 : 0]
      );

      if (isResolution && ticket.status !== 'Resolved') {
        await query(
          'UPDATE tickets SET status = ?, assigned_to = COALESCE(assigned_to, ?) WHERE id = ?',
          ['Resolved', req.user.id, ticket.id]
        );
      }

      const comments = await query(
        `
        SELECT
          c.id,
          c.body,
          c.is_resolution,
          c.created_at,
          u.id AS user_id,
          u.name AS user_name,
          u.role AS user_role
        FROM comments c
        INNER JOIN users u ON u.id = c.user_id
        WHERE c.id = ?
        `,
        [result.insertId]
      );

      const c = comments[0];
      return res.status(201).json({
        comment: {
          id: c.id,
          body: c.body,
          isResolution: Boolean(c.is_resolution),
          createdAt: c.created_at,
          user: {
            id: c.user_id,
            name: c.user_name,
            role: c.user_role,
          },
        },
      });
    } catch (err) {
      console.error('Add comment error:', err);
      return res.status(500).json({ message: 'Unable to add comment' });
    }
  }
);

module.exports = router;
