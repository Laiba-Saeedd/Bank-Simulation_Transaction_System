// models/User.js
import db from "../config/db.js";


const User = {
  // create: (userData, callback) => {
  //   const sql = `
  //     INSERT INTO users (username, password, name, address, contact, status, role, created_at)
  //     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  //   `;

  //   db.query(
  //     sql,
  //     [
  //       userData.username,
  //       userData.password,
  //       userData.name,
  //       userData.address,
  //       userData.contact,
  //       userData.status,
  //       userData.role
  //     ],
  //     callback
  //   );
  // },
findAll: () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT user_id, username, name, contact, role, status, created_at
      FROM users
      WHERE role = 'user'
      ORDER BY created_at DESC
    `;
    
    db.query(sql, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
},

findUserByIdWithRole: (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT user_id, username, name, contact, role, status, created_at
      FROM users
      WHERE user_id = ? AND role = 'user'
      LIMIT 1
    `;

    db.query(sql, [id], (err, result) => {
      if (err) return reject(err);
      if (result.length === 0) return resolve(null);
      resolve(result[0]);
    });
  });
},
updateById: (id, data) => {
  return new Promise((resolve, reject) => {
    const { username, name, contact, role, status, password } = data;

    let sql = `
      UPDATE users SET 
        username = ?, 
        name = ?, 
        contact = ?, 
        role = ?, 
        status = ?
    `;
    let params = [username, name, contact, role, status];

    // Agar password bheja gaya ho to include karo
    if (password) {
      sql += `, password = ?`;
      params.push(password);
    }

    sql += ` WHERE user_id = ?`;
    params.push(id);

    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
},
deleteById: (id) => {
  return new Promise((resolve, reject) => {
    const sql = "DELETE FROM users WHERE user_id = ?";
    db.query(sql, [id], (err, result) => {
      if (err) return reject(err);
      console.log(result); // check this in console
      resolve(result);
    });
  });
},

  findByUsername: (username, callback) => {
    db.query("SELECT * FROM users WHERE username = ?", [username], callback);
  },
  // Delete user by ID (return Promise)
deleteById: (userId) => {
  return new Promise((resolve, reject) => {
    const sql = "DELETE FROM users WHERE user_id = ?";
    db.query(sql, [userId], (err, result) => {
      if (err) return reject(err);
      resolve(result); // result.affectedRows will exist
    });
  });
},

// Find user by ID (return Promise)
findById: (userId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE user_id = ?";
    db.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]); // return single user or undefined
    });
  });
},
findByUserId: (userId, callback) => {
  const sql = "SELECT * FROM users WHERE user_id = ?";
  db.query(sql, [userId], callback);
},
   update: (id, userData, callback) => {
  const sql = `
    UPDATE users
    SET username = ?, password = ?, name = ?, address = ?, contact = ?
    WHERE user_id = ?
  `;

  const values = [
    userData.username,
    userData.password,
    userData.name,
    userData.address,
    userData.contact,
    id,
  ];

  db.query(sql, values, callback);
},

updateStatusById: (id, status) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE users SET status = ? WHERE user_id = ?`;
    db.query(sql, [status, id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
},
create: (userData) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO users (username, password, name, address, contact, status, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(
      sql,
      [
        userData.username,
        userData.password,
        userData.name,
        userData.address,
        userData.contact,
        userData.status,
        userData.role,
      ],
      (err, result) => {
        if (err) return reject(err);

        // Only resolve with useful info; email sending handled in service
        resolve({
          insertId: result.insertId,
          user: {
            username: userData.username,
            name: userData.name,
            contact: userData.contact,
            role: userData.role,
            status: userData.status,
          },
        });
      }
    );
  });
},
  findByUser: (username) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM users WHERE username = ?";
      db.query(sql, [username], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },
};



export default User;
