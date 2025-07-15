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

// Insert into master_table
await pool.query(
  `INSERT INTO master_table (id, state, district, cluster_hq, month, year) VALUES (?, ?, ?, ?, ?, ?)`,
  [master_id, ...Object.values(master_info)]
);


        // ✅ Pass master_id in all insert queries below

        await pool.query(
          `INSERT INTO I_District_at_a_Glance (master_id, prevalence_rate, estimated_plhivs) VALUES (?, ?, ?)`,
          [master_id, sheet["B11"]?.v || "", sheet["F11"]?.v || 0]
        );

        await pool.query(
          `INSERT INTO II_Epidemic_Status_of_the_district (master_id, status1, status2, status3, category, pregnant_positive, hiv_surveillance_year)
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
        const remarks = sheet["D36"]?.v || "nil";
        for (let row = 26; row <= 35; row++) {
          const position = sheet[`A${row}`]?.v || "";
          if (!position) continue;

          const sanctioned = sheet[`D${row}`]?.v || 0;
          const no_vacant = [26, 28, 29, 31, 35].includes(row) ? sheet[`F${row}`]?.v || 0 : null;
          const vacant_since = row === 35 ? sheet["G35"]?.v || "" : null;

          await pool.query(
            `INSERT INTO III_DISHA_Staff_details (master_id, position, sanctioned, no_vacant, vacant_since, remarks) VALUES (?, ?, ?, ?, ?, ?)`,
            [master_id, position, sanctioned, no_vacant, vacant_since, remarks]
          );
        }

        await pool.query(
          `INSERT INTO IV_Details_of_NACP_facilities_in_the_district (master_id, TI, LWS, OST_center, Prisons, OCS, One_Stop_Centre) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
          const indicator = sheet[`A${row}`]?.v || "";
          if (!indicator) continue;

          const achievement = sheet[`C${row}`]?.v || 0;
          const new_registration = [62, 63, 64, 66].includes(row) ? sheet[`D${row}`]?.v || 0 : null;
          const no_of_lfus = [63, 70, 71, 74, 75, 76, 77].includes(row) ? sheet[`F${row}`]?.v || 0 : null;

          await pool.query(
            `INSERT INTO V_Major_performance_Indicators_of_NACP_Services (master_id, indicator, achievement, new_registration, no_of_lfus) VALUES (?, ?, ?, ?, ?)`,
            [master_id, indicator, achievement, new_registration, no_of_lfus]
          );
        }

        for (let row = 82; row <= 92; row++) {
          const indicator = sheet[`A${row}`]?.v || "";
          const number = sheet[`C${row}`]?.v || 0;
          const no_of_lfus = [85, 86, 90, 91].includes(row) ? sheet[`F${row}`]?.v || 0 : null;
          if (!indicator) continue;

          await pool.query(
            `INSERT INTO  VI_EVTHS (master_id, indicator, number, no_of_lfus) VALUES (?, ?, ?, ?)`,
            [master_id, indicator, number, no_of_lfus]
          );
        }

        for (let row = 94; row <= 96; row++) {
          const days = sheet[`B${row}`]?.v;
          if (!days) continue;
          await pool.query(
            `INSERT INTO VI_Number_of_children_tested_as_per_EID (master_id, days_label, target_due, no_tested, found_positive, left_out, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              master_id,
              days,
              sheet[`C${row}`]?.v || 0,
              sheet[`D${row}`]?.v || 0,
              sheet[`E${row}`]?.v || 0,
              sheet[`F${row}`]?.v || 0,
              sheet[`G${row}`]?.v || "",
            ]
          );
        }

        await pool.query(
          `INSERT INTO VI_Other_Specify (master_id, other_specify) VALUES (?, ?)`,
          [master_id, sheet["B97"]?.v || ""]
        );

        for (let row = 102; row <= 103; row++) {
          const campaign_name = sheet[`A${row}`]?.v;
          if (!campaign_name) continue;
          await pool.query(
            `INSERT INTO VI_Campaigns_by_DISHA (master_id, campaign_name, camps_organized, camps_visited, cumulative_coverage) VALUES (?, ?, ?, ?, ?)`,
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
          `INSERT INTO VII_Status_of_HIV_AIDS_Act (master_id, complaints_officer_status, complaints_officer_remarks) VALUES (?, ?, ?)`,
          [master_id, sheet["D109"]?.v || "", sheet["F109"]?.v || ""]
        );

        await pool.query(
          `INSERT INTO VIII_discrimination_cases_reported_during_the_month (master_id, stigma_case_description) VALUES (?, ?)`,
          [master_id, sheet["A113"]?.v || ""]
        );

        const district_crg_constituted = sheet["D120"]?.v || "no";
const date_of_notification = sheet["G120"]?.w || "";

for (let row = 122; row <= 126; row++) {
  const description = sheet[`A${row}`]?.v || "";
  const cumulative_fy = sheet[`D${row}`]?.v || 0;
  const remarks = sheet[`D${row}`]?.v || "";

  if (description) {
    await pool.query(
      `INSERT INTO ix_community_system_strengthening (master_id, district_crg_constituted, date_of_notification, description, cumulative_fy, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [master_id, district_crg_constituted, date_of_notification, description, cumulative_fy, remarks]
    );
  }
}


        const roles = ['DACO', 'DPM/CPM', 'DIS/CSO', 'DA-M&E', 'DA-Accounts', 'DA-Programme', 'DMDO'];
