const express = require("express");
const cors = require("cors");
require("dotenv").config();

const appointmentRoutes = require("./src/routes/appointmentRoutes");
const patientRoutes = require("./src/routes/patientRoutes");
const authRoutes = require("./src/routes/authRoutes");
const doctorRoutes = require("./src/routes/doctorsRoutes");
const app = express();
const medicalRecordRoutes = require('./src/routes/medicalRecordRoutes');
const errorHandler = require('./src/middleware/errorMiddleware');
const billingRoutes = require('./src/routes/billingRoutes');
const usersRoutes = require("./src/routes/usersRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const receptionistRoutes = require("./src/routes/receptionistRoutes");
const adminRoutes = require("./src/routes/adminRoutes");




app.use(cors());
app.use(express.json());

app.use("/api/patients", patientRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use('/api/billing', billingRoutes);


app.use("/api/doctors", doctorRoutes);
app.use("/api/users", usersRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/receptionist", receptionistRoutes);

app.use(errorHandler);
app.get("/", (req, res) => {
  res.send("Hospital Management API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
