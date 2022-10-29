const express = require("express");
const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const path = require("path");
const db_path = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  db = await open({ filename: db_path, driver: sqlite3.Database });
  app.listen(3000, () => {
    try {
      console.log("server running at http://localhost:3000");
    } catch (error) {
      console.log(`DB ERROR ${error.message}`);
      process.exit(1);
    }
  });
};
initializeDbAndServer();

const convertDbResponseObjectToCamelCaseStateObject = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

const convertDbResponseObjectToCamelCaseDistrictObject = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

//API 1 GET
app.get("/states/", async (request, response) => {
  try {
    const Query = `
        SELECT 
        *
        FROM 
        state
        ORDER BY 
        state_id;`;
    const dbResponse = await db.all(Query);
    let results = [];
    for (let i = 0; i < dbResponse.length; i++) {
      let resObject = convertDbResponseObjectToCamelCaseStateObject(
        dbResponse[i]
      );
      results.push(resObject);
    }
    response.send(results);
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 2 GET
app.get("/states/:stateId/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const Query = `
            SELECT
                *
            FROM
                state
            WHERE
                state_id=${stateId};`;
    let dbResponse = await db.get(Query);
    dbResponse = Array(dbResponse);
    let results = [];
    for (let i = 0; i < dbResponse.length; i++) {
      let resObject = convertDbResponseObjectToCamelCaseStateObject(
        dbResponse[i]
      );
      results.push(resObject);
    }
    response.send(results[0]);
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 3 POST
app.post("/districts/", async (request, response) => {
  try {
    const districtDetails = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = districtDetails;
    const Query = `
        INSERT INTO
            district (district_name,state_id,cases,cured,active,deaths)
            VALUES 
            (   
                "${districtName}",
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths}
                );`;
    const dbResponse = await db.run(Query);
    response.send("District Successfully Added");
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 4 GET
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  try {
    const Query = `
                SELECT 
                    *
                FROM 
                    district
                WHERE 
                    district_id=${districtId};`;
    const dbResponse = await db.all(Query);
    let results = [];
    for (let i = 0; i < dbResponse.length; i++) {
      let resObject = convertDbResponseObjectToCamelCaseDistrictObject(
        dbResponse[i]
      );
      results.push(resObject);
    }
    response.send(results[0]);
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 5 DELETE
app.delete("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const Query = `
        DELETE FROM
        district
        WHERE
        district_id=${districtId};`;
    await db.run(Query);
    response.send("District Removed");
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 6 PUT
app.put("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const districtDetails = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = districtDetails;
    const Query = `
        UPDATE
            district
        SET
           district_name="${districtName}",
           state_id=${stateId},
           cases=${cases},
           cured=${cured},
           active=${active},
           deaths=${deaths}
        WHERE
            district_id=${districtId};`;
    await db.run(Query);
    response.send("District Details Updated");
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 7 GET
app.get("/states/:stateId/stats/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const Query = `
        SELECT
            *
        FROM
            district
        WHERE
            state_id = ${stateId};`;
    const dbResponse = await db.all(Query);
    let totalCases = 0;
    let totalCured = 0;
    let totalActive = 0;
    let totalDeaths = 0;

    for (let i = 0; i < dbResponse.length; i++) {
      let resObject = convertDbResponseObjectToCamelCaseDistrictObject(
        dbResponse[i]
      );
      totalCases += resObject.cases;
      totalCured += resObject.cured;
      totalActive += resObject.active;
      totalDeaths += resObject.deaths;
    }
    response.send({
      totalCases: totalCases,
      totalCured: totalCured,
      totalActive: totalActive,
      totalDeaths: totalDeaths,
    });
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 8 GET
app.get("/districts/:districtId/details/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const Query = `
            SELECT
                *
            FROM
                state
            INNER JOIN district ON state.state_id=district.state_id
            WHERE 
                district_id=${districtId};`;
    const dbResponse = await db.all(Query);
    let results = [];
    for (let i = 0; i < dbResponse.length; i++) {
      let resObject = convertDbResponseObjectToCamelCaseStateObject(
        dbResponse[i]
      );
      results.push(resObject);
    }
    response.send({ sateName: results[0].stateName });
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

module.exports = app;
