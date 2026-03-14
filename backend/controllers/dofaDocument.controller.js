const CandidateApplication = require("../models/CandidateApplication");
const User = require("../models/User");
const {sendEmail} = require("../utils/emailSender")

exports.getDocumentTracking = async (req, res) => {

  const applications = await CandidateApplication
    .find()
    .populate({
      path: "candidate",
      populate: {
        path: "hod",
        select: "department email"
      }
    });

  const departments = {};

  applications.forEach(app => {

    // skip broken records
    if (!app.candidate || !app.candidate.hod) return;

    const dept = app.candidate.hod.department;

    if (!departments[dept]) {
      departments[dept] = {
        department: dept,
        candidates: []
      };
    }

    departments[dept].candidates.push({
      id: app._id,
      name: app.name,
      email: app.email,
      phone: app.phone||app.contact,
      documents: app.documents,
      verdicts: app.verdicts || {},
      referees: app.referees || [],
      accommodation: app.accommodation || false
    });

  });

  res.json(Object.values(departments));
};

/* =========================
   UPDATE DOCUMENT VERDICT
========================= */
exports.updateDocumentVerdict = async (req,res)=>{

const {appId,doc,status,remark} = req.body

const app = await CandidateApplication.findById(appId)

if(!app) return res.status(404).json({message:"Application not found"})

if(!app.verdicts) app.verdicts = {}

app.verdicts[doc] = {
status,
remark
}

app.markModified("verdicts")   // ⭐ VERY IMPORTANT

await app.save()

res.json({success:true})

}

/* =========================
   SEND REMINDER
========================= */
exports.sendReminder = async(req,res)=>{

try{
const { candidateId } = req.body

const app = await CandidateApplication.findById(candidateId)

if(!app) return res.status(404).json({message:"Application not found"})

const issues = []

Object.entries(app.verdicts || {}).forEach(([doc,val])=>{

if(val.status === "Incorrect" || val.status === "Missing"){
issues.push(`${doc} - ${val.remark || "Issue found"}`)
}

})

if(issues.length === 0){
return res.json({message:"No issues found"})
}

const message = `
Dear ${app.name},

The following documents require correction:

${issues.join("\n")}

Please upload corrected documents.

Regards,
DOFA Office
`

// call your existing email function
await sendEmail(
app.email,
"Document Correction Required",
`<pre>${message}</pre>`
)

res.json({success:true})

}catch(err){
console.error(err)
res.status(500).json({error:"Failed to send reminder"})
}

}