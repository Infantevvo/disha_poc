// ✅ Updated Node.js + MySQL code without master_id foreign key in child tables

const express = require("express");
const multer = require("multer");
const unzipper = require("unzipper");
const XLSX = require("xlsx");
const fs = require("fs");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 5000;

app.use(cors());
const upload = multer({ dest: "uploads/" });

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "disha_db",
});

app.post("/upload", upload.single("zipfile"), async (req, res) => {
  const zipPath = req.file.path;

  try {
    const directory = await unzipper.Open.file(zipPath);

    for (const file of directory.files) {
      if (file.path.endsWith(".xlsx")) {
        const content = await file.buffer();
        const workbook = XLSX.read(content, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Extract master info
        const master_info = {
          state: sheet["B4"]?.v || "",
          district: sheet["E4"]?.v || "",
          cluster_hq: sheet["G4"]?.v || "",
          month: sheet["B5"]?.v || "",
          year: sheet["E5"]?.v || "",
        };

        // Generate master_id
const [rows] = await pool.query("SELECT COUNT(*) as count FROM master_table");
const master_id = `${rows[0].count + 1}`;
console.log(master_id);

// Insert into master_table
await pool.query(
  `INSERT INTO master_table (id, state, district, cluster_hq, month, year) VALUES (?, ?, ?, ?, ?, ?)`,
  [master_id, ...Object.values(master_info)]
);


        // // ✅ Pass master_id in all insert queries below

        await pool.query(
          `INSERT INTO District_at_a_Glance (master_id, prevalence_rate, estimated_plhivs) VALUES (?, ?, ?)`,
          [master_id, sheet["B11"]?.v || "", sheet["F11"]?.v || 0]
        );

        await pool.query(
          `INSERT INTO Epidemic_Status_of_the_district (master_id, status1, status2, status3, category, pregnant_positive, hiv_surveillance_year)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            master_id,
            sheet["B16"]?.v || 0,
            sheet["D16"]?.v || 0,
            sheet["F16"]?.v || 0,
            sheet["G17"]?.v || "",
            sheet["G18"]?.v || 0,
            sheet["G19"]?.v || 0,
          ]
        );





        const remarks = sheet["D36"]?.v || "";
        for (let row = 26; row <= 35; row++) {
  const position = sheet[`A${row}`]?.v?.trim() || "";
  if (!position) continue;

  const sanctioned = sheet[`D${row}`]?.v || 0;
  const no_vacant = [26, 28, 29, 31, 35].includes(row) ? sheet[`F${row}`]?.v || 0 : null;
  const vacant_since = row === 35 ? sheet["G35"]?.v || "" : null;

  // 🔍 Get iii_master ID from master_iii_disha_staff_details table using position name
  const [masterRows] = await pool.query(
    `SELECT id FROM master_iii_disha_staff_details WHERE Name_of_the_Position = ? LIMIT 1`,
    [position]
  );
  // ❗ Skip if no matching position found
  if (masterRows.length === 0) {
    console.warn(`No matching position found for: ${position}`);
    continue;
  }

  const master_staff_id = masterRows[0].id;

  // ✅ Insert into iii_disha_staff_details
  await pool.query(
    `INSERT INTO disha_staff_details (master_id, master_staff_id, sanctioned, no_vacant, vacant_since) VALUES (?, ?, ?, ?, ?)`,
    [master_id, master_staff_id, sanctioned, no_vacant, vacant_since]
  );
}






        await pool.query(
          `INSERT INTO Details_of_NACP_facilities_in_the_district (master_id, TI, LWS, OST_center, Prisons, OCS, One_Stop_Centre) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            master_id,
            sheet["B48"]?.v || 0,
            sheet["C48"]?.v || 0,
            sheet["D48"]?.v || 0,
            sheet["E48"]?.v || 0,
            sheet["F48"]?.v || 0,
            sheet["G48"]?.v || 0,
          ]
        );






       for (let row = 62; row <= 78; row++) {
  const indicator = sheet[`A${row}`]?.v?.trim() || "";
  if (!indicator) continue;

  const achievement = sheet[`C${row}`]?.v || 0;
  const new_registration = [62, 63, 64, 66].includes(row) ? sheet[`D${row}`]?.v || 0 : null;
  const no_of_lfus = [63, 70, 71, 74, 75, 76, 77].includes(row) ? sheet[`F${row}`]?.v || 0 : null;

  // 🔍 Get v_master_id by looking up the indicator text
  const [vMasterRows] = await pool.query(
    `SELECT id FROM master_v_major_performance_indicators_of_nacp_services WHERE Indicator = ? LIMIT 1`,
    [indicator]
  );

  if (vMasterRows.length === 0) {
    console.warn(`No matching indicator found for: ${indicator}`);
    continue;
  }

  const v_master_id = vMasterRows[0].id;

  // ✅ Insert into major_performance_indicators_of_nacp_services
  await pool.query(
    `INSERT INTO major_performance_indicators_of_nacp_services (master_id, v_master_id, achievement, new_registration, no_of_lfus) VALUES (?, ?, ?, ?, ?)`,
    [master_id, v_master_id, achievement, new_registration, no_of_lfus]
  );
}














        for (let row = 82; row <= 97; row++) {
  const indicator = sheet[`A${row}`]?.v?.trim() || "";
  if (!indicator) continue;

  const number =[82,83,84,85,86,87,88,89,90,91,92].includes(row) ? sheet[`C${row}`]?.v || 0 : null;
  const no_of_lfus = [85,86,90,91].includes(row) ? sheet[`D${row}`]?.v || 0 : null;
  const Target = [94,95,96].includes(row) ? sheet[`C${row}`]?.v || 0 : null;
  const No_tested = [94,95,96].includes(row) ? sheet[`D${row}`]?.v || 0 : null;
  const Found_HIV_Positive = [94,95,96].includes(row) ? sheet[`E${row}`]?.v || 0 : null;
  const Left_Outs = [94,95,96].includes(row) ? sheet[`E${row}`]?.v || 0 : null;  
  const Remarks = [94,95,96].includes(row) ? sheet[`E${row}`]?.v || '' : ''; 
  const other= sheet["B97"]?.v || '';

  // 🔍 Get v_master_id by looking up the indicator text
  const [viMasterRows] = await pool.query(
    `SELECT id FROM master_vi_evths WHERE Indicator = ? LIMIT 1`,
    [indicator]
  );

  if (viMasterRows.length === 0) {
    console.warn(`No matching indicator found for: ${indicator}`);
    continue;
  }

  const vi_master_id = viMasterRows[0].id;

  // ✅ Insert into major_performance_indicators_of_nacp_services
  await pool.query(
    `INSERT INTO evths (master_id, vi_master_id, number, no_of_lfus, Target, No_tested, Found_HIV_Positive, Left_Outs, Remarks,other) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [master_id, vi_master_id, number, no_of_lfus, Target,No_tested,Found_HIV_Positive,Left_Outs,Remarks,other]
  );
}







        for (let row = 102; row <= 103; row++) {
          const campaign_name = sheet[`A${row}`]?.v;
          if (!campaign_name) continue;
          await pool.query(
            `INSERT INTO Campaigns_by_DISHA (master_id, campaign_name, camps_organized, camps_visited, cumulative_coverage) VALUES (?, ?, ?, ?, ?)`,
            [
              master_id,
              campaign_name,
              sheet[`B${row}`]?.v || 0,
              sheet[`C${row}`]?.v || 0,
              sheet[`D${row}`]?.v || 0,
            ]
          );
        }

        await pool.query(
          `INSERT INTO Status_of_HIV_AIDS_Act (master_id, complaints_officer_status, complaints_officer_remarks) VALUES (?, ?, ?)`,
          [master_id, sheet["D109"]?.v || "", sheet["F109"]?.v || ""]
        );

        await pool.query(
          `INSERT INTO discrimination_cases_reported_during_the_month (master_id, stigma_case_description) VALUES (?, ?)`,
          [master_id, sheet["A113"]?.v || ""]
        );

        


await pool.query(
    `INSERT INTO community_system_strengthening ( master_id, district_crg_constituted,date_of_notification) VALUES (?, ?, ?)`,
    [master_id,
    sheet["D120"]?.v || "no",
    sheet["G120"]?.w || "",
  ]
  );


for (let row = 122; row <= 126; row++) {
  const Description = sheet[`A${row}`]?.v?.trim() || "";
  if (!Description) continue;

  const cumulative_fy = sheet[`E${row}`]?.v || 0;
  const remarks = sheet[`F${row}`]?.v || "";
  
  // 🔍 Get v_master_id by looking up the indicator text
  const [vMasterRows] = await pool.query(
    `SELECT id FROM master_community_system_strengthening WHERE Description  = ? LIMIT 1`,
    [Description]
  );
  

  if (vMasterRows.length === 0) {
    consolearn(`No matching indicator found for: ${Description}`);
    continue;
  }

  const v_master_id = vMasterRows[0].id;

  // ✅ Insert into major_performance_indicators_of_nacp_services
  await pool.query(
    `INSERT INTO community_system_strengthening ( master_id, cumulative_fy, remarks,  master_community_id) VALUES (?, ?, ?, ?)`,
    [master_id, cumulative_fy, remarks, v_master_id]
  );
}














const roles = ['DACO', 'DPM/CPM', 'DIS/CSO', 'DA-M&E', 'DA-Accounts', 'DA-Programme', 'DMDO'];
const X = {};

// Step 1: Initialize helper
function ensureRole(role) {
  if (!X[role]) X[role] = {};
}

// Step 2: Extract Excel blocks
for (let row = 132; row <= 138; row++) {
  const role = sheet[`A${row}`]?.v?.trim() || "";
  if (role && roles.includes(role)) {
    ensureRole(role);
    X[role]["total_visits"] = sheet[`B${row}`]?.v || 0;
    X[role]["TI"] = sheet[`C${row}`]?.v || 0;
    X[role]["LWS"] = sheet[`D${row}`]?.v || 0;
    X[role]["One_Stop_Centre"] = sheet[`E${row}`]?.v || 0;
    X[role]["Prisons"] = sheet[`F${row}`]?.v || 0;
    X[role]["OCS"] = sheet[`G${row}`]?.v || 0;
  }
}

for (let row = 140; row <= 146; row++) {
  const role = sheet[`A${row}`]?.v?.trim() || "";
  if (role && roles.includes(role)) {
    ensureRole(role);
    X[role]["OST_center"] = sheet[`B${row}`]?.v || 0;
    X[role]["ICTC"] = sheet[`C${row}`]?.v || 0;
    X[role]["SSK"] = sheet[`D${row}`]?.v || 0;
    X[role]["DSRC"] = sheet[`E${row}`]?.v || 0;
    X[role]["ART_Centre"] = sheet[`F${row}`]?.v || 0;
    X[role]["Link_ART_Centre"] = sheet[`G${row}`]?.v || 0;
  }
}

for (let row = 148; row <= 154; row++) {
  const role = sheet[`A${row}`]?.v?.trim() || "";
  if (role && roles.includes(role)) {
    ensureRole(role);
    X[role]["CSC"] = sheet[`B${row}`]?.v || 0;
    X[role]["VL_lab"] = sheet[`D${row}`]?.v || 0;
    X[role]["SRL"] = sheet[`F${row}`]?.v || 0;
  }
}

// Step 3: Insert with role ID lookup
for (const role of Object.keys(X)) {
  const data = X[role];
  const keys = Object.keys(data);
  const values = Object.values(data);

  // 🔍 Lookup master_monitoring_and_supportive_supervision.id by role description
  const [rows] = await pool.query(
    `SELECT id FROM master_monitoring_and_supportive_supervision WHERE Description = ? LIMIT 1`,
    [role]
  );

  if (rows.length === 0) {
    console.warn(`No matching master ID found for role: ${role}`);
    continue;
  }

  const master_monitoring_id = rows[0].id;

  // ✅ Insert into monitoring_and_supportive_supervision table
  await pool.query(
    `INSERT INTO monitoring_and_supportive_supervision (master_id, role, ${keys.join(", ")}, master_monitoring_id) VALUES (?, ?, ${keys.map(() => "?").join(", ")}, ?)`,
    [master_id, role, ...values, master_monitoring_id]
  );
}












let lastCommodity = ""; // ⬅️ Holds the last known Status_of_Commodity

for (let row = 188; row <= 223; row++) {
  const rawCommodity = sheet[`A${row}`]?.v?.trim();
  if (rawCommodity) lastCommodity = rawCommodity; // Update only if non-empty

  const Status_of_Commodity = lastCommodity;
  const lists = sheet[`B${row}`]?.v?.trim() || "";

  // For commodities that don't use `lists`, skip or set null
  const isListRequired = !['Stock status of condoms', 'Stock status of Needle/Syringe'].includes(Status_of_Commodity);
  const listValue = isListRequired ? lists : null;

  const Quantity_available = sheet[`C${row}`]?.v || 0;
  const No_of_months = sheet[`D${row}`]?.v || 0;

  // 🔍 Lookup in master table using relevant fields
  let masterQuery = `SELECT id FROM master_vi_stock_status_of_the_commodities WHERE Status_of_Commodity = ?`;
  let queryParams = [Status_of_Commodity];

  if (isListRequired) {
    masterQuery += ` AND lists = ? LIMIT 1`;
    queryParams.push(listValue);
  } else {
    masterQuery += ` LIMIT 1`;
  }

  const [masterRows] = await pool.query(masterQuery, queryParams);

  // ❗ Skip if no matching master row found
  if (masterRows.length === 0) {
    console.warn(`No master match for: ${Status_of_Commodity} ${isListRequired ? `- ${listValue}` : ''}`);
    continue;
  }

  const master_stock_status_id = masterRows[0].id;

  // ✅ Insert into stock_status_of_the_commodities
  await pool.query(
    `INSERT INTO stock_status_of_the_commodities (master_id, master_stock_status_of_the_commodities, Quantity_available, No_of_months) VALUES (?, ?, ?, ?)`,
    [master_id, master_stock_status_id, Quantity_available, No_of_months]
  );
}

        

          const Qualitative_Section = {
  DISHA_receive_feedback: sheet["G160"]?.v || "No",
  Best_Practices_or_Acheivement_during_the_month:
    (sheet["A228"]?.v || "") + " " +
    (sheet["A229"]?.v || "") + " " +
    (sheet["A230"]?.v || "") + " " +
    (sheet["A231"]?.v || "") + " " +
    (sheet["A232"]?.v || "") + " " +
    (sheet["A233"]?.v || ""),
  Remarks: sheet["A225"]?.v || "Nil",
};

await pool.query(
  `INSERT INTO Qualitative_Section (master_id, DISHA_receive_feedback, Best_Practices_or_Acheivement_during_the_month, Remarks) VALUES (?, ?, ?, ?)`,
  [master_id, ...Object.values(Qualitative_Section)]
);



const meetingRows = [
  { row: 177, name: sheet[`A177`]?.v?.trim() || "", total: (sheet[`C177`]?.v || 0 + sheet[`C178`]?.v || 0 + sheet[`C179`]?.v || 0 + sheet[`C180`]?.v || 0), attended: (sheet[`D177`]?.v || 0 + sheet[`D178`]?.v || 0 + sheet[`D179`]?.v || 0 + sheet[`D180`]?.v || 0)},
  { row: 181, name: sheet[`A181`]?.v?.trim() || "", total: sheet[`C181`]?.v || 0, attended: sheet[`D181`]?.v || 0 },
  { row: 182, name: sheet[`A182`]?.v?.trim() || "", total: sheet[`C182`]?.v || 0, attended: sheet[`D182`]?.v || 0 },
  { row: 183, name: sheet[`A183`]?.v?.trim() || "", total: sheet[`C183`]?.v || 0, attended: sheet[`D183`]?.v || 0 },
];

for (const meeting of meetingRows) {
  if (!meeting.name) continue;

  // Check if name exists in master_meeting table
  const [result] = await pool.query(
    `SELECT id FROM master_meeting WHERE Name_of_the_Meeting = ? LIMIT 1`,
    [meeting.name]
  );
  const [test] = await pool.query(
    `select Name_of_the_Meeting from master_meeting where id=1`
  )
console.log(test);
  if (result.length === 0) {
    console.warn(`No match in master_meeting for: "${meeting.name}" (row ${meeting.row})`);
    continue;
  }

  const master_meeting_id = result[0].id;

  // Insert only if match found
  await pool.query(
    `INSERT INTO meeting (master_id, Total_No_of_meetings, No_of_persons_attended, master_meeting_id)
     VALUES (?, ?, ?, ?)`,
    [master_id, meeting.total, meeting.attended, master_meeting_id]
  );
}






        console.log(`✅ Inserted data for file: ${file.path}`);
        
      }
    }

    fs.unlinkSync(zipPath);
    res.json({ message: "Excel data extracted and inserted into MySQL successfully." });
  } catch (err) {
    console.error("❌ Error processing ZIP:", err);
    res.status(500).json({ error: "Failed to process file." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
