require('dotenv').config();
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// ARCH → AR (Architecture), RM → RE (Release Engineers)
const TEAM_MAP = { ARCH: 'AR', RM: 'RE' };

const SEED_DATA = [
  { team: 'EM',   job_title: 'Director, Core Engineering',       last: 'Takalkar',     first: 'Uttam',       location: 'Pune',      active: true  },
  { team: 'EM',   job_title: 'VP, Engineering',                  last: 'Bedi',         first: 'Sandeep',     location: 'Pune',      active: true  },
  { team: 'ARCH', job_title: 'Principal Software Architect',      last: 'More',         first: 'Rakeshkumar', location: 'Pune',      active: true  },
  { team: 'AR',   job_title: 'Security Architect Engineer',       last: 'Kataria',      first: 'Ashish',      location: 'New Delhi', active: true  },
  { team: 'AR',   job_title: 'Principal Software Architect',      last: 'DeSouza',      first: 'Stephan',     location: 'Buffalo',   active: true  },
  { team: 'FE',   job_title: 'Sr. Manager Core Engineering, SW',  last: 'Patel',        first: 'Saket',       location: 'Pune',      active: true  },
  { team: 'FE',   job_title: 'Sr. Software Engineer',             last: 'Gupta',        first: 'Lave',        location: 'Pune',      active: true  },
  { team: 'FE',   job_title: 'Principal Software Engineer',       last: 'Kato',         first: 'Koichi',      location: 'Tokyo',     active: true  },
  { team: 'FE',   job_title: 'Principal Software Engineer',       last: 'Savani',       first: 'Miteshkumar', location: 'Pune',      active: true  },
  { team: 'FE',   job_title: 'Sr. Software Engineer',             last: 'Vashishtha',   first: 'Damini',      location: 'Pune',      active: true  },
  { team: 'FE',   job_title: 'Sr. Software Engineer',             last: 'Mulik',        first: 'Sitaram',     location: 'Pune',      active: true  },
  { team: 'FE',   job_title: 'Sr. Software Engineer',             last: 'Gadhari',      first: 'Sachin',      location: 'Pune',      active: true  },
  { team: 'FE',   job_title: 'Contractor',                        last: 'Rawat',        first: 'Sakshi',      location: 'Pune',      active: true  },
  { team: 'FE',   job_title: 'Contractor',                        last: 'Lnu',          first: 'Sumit',       location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Manager Core Engineering, SW',      last: 'Dasi',         first: 'Yogesh',      location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Manager Core Engineering, SW',      last: 'Gupta Khan',   first: 'Shruti',      location: 'Pune',      active: false },
  { team: 'BE',   job_title: 'Sr. Software Engineer',             last: 'Amarelia',     first: 'Mahesh',      location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Sr. Software Engineer',             last: 'Agrawal',      first: 'Preshita',    location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Software Engineer II',              last: 'Nagarjuna',    first: 'Shiva',       location: 'Pune',      active: true  },
  { team: 'RM',   job_title: 'Sr. Software Engineer',             last: 'Avagadda',     first: 'Umashankar',  location: 'Pune',      active: true  },
  { team: 'RM',   job_title: 'Software Engineer',                 last: 'Lanje',        first: 'Chetan',      location: 'Pune',      active: true  },
  { team: 'RM',   job_title: 'Sr. Software Engineer',             last: 'Kale',         first: 'Ajit',        location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Sr. Software Engineer',             last: 'Hedau',        first: 'Chitranshu',  location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Software Engineer',                 last: 'Patni',        first: 'Vidit',       location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Sr. Software Engineer',             last: 'Sahu',         first: 'Ashwin',      location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Software Engineer',                 last: 'Jagtap',       first: 'Sonali',      location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Software Engineer',                 last: 'Singh',        first: 'Aakash',      location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Software Engineer',                 last: 'Oak',          first: 'Omkar',       location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Contractor',                        last: 'Shaji',        first: 'Swathy',      location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Contractor',                        last: 'Sharma',       first: 'Shubham',     location: 'Pune',      active: true  },
  { team: 'EM',   job_title: 'Sr. Manager, Core Engineering, QE', last: 'Ajari',        first: 'Prashant',    location: 'Pune',      active: true  },
  { team: 'QM',   job_title: 'Team Lead, Software Engineering',   last: 'Khairnar',     first: 'Pallavi',     location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'Team Lead, SQA Engineering',        last: 'Tiwari',       first: 'Mukesh',      location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'Sr. SQA Engineer',                  last: 'Talekar',      first: 'Priyanka',    location: 'Pune',      active: true  },
  { team: 'QM',   job_title: 'Principal SQA Engineer',            last: 'Deshmukh',     first: 'Nikhil',      location: 'Pune',      active: true  },
  { team: 'QM',   job_title: 'Sr. SQA Engineer',                  last: 'Chunduri',     first: 'Murali',      location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'Principal SQA Engineer',            last: 'Sojitra',      first: 'Jiteshkumar', location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'Sr. SQA Engineer',                  last: 'Singh',        first: 'Jitesh',      location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'Sr. SQA Engineer',                  last: 'Raut',         first: 'Nilam',       location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'Sr. SQA Engineer',                  last: 'Dixit',        first: 'Tarun',       location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'SQA Engineer',                      last: 'Tomar',        first: 'Deependra',   location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'SQA Engineer',                      last: 'Varadi',       first: 'Ganesh',      location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'SQA Engineer',                      last: 'Joshi',        first: 'Shubham',     location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'SQA Engineer',                      last: 'Raja',         first: 'Logesh',      location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'Sr. SQA Engineer',                  last: 'Aggarwal',     first: 'Divyam',      location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'Contractor',                        last: 'Upadhayay',    first: 'Deepak',      location: 'Pune',      active: true  },
  { team: 'QA',   job_title: 'Contractor',                        last: 'Sharma',       first: 'Ankit',       location: 'Pune',      active: true  },
  { team: 'BE',   job_title: 'Software Engineer',                  last: 'Moolchandani', first: 'Gopal',       location: 'Pune',      active: true  },
];

async function run() {
  const sql = postgres({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:      'require',
  });

  try {
    // Apply schema (drop + recreate)
    const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await sql.unsafe(schema);
    console.log('✓ Schema applied (table dropped & recreated)');

    // Insert seed rows
    const rows = SEED_DATA.map(r => ({
      first_name: r.first,
      last_name:  r.last,
      job_title:  r.job_title,
      department: (TEAM_MAP[r.team] || r.team),
      location:   r.location,
      is_active:  r.active,
    }));

    await sql`INSERT INTO resources ${sql(rows)}`;
    console.log(`✓ Seeded ${rows.length} resources`);

    // Summary
    const counts = await sql`
      SELECT department, COUNT(*) AS total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active
      FROM resources GROUP BY department ORDER BY department`;
    console.log('\nDept  Total  Active');
    counts.forEach(r => console.log(`${r.department.padEnd(5)} ${String(r.total).padEnd(6)} ${r.active}`));

  } finally {
    await sql.end();
  }
}

run().catch(err => { console.error(err.message); process.exit(1); });
