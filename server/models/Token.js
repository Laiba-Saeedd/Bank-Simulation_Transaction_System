import db from "../config/db.js";

const Token = {
  createOrUpdate: (userId, accessToken, refreshToken, expiresAt, callback) => {
    let mysqlExpiresAt = null;
    if (expiresAt instanceof Date && !isNaN(expiresAt.getTime())) {
      mysqlExpiresAt = expiresAt.toISOString().slice(0, 19).replace("T", " ");
    }

    db.query("SELECT * FROM tokens WHERE user_id = ?", [userId], (err, result) => {
      if (err) return callback(err);

      if (result.length > 0) {
        // UPDATE with expires_at
        db.query(
          "UPDATE tokens SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = NOW() WHERE user_id = ?",
          [accessToken, refreshToken, mysqlExpiresAt, userId],
          callback
        );
      } else {
        // INSERT with expires_at
        db.query(
          "INSERT INTO tokens (user_id, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?)",
          [userId, accessToken, refreshToken, mysqlExpiresAt],
          callback
        );
      }
    });
  },

  findByRefreshToken: (refreshToken, callback) => {
    db.query("SELECT * FROM tokens WHERE refresh_token = ?", [refreshToken], callback);
  },

  deleteByRefreshToken: (refreshToken, callback) => {
    db.query("DELETE FROM tokens WHERE refresh_token = ?", [refreshToken], callback);
  },

  deleteByUserId: (userId, callback) => {
    db.query("DELETE FROM tokens WHERE user_id = ?", [userId], callback);
  },
};


export default Token;
