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
      .sort({ createdAt: -1 })
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

// const getAppointment = async (req, res) => {
//   const { id, date } = req.query;
//   let filter = {};
// if (id) filter.patientId = id;
//   if (date) {
//     // Match only appointments for that specific date
//     const startOfDay = new Date(date);
//     startOfDay.setHours(0, 0, 0, 0);
//     const endOfDay = new Date(date);
//     endOfDay.setHours(23, 59, 59, 999);

//     filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
//   }

//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;

//   try {
//     const appointments = await Appointments.find(filter)
//       .sort({ appointmentDate: -1 }) // newest first
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .populate("patientId", "name age gender phoneNumber address email");

//       console.log("appointmetsn",appointments)

//     const total = await Appointments.countDocuments(filter);

//     res.status(200).json({
//       msg: "Appointments fetched successfully",
//       data: appointments,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalRecords: total,
//         hasNextPage: page * limit < total,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching appointments", error);
//     res.status(500).json({ msg: "Internal server error" });
//   }
// };

const getAppointment = async (req, res) => {
  const { id, startDate, endDate } = req.query;
  let filter = {};

  if (id) filter.patientId = id;

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.appointmentDate = { $gte: start, $lte: end };
  } else if (startDate && !endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(startDate);
    end.setHours(23, 59, 59, 999);
    filter.appointmentDate = { $gte: start, $lte: end };
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Step 1: Get paginated appointments
    const appointments = await Appointments.find(filter)
      .sort({ appointmentDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("patientId", "name age gender phoneNumber address email")
      .lean();

    // Step 2: For each appointment's patientId, calculate and update their pending balance
    for (let appt of appointments) {
      if (appt.patientId?._id) {
        const balances = await Appointments.aggregate([
          { $match: { patientId: appt.patientId._id } },
          {
            $group: {
              _id: "$patientId",
              totalPending: {
                $sum: { $subtract: ["$totalAmount", "$paidAmount"] },
              },
            },
          },
        ]);

        const pendingBalance =
          balances.length > 0 ? balances[0].totalPending : 0;
        appt.patientPendingBalance = pendingBalance;

        // Update the patient document with the pending balance
        await Appointments.findByIdAndUpdate(
          appt._id, // appointment _id
          {
            previousBalance: pendingBalance,
            lastBalanceUpdate: new Date(),
          },
          { upsert: false }
        );
      } else {
        appt.patientPendingBalance = 0;
      }
    }
    // Convert UTC to IST (+5:30)
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const appointmentsIST = appointments.map((app) => ({
      ...app,
      appointmentDateIST: new Date(app.appointmentDate.getTime() + IST_OFFSET),
    }));

    const total = await Appointments.countDocuments(filter);

    res.status(200).json({
      msg: "Appointments fetched successfully",
      data: appointmentsIST,
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

const searchPatients = async (req, res) => {
  try {
    console.log("wnwdjs", req.query);

    const { query } = req.query;

    let searchConditions = {};

    if (query && query.trim().length > 0) {
      const searchQuery = query.trim();
      const orConditions = [{ name: { $regex: searchQuery, $options: "i" } }];

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
      for (let patient of patients) {
      const latestAppointment = await Appointments.findOne(
        { patientId: patient._id },
        { previousBalance: 1 },
        { sort: { lastBalanceUpdate: -1 } }
      );

      patient.pendingBalance = latestAppointment?.previousBalance || 0;
    }

    res.status(200).json({
      success: true,
      message: "Patients retrieved successfully",
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching patients",
      error: error.message,
    });
  }
};
const appointmentDetails = async (req, res) => {
  try {
    const newAppointment = await Appointments.create(req.body);
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
    const totalPatientsPromise = Patients.countDocuments();

    // --- Start of Corrected Timezone Logic ---
    const now = new Date();
    const IST_OFFSET = 330;
    const istNow = new Date(now.getTime() + IST_OFFSET * 60000);

    // ✅ FIX: Use getUTC... methods to correctly extract the date parts for IST
    const istStartOfDay = new Date(
      Date.UTC(
        istNow.getUTCFullYear(),
        istNow.getUTCMonth(),
        istNow.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );

    const istEndOfDay = new Date(
      Date.UTC(
        istNow.getUTCFullYear(),
        istNow.getUTCMonth(),
        istNow.getUTCDate(),
        23,
        59,
        59,
        999
      )
    );

    // Convert IST start/end to the correct UTC query range
    const utcStartOfDay = new Date(
      istStartOfDay.getTime() - IST_OFFSET * 60000
    );
    const utcEndOfDay = new Date(istEndOfDay.getTime() - IST_OFFSET * 60000);
    // --- End of Corrected Timezone Logic ---

    const todaysAppointmentsPromise = Appointments.countDocuments({
      appointmentDate: { $gte: utcStartOfDay, $lte: utcEndOfDay },
    });

    const totalRevenuePromise = Appointments.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const pendingAmountPromise = Appointments.aggregate([
      { $match: { $expr: { $lt: ["$paidAmount", "$totalAmount"] } } },
      {
        $group: {
          _id: null,
          totalPending: {
            $sum: { $subtract: ["$totalAmount", "$paidAmount"] },
          },
        },
      },
    ]);

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
