// utils/deptMap.js
// Maps full department names → short codes and vice versa

const DEPT_TO_CODE = {
  "Computer Science and Engineering":          "CSE",
  "Communication and Computer Engineering":    "CCE",
  "Electronics and Communication Engineering": "ECE",
  "Mechanical-Mechatronics Engineering":       "MME",
  "Humanities and Social Sciences":            "HSS",
  "Physics":                                   "Physics",
  "Mathematics":                               "Mathematics",
  "Chemical Engineering":                      "Chemical Engineering",
  "Artifical Intelligence and Data Science":     "AI&DS",
};

const CODE_TO_DEPT = Object.fromEntries(
  Object.entries(DEPT_TO_CODE).map(([k, v]) => [v, k])
);

/** "Computer Science and Engineering" → "CSE" */
exports.toCode = (fullName) =>
  DEPT_TO_CODE[fullName] || fullName;

/** "CSE" → "Computer Science and Engineering" */
exports.toFull = (code) =>
  CODE_TO_DEPT[code] || code;