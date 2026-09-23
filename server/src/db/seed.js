const bcrypt = require('bcryptjs');
const { pool, query } = require('./config/db');

async function seed() {
  try {
    const staffHash = await bcrypt.hash('staff123', 10);
    const officerHash = await bcrypt.hash('officer123', 10);

    await query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES
        ('Alex Staff', 'staff@company.com', ?, 'staff'),
        ('Jordan Officer', 'it@company.com', ?, 'it_officer')
      ON DUPLICATE KEY UPDATE name = VALUES(name)
      `,
      [staffHash, officerHash]
    );

    const users = await query(
      `SELECT id, email FROM users WHERE email IN ('staff@company.com', 'it@company.com')`
    );
    const staff = users.find((u) => u.email === 'staff@company.com');
    const officer = users.find((u) => u.email === 'it@company.com');

    const existing = await query('SELECT COUNT(*) AS count FROM tickets');
    if (Number(existing[0].count) === 0 && staff) {
      await query(
        `
        INSERT INTO tickets (title, category, description, priority, status, created_by, assigned_to)
        VALUES
          ('Laptop will not connect to Wi-Fi', 'Network', 'Office laptop drops Wi-Fi every few minutes on floor 2.', 'High', 'Open', ?, NULL),
          ('Outlook keeps crashing', 'Software', 'Outlook closes when opening calendar invites. Happens on Windows 11.', 'Medium', 'In Progress', ?, ?),
          ('Keyboard keys sticking', 'Hardware', 'Several keys on the Dell keyboard stick and repeat characters.', 'Low', 'Resolved', ?, ?)
        `,
        [staff.id, staff.id, officer?.id || null, staff.id, officer?.id || null]
      );

      const tickets = await query('SELECT id, title FROM tickets ORDER BY id ASC');
      const resolved = tickets.find((t) => t.title.includes('Keyboard'));
      if (resolved && officer) {
        await query(
          `
          INSERT INTO comments (ticket_id, user_id, body, is_resolution)
          VALUES (?, ?, 'Replaced keyboard with spare unit from stores. Issue confirmed resolved.', 1)
          `,
          [resolved.id, officer.id]
        );
      }
    }

    console.log('Seed complete.');
    console.log('Staff login:   staff@company.com / staff123');
    console.log('Officer login: it@company.com / officer123');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
