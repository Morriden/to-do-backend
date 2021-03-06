require('dotenv').config();

const client = require('./lib/client');

// Initiate database connection
client.connect();

const app = require('./lib/app');

const PORT = process.env.PORT || 7890;
const ensureAuth = require('./lib/auth/ensure-auth');
const createAuthRoutes = require('./lib/auth/create-auth-routes');

const authRoutes = createAuthRoutes({
  selectUser(email) {
    return client.query(`
        SELECT id, email, hash
        FROM users
        WHERE email = $1;
    `, [email]
    ).then(result => result.rows[0]);
  },
  insertUser(user, hash) {
    return client.query(`
        INSERT INTO users (email, hash)
        values ($1, $2)
        RETURNING id, email;
    `, [user.email, hash]
    ).then(result => result.rows[0]);
  }
});
//each app route needs 3 arguments
app.use('/auth', authRoutes);
// app.use('/api', ensureAuth);

app.post('/signup', createAuthRoutes, async(req, res) => {
  
  const data = await client.query(`
      INSERT INTO users (email, hash)
      VALUES($1, $2)
      RETURNING id, email;
  `, [req.body.email, req.body.password]);
  res.json(data.rows);
});

app.post('/signin', createAuthRoutes, async(req, res) => {
  const data = await client.query(`
      SELECT user.email, user.password
  `, [req.body.email, req.body.password]);
  res.json(data.rows);
});

app.get('/adventures', ensureAuth, async(req, res) => {
  const data = await client.query('SELECT * from adventures WHERE owner_id=$1', [req.userId]);

  res.json(data.rows);
});

app.post('/adventures', ensureAuth, async(req, res) => {
  const data = await client.query(`
    INSERT INTO adventures (name, danger_level, ownder_id)
    values($1, $2, $3)
    returning *
  `, [req.body.name, req.body.danger_level, req.userId]);
  res.json(data.rows);
});

app.put('/adventures', ensureAuth, async(req, res) => {
  const data = await client.query(`
      UPDATE adventures
      SET is_completed=true
      WHERE id=$1 AND owner_id=$2
      returning *;
  `, [req.params.id, req.userId]);
  res.json(data.rows);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Started on ${PORT}`);
});

module.exports = app;