const X = {};

// Step 1: Helper function to initialize role object
function ensureRole(role) {
  if (!X[role]) X[role] = {};
}

// Step 2: Extract all data into X from sheet

// 📘 Block 1: Rows 132–138
for (let row = 132; row <= 138; row++) {
  const role = sheet[`A${row}`]?.v || "";
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

// 📘 Block 2: Rows 140–146
for (let row = 140; row <= 146; row++) {
  const role = sheet[`A${row}`]?.v || "";
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

// 📘 Block 3: Rows 148–154
for (let row = 148; row <= 154; row++) {
  const role = sheet[`A${row}`]?.v || "";
  if (role && roles.includes(role)) {
    ensureRole(role);
    X[role]["CSC"] = sheet[`B${row}`]?.v || 0;
    X[role]["VL_lab"] = sheet[`D${row}`]?.v || 0;
    X[role]["SRL"] = sheet[`F${row}`]?.v || 0;
  }
}

// Step 3: Insert into MySQL
for (const role of Object.keys(X)) {
  const data = X[role];
  const keys = Object.keys(data);
  const values = Object.values(data);

  await pool.query(
    `INSERT INTO X_Monitoring_and_supportive_supervision (master_id, role, ${keys.join(", ")}) VALUES (?, ?, ${keys.map(() => "?").join(", ")})`,
    [master_id, role, ...values]
  );
}
        //   const Qualitative_Section ={
        //     DISHA_receive_feedback:sheet["G160"]?.v || "No",
        //     Best_Practices_or_Acheivement_during_the_month:(sheet["A228"]?.v || "") + " " + (sheet["A229"]?.v || "")+ " " + (sheet["A230"]?.v || "")+ " " + (sheet["A231"]?.v || "")+ " " + (sheet["A232"]?.v || "")+ " " + (sheet["A233"]?.v || ""),
        //     Remarks: sheet["A225"]?.v || "Nil",
        //   };
        //   const kits={};
        //    for (let row = 188; row <= 195; row++) {
        //     const kit = sheet[`B${row}`]?.v || "";
        //     const Quantity_available  = sheet[`C${row}`]?.v || 0;
        //     const No_of_months   = sheet[`D${row}`]?.v || 0;
          

        //     if (kit) {
        //     kits[kit] = {
        //         "Quantity_available": Quantity_available,
        //         "No_of_months": No_of_months,     
        //     };
        //   };
        // };
          
        //   const drugs={};
        //    for (let row = 196; row <= 210; row++) {
        //     const drug = sheet[`B${row}`]?.v || "";
        //     const Quantity_available  = sheet[`C${row}`]?.v || 0;
        //     const No_of_months   = sheet[`D${row}`]?.v || 0;
          

        //     if (drug) {
        //     drugs[drug] = {
        //         "Quantity_available": Quantity_available,
        //         "No_of_months": No_of_months,     
        //     };
        //   };
        // };

        //   const STI_color_coded_kits={};
        //    for (let row = 211; row <= 218; row++) {
        //     const kit = sheet[`B${row}`]?.v || "";
        //     const Quantity_available  = sheet[`C${row}`]?.v || 0;
        //     const No_of_months   = sheet[`D${row}`]?.v || 0;
          

        //     if (kit) {
        //     STI_color_coded_kits[kit] = {
        //         "Quantity_available": Quantity_available,
        //         "No_of_months": No_of_months,     
        //     };
        //   };
          
        // };



        // const stock_condom_needle_Syringe={
        //   condom:{Quantity_available:sheet["C222"]?.v || 0,
        //     No_of_months:sheet["D222"]?.v || 0,
        //   },
        //   Needle_Syringe:{Quantity_available:sheet["C223"]?.v || 0,
        //     No_of_months:sheet["D223"]?.v || 0,
        //   },
        // };
        
        // meeting={
        //   Dictrict_level_meeting:{Total_No_of_meetings:(sheet["C177"]?.v || 0 + sheet["C178"]?.v || 0 + sheet["C179"]?.v || 0 +sheet["C180"]?.v || 0),
        //     No_of_persons_attended :(sheet["D177"]?.v || 0 + sheet["D178"]?.v || 0 + sheet["D179"]?.v || 0 +sheet["D180"]?.v || 0)},
        //   DAPCC_meeting:{
        //     Total_No_of_meetings:sheet["C181"]?.v || 0,
        //     No_of_persons_attended :sheet["D181"]?.v || 0
        //   },
        //   Meetings_with_other_line_departments:{
        //     Total_No_of_meetings:sheet["C182"]?.v || 0,
        //     No_of_persons_attended :sheet["D182"]?.v || 0
        //   },
        //    Other_meetings:{
        //     Total_No_of_meetings:sheet["C183"]?.v || 0,
        //     No_of_persons_attended :sheet["D183"]?.v || 0
        //   },
        // };

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



for (let row = 188; row <= 195; row++) {
  const kit = sheet[`B${row}`]?.v || "";
  const Quantity_available = sheet[`C${row}`]?.v || 0;
  const No_of_months = sheet[`D${row}`]?.v || 0;

  if (kit) {
    await pool.query(
      `INSERT INTO kits (master_id, kit_name, Quantity_available, No_of_months) VALUES (?, ?, ?, ?)`,
      [master_id, kit, Quantity_available, No_of_months]
    );
  }
}



for (let row = 196; row <= 210; row++) {
  const drug = sheet[`B${row}`]?.v || "";
  const Quantity_available = sheet[`C${row}`]?.v || 0;
  const No_of_months = sheet[`D${row}`]?.v || 0;

  if (drug) {
    await pool.query(
      `INSERT INTO drugs (master_id, drug_name, Quantity_available, No_of_months) VALUES (?, ?, ?, ?)`,
      [master_id, drug, Quantity_available, No_of_months]
    );
  }
}


for (let row = 211; row <= 218; row++) {
  const kit = sheet[`B${row}`]?.v || "";
  const Quantity_available = sheet[`C${row}`]?.v || 0;
  const No_of_months = sheet[`D${row}`]?.v || 0;

  if (kit) {
    await pool.query(
      `INSERT INTO STI_color_coded_kits (master_id, kit_name, Quantity_available, No_of_months) VALUES (?, ?, ?, ?)`,
      [master_id, kit, Quantity_available, No_of_months]
    );
  }
}




await pool.query(
  `INSERT INTO stock_condom_needle_Syringe (master_id, item_type, Quantity_available, No_of_months) VALUES (?, ?, ?, ?)`,
  [master_id, "condom", sheet["C222"]?.v || 0, sheet["D222"]?.v || 0]
);

await pool.query(
  `INSERT INTO stock_condom_needle_Syringe (master_id, item_type, Quantity_available, No_of_months) VALUES (?, ?, ?, ?)`,
  [master_id, "Needle_Syringe", sheet["C223"]?.v || 0, sheet["D223"]?.v || 0]
);



// Dictrict_level_meeting (C177 to C180, D177 to D180)
let total_meetings = 0;
let total_attended = 0;
for (let i = 177; i <= 180; i++) {
  total_meetings += sheet[`C${i}`]?.v || 0;
  total_attended += sheet[`D${i}`]?.v || 0;
}
await pool.query(
  `INSERT INTO meeting (master_id, meeting_type, Total_No_of_meetings, No_of_persons_attended) VALUES (?, ?, ?, ?)`,
  [master_id, "Dictrict_level_meeting", total_meetings, total_attended]
);

// Other meeting types
const meetingTypes = [
  { type: "DAPCC_meeting", row: 181 },
  { type: "Meetings_with_other_line_departments", row: 182 },
  { type: "Other_meetings", row: 183 },
];

for (const m of meetingTypes) {
  await pool.query(
    `INSERT INTO meeting (master_id, meeting_type, Total_No_of_meetings, No_of_persons_attended) VALUES (?, ?, ?, ?)`,
    [
      master_id,
      m.type,
      sheet[`C${m.row}`]?.v || 0,
      sheet[`D${m.row}`]?.v || 0,
    ]
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
