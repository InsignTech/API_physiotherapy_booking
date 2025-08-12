import Patients from "../modals/patientsSchema.js";
import Appointments from "../modals/appointmentSchema.js";

const addPatients = async (req, res) => {
  const { name, phoneNumber } = req.body;
  console.log("sdd", req.body);
  try {
    const existPatient = await Patients.findOne({
      phoneNumber,
      name: { $regex: `^${name}$`, $options: "i" },
    });
    console.log("exist", existPatient);
    if (existPatient) {
      return res.status(400).json({
        msg: "Patient already exist",
      });
    }
    const patientDetails = await Patients.create(req.body);
    console.log("details", patientDetails);
    return res.status(201).json({
      msg: "Patient details addded successfully",
      data: patientDetails,
    });
  } catch (err) {
    res.status(400).json({
      err,
    });
  }
};

const updatePatients = async (req, res) => {
  try {
    const id = req.params.id;
    const patient = await Patients.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!patient) {
      return res.status(404).json({ msg: "not valid record in this id" });
    }
    return res.status(201).json({
      msg: "patient details updated successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(400).json({
      msg: "Error creating appointment",
      error: error.message,
    });
  }
};

const deletePatients = async (req, res) => {
  try {
    const id = req.params.id;
    const patientDetails = await Patients.deleteOne({ _id: id });
    if (!patientDetails) {
      return res.status(404).json({ msg: "invalid patient id" });
    }
    return res
      .status(200)
      .json({ msg: "the record of patients deleted successfully" });
  } catch (error) {
    console.error("error during deleting the Patient details", error);
  }
};

const getAllPatients = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const patientDetails = await Patients.find()
      .skip((page - 1) * limit)
      .limit(limit);

    // Get total number of matching patients
    const total = await Patients.countDocuments();

    // Send paginated response
    return res.status(200).json({
      msg: "Patients fetched successfully",
      data: patientDetails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error during fetching patients:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

const getAppointment = async (req, res) => {
  const { id } = req.params;
  let filter = {};
  if (id) {
    filter.patientId = id;
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const appointments = await Appointments.find(filter)
      .sort({ appointmentDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!appointments || appointments.length === 0) {
      return res
        .status(404)
        .json({ msg: "No appointments found for this patient ID" });
    }

    const total = await Appointments.countDocuments({ patientId: id });

    return res.status(200).json({
      msg: "Appointments fetched successfully",
      data: appointments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error during fetching appointments", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

const searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
    let searchConditions = {};

    if (query && query.trim().length > 0) {
      const searchQuery = query.trim();
      const orConditions = [
        { name: { $regex: searchQuery, $options: "i" } }
      ];

      // Only add phoneNumber search if the query is a number
      if (!isNaN(searchQuery)) {
        orConditions.push({ phoneNumber: Number(searchQuery) });
      }

      searchConditions = { $or: orConditions };
    }

    const patients = await Patients.find(searchConditions)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      message: "Patients retrieved successfully",
      data: patients
    });

  } catch (error) {
    console.error("Error during searching patients:", error);
    res.status(500).json({
      success: false,
      message: "Error searching patients",
      error: error.message
    });
  }
};
const appointmentDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const newAppointment = await Appointments.create({
      patientId: id,
      ...req.body,
    });
    return res.status(201).json({
      msg: "Appointment created successfully",
      data: newAppointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(400).json({
      msg: "Error creating appointment",
      error: error.message,
    });
  }
};

const updateAppointmentDetails = async (req, res) => {
  const { id } = req.params;
  const { paidAmount, appointmentDate } = req.body;
  try {
    const existingAppointment = await Appointments.findById(id);
    if (!existingAppointment) {
      return res.status(404).json({ msg: "no appointment found" });
    }
    const updateUser = await Appointments.findByIdAndUpdate(
      id,
      {
        paidAmount,
        appointmentDate,
      },
      { new: true }
    );
    return res.status(201).json({
      msg: "Patient appointment details updated successfully",
      data: updateUser,
    });
  } catch (error) {
    console.error("Error during update appointment:", error);
    return res.status(400).json({ msg: "Error updating appointment", error });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const id = req.params.id;
    const appointmentDetails = await Appointments.deleteOne({ _id: id });
    if (!appointmentDetails) {
      return res.status(404).json({ msg: "no valid records found" });
    }
    return res.status(200).json({ msg: "appointment deleted successfully" });
  } catch (error) {
    console.error("error during fetching appointment", error);
  }
};

const getAllAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const appointments = await Appointments.find({ patientId: id });
    if (!appointments || appointments.length === 0) {
      return res
        .status(404)
        .json({ msg: "No appointments found for this patient ID" });
    }
    return res
      .status(200)
      .json({ msg: "appointments fetched successfully", data: appointments });
  } catch (error) {
    console.error("Error during fetching appointmnets", error);
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Total Patients

    const totalPatientsPromise = Patients.countDocuments();

    // Calculate IST start and end of today, then convert to UTC
    const now = new Date();
    // IST offset in minutes (+5:30)
    const IST_OFFSET = 330;
    // Current time in IST
    const istNow = new Date(now.getTime() + IST_OFFSET * 60000);

    // Start of day in IST
    const istStartOfDay = new Date(
      istNow.getFullYear(),
      istNow.getMonth(),
      istNow.getDate(),
      0,
      0,
      0,
      0
    );
    // End of day in IST
    const istEndOfDay = new Date(
      istNow.getFullYear(),
      istNow.getMonth(),
      istNow.getDate(),
      23,
      59,
      59,
      999
    );

    // Convert IST start/end to UTC
    const utcStartOfDay = new Date(
      istStartOfDay.getTime() - IST_OFFSET * 60000
    );
    const utcEndOfDay = new Date(istEndOfDay.getTime() - IST_OFFSET * 60000);

    // Today's Appointments in IST
    const todaysAppointmentsPromise = Appointments.countDocuments({
      appointmentDate: { $gte: utcStartOfDay, $lte: utcEndOfDay },
    });

    // Total Revenue
    const totalRevenuePromise = Appointments.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // Pending Amount
    const pendingAmountPromise = Appointments.aggregate([
      {
        $match: {
          $expr: { $lt: ["$paidAmount", "$totalAmount"] },
        },
      },
      {
        $group: {
          _id: null,
          totalPending: {
            $sum: { $subtract: ["$totalAmount", "$paidAmount"] },
          },
        },
      },
    ]);

    // Await all promises in parallel
    const [totalPatients, todaysAppointments, totalRevenue, pendingAmount] =
      await Promise.all([
        totalPatientsPromise,
        todaysAppointmentsPromise,
        totalRevenuePromise,
        pendingAmountPromise,
      ]);

    return res.status(200).json({
      msg: "Dashboard stats retrieved successfully",
      totalPatients,
      todaysAppointments,
      totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0,
      pendingAmount: pendingAmount[0] ? pendingAmount[0].totalPending : 0,
    });
  } catch (error) {
    console.error("Error retrieving dashboard stats:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

export {
  addPatients,
  updatePatients,
  deletePatients,
  getAllPatients,
  getAppointment,
  searchPatients,
  appointmentDetails,
  updateAppointmentDetails,
  getAllAppointment,
  deleteAppointment,
  getDashboardStats,
};
