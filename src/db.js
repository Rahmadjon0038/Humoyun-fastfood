const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "..", "data", "app.db");
const rawDb = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    rawDb.exec(sql, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

const db = {
  all,
  exec,
  get,
  raw: rawDb,
  run
};

async function initializeDatabase() {
  await exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fastfoods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      discount_price REAL,
      image_url TEXT NOT NULL,
      category_id INTEGER,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  const categoryCount = (await get("SELECT COUNT(*) AS count FROM categories")).count;
  if (categoryCount === 0) {
    const categories = [
      ["Burger", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd"],
      ["Lavash", "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec"],
      ["Pizza", "https://images.unsplash.com/photo-1548365328-9f547fb0953a"]
    ];

    await exec("BEGIN TRANSACTION");
    try {
      for (const item of categories) {
        await run("INSERT INTO categories (name, image_url) VALUES (?, ?)", item);
      }
      await exec("COMMIT");
    } catch (error) {
      await exec("ROLLBACK");
      throw error;
    }
  }

  const fastfoodCount = (await get("SELECT COUNT(*) AS count FROM fastfoods")).count;
  if (fastfoodCount === 0) {
    const fastfoods = [
      ["Cheese Burger", 28000, 25000, "https://images.unsplash.com/photo-1550547660-d9450f859349", 1],
      ["Tovuq Lavash", 26000, 23000, "https://images.unsplash.com/photo-1648146299016-3f70ca08f3ef", 2],
      ["Pepperoni Pizza", 75000, 69000, "https://images.unsplash.com/photo-1604382355076-af4b0eb60143", 3]
    ];

    await exec("BEGIN TRANSACTION");
    try {
      for (const item of fastfoods) {
        await run(
          `INSERT INTO fastfoods (name, price, discount_price, image_url, category_id)
           VALUES (?, ?, ?, ?, ?)`,
          item
        );
      }
      await exec("COMMIT");
    } catch (error) {
      await exec("ROLLBACK");
      throw error;
    }
  }

  // Keep demo image URLs in sync even if DB already exists.
  await run(
    "UPDATE categories SET image_url = ? WHERE name = ?",
    [
      "https://images.themodernproper.com/production/posts/2016/ClassicCheeseBurger_9.jpg?w=1200&h=1200&q=60&fm=jpg&fit=crop&dm=1749310239&s=463b18fc3bb51dc5d96e866c848527c4",
      "Burger"
    ]
  );
  await run(
    "UPDATE categories SET image_url = ? WHERE name = ?",
    [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYJdlp6a4duPUOUv4ox2-MMdeSnk6qBvY4gDPucrcc8VVvLqpFenOAb2iLq7HxY7JSgTaBVwam05d0-7XR8sEpENJ9TM-hieJQJQkKjQ&s=10",
      "Lavash"
    ]
  );
  await run(
    "UPDATE categories SET image_url = ? WHERE name = ?",
    [
      "https://www.tillamook.com/_next/image?url=https%3A%2F%2Fimages.ctfassets.net%2Fj8tkpy1gjhi5%2F5OvVmigx6VIUsyoKz1EHUs%2Fb8173b7dcfbd6da341ce11bcebfa86ea%2FSalami-pizza-hero.jpg&w=3840&q=75",
      "Pizza"
    ]
  );

  await run(
    "UPDATE fastfoods SET image_url = ? WHERE name = ?",
    [
      "https://images.themodernproper.com/production/posts/2016/ClassicCheeseBurger_9.jpg?w=1200&h=1200&q=60&fm=jpg&fit=crop&dm=1749310239&s=463b18fc3bb51dc5d96e866c848527c4",
      "Cheese Burger"
    ]
  );
  await run(
    "UPDATE fastfoods SET image_url = ? WHERE name = ?",
    [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYJdlp6a4duPUOUv4ox2-MMdeSnk6qBvY4gDPucrcc8VVvLqpFenOAb2iLq7HxY7JSgTaBVwam05d0-7XR8sEpENJ9TM-hieJQJQkKjQ&s=10",
      "Tovuq Lavash"
    ]
  );
  await run(
    "UPDATE fastfoods SET image_url = ? WHERE name = ?",
    [
      "https://www.tillamook.com/_next/image?url=https%3A%2F%2Fimages.ctfassets.net%2Fj8tkpy1gjhi5%2F5OvVmigx6VIUsyoKz1EHUs%2Fb8173b7dcfbd6da341ce11bcebfa86ea%2FSalami-pizza-hero.jpg&w=3840&q=75",
      "Pepperoni Pizza"
    ]
  );
}

module.exports = {
  db,
  initializeDatabase
};
