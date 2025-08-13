import Patients from "../modals/patientsSchema.js";
import Appointments from "../modals/appointmentSchema.js";

const addPatients = async (req, res) => {
  const { name, phoneNumber } = req.body;
  try {
    const existPatient = await Patients.findOne({
      phoneNumber,
      name: { $regex: `^${name}$`, $options: "i" },
    });
    if (existPatient) {
      return res.status(400).json({
        msg: "Patient already exist",
      });
    }
    const patientDetails = await Patients.create(req.body);
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
  const { id, date } = req.query;
  let filter = {};
if (id) filter.patientId = id;
  if (date) {
    // Match only appointments for that specific date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const appointments = await Appointments.find(filter)
      .sort({ appointmentDate: -1 }) // newest first
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("patientId", "name");

      console.log("appointmetsn",appointments)

    const total = await Appointments.countDocuments(filter);

    res.status(200).json({
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
    console.error("Error fetching appointments", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};


const getPatients = async (req, res) => {
  try {
    const value = req.query.query;

    if (!value) {
      return res.status(400).json({
        msg: "A search value is required.",
      });
    }

    // 1. Start with an array of conditions for the $or operator.
    //    The name is always included in the search.
    const searchConditions = [
      { name: { $regex: value, $options: "i" } },
    ];

    // 2. Check if the input value is a valid number.
    //    If it is, add the phoneNumber condition to the array.
    if (!isNaN(value) && isFinite(value)) {
      searchConditions.push({ phoneNumber: Number(value) });
    }

    // 3. Use the dynamic array of conditions in the find query.
    const patientDetails = await Patients.find({ $or: searchConditions })
      .limit(10)
      .lean();

    return res.status(200).json({
      msg: "Patient details fetched successfully",
      data: patientDetails,
    });
    
  } catch (error) {
    console.error("Error during fetching patients:", error);
    // Send a generic error response to the client
    res.status(500).json({ msg: "An error occurred while searching for patients." });
  }
};

const appointmentDetails = async (req, res) => {
  try {
    const newAppointment = await Appointments.create(
      req.body,
    );
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
    console.log("Fetching dashboard stats...");
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
  getPatients,
  appointmentDetails,
  updateAppointmentDetails,
  getAllAppointment,
  deleteAppointment,
  getDashboardStats,
};
