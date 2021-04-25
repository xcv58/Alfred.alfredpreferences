const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const sqlite3 = require("sqlite3");

const inputFilename = path.join(__dirname, "sites.json.zlib");
const outputFilename = path.join(__dirname, "sites.json");
const dbFilename = path.join(__dirname, "golinks.sqlite");
const db = new sqlite3.Database(dbFilename);

// DB setuo
// CREATE TABLE links(id INTEGER, shortname TEXT, url TEXT, url_with_argument TEXT, owner TEXT);
// CREATE TABLE lastSync(time INTEGER);
// CREATE INDEX shortname_index ON links(shortname);

const input = process.argv[2].split("/")[0];
(async () => {
  try {
    await updateCache();
    const result = await getGoLinks(input);
    const items = getItems(result, input);
    console.log(JSON.stringify({ items }));
  } catch (err) {
    console.error(err.message);
  }
  db.close();
})();

async function updateCache() {
  const time = await new Promise((resolve, reject) => {
    db.get("SELECT * FROM lastSync", (err, row) => {
      err ? reject(err) : resolve(row && row.time);
    });
  });
  const dayMilliseconds = 60 * 60 * 24 * 1000;
  if (time && new Date().getTime() - time < dayMilliseconds) {
    return;
  }
  return fetchResultsAsync();
}
async function fetchResultsAsync() {
  execSync(
    `curl -s https://ton.twitter.com/go-backup/sites.json.gz -o ${inputFilename}`
  );
  execSync(
    `python -c "import zlib,sys;print(zlib.decompress(sys.stdin.read()).decode('utf8'))" < ${inputFilename} > ${outputFilename}`
  );
  const result = JSON.parse(fs.readFileSync(outputFilename, "utf-8"));
  await insertValues(result);
}
async function insertValues(result) {
  const links = result.map(
    ({ id, shortname, url, url_with_argument, owner }) => [
      id,
      shortname,
      url,
      url_with_argument,
      owner,
    ]
  );

  return new Promise((resolve, reject) => {
    db.serialize(function () {
      db.run("DELETE FROM links");

      const statement = db.prepare(
        `INSERT INTO links (id, shortname, url, url_with_argument, owner) VALUES (?, ?, ?, ?, ?)`
      );
      links.forEach((link) => statement.run(link));
      statement.finalize();

      db.run("DELETE FROM lastSync");
      db.run(
        `INSERT INTO lastSync (time) VALUES (?)`,
        new Date().getTime(),
        (err, _val) => (err ? reject(err) : resolve())
      );
    });
  });
}
function getItems(results) {
  return results.map(({ shortname, url, url_with_argument, owner, id }) => ({
    title: `${shortname}`,
    subtitle: `${[url, url_with_argument].join(" | ")} | owner: ${owner}`,
    arg: `${shortname}`,
  }));
}
async function getGoLinks(input) {
  const [exactMatch, rest] = await Promise.all([
    new Promise((resolve, reject) =>
      db.get(`SELECT * FROM links WHERE shortname = ?`, input, (err, row) =>
        err ? reject(err) : resolve(row)
      )
    ),
    new Promise((resolve, reject) =>
      db.all(
        `SELECT * FROM links WHERE shortname LIKE ? AND shortname != ? LIMIT 20`,
        [`%${input}%`, input],
        (err, rows) => (err ? reject(err) : resolve(rows))
      )
    ),
  ]);
  return exactMatch ? [exactMatch, ...rest] : rest;
}
