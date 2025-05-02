// Importerer mssql-biblioteket (det der taler med SQL-serveren)
const sql = require('mssql');
// Importerer databaseoplysninger fra config.js
const { passwordConfig } = require('./config');

let pool; // Vi opretter en global variabel til forbindelsen (så vi kun laver den én gang)

// Denne funktion kan bruges til at få forbindelse til databasen
async function getConnection() {
  if (!pool) { // Hvis vi ikke allerede har en åben forbindelse
    try {
      pool = await sql.connect(passwordConfig); // Opret forbindelsen med dine config-oplysninger
      console.log("Forbundet til SQL database")
    } catch (err) {
      console.error("Kunne ikke forbinde til database", err);
      throw err; // Giv fejlen videre, hvis forbindelsen mislykkes
    }
  }
  return pool; // Returnér forbindelsen
}

module.exports = { getConnection };

