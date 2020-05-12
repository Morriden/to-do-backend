const client = require('../lib/client');
// import our seed data:
const adventures = require('./adventures.js');
const usersData = require('./users.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
        [user.email, user.hash]);
      })
    );
      
    const user = users[0].rows[0];

    await Promise.all(
      adventures.map(adventure => {
        return client.query(`
                    INSERT INTO adventures (name, danger_level, is_completed, owner_id)
                    VALUES ($1, $2, $3, $4);
                `,
        [adventure.name, adventure.danger_level, adventure.is_completed, user.id]);
      })
    );
    

    console.log('seed data load complete');
  }
  catch(err) {
    console.log(err);
  }
  finally {
    client.end();
  }
    
}
