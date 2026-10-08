const { query } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Overview counts
    const patientsCountRes = await query('SELECT COUNT(*) FROM patients');
    const doctorsCountRes = await query('SELECT COUNT(*) FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.is_active = true');
    const todayAppRes = await query('SELECT COUNT(*) FROM appointments WHERE appointment_date = $1', [today]);
    const todayCompletedRes = await query("SELECT COUNT(*) FROM appointments WHERE appointment_date = $1 AND status = 'COMPLETED'", [today]);
    const revenueRes = await query('SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payments');
    const pendingBillsRes = await query("SELECT COUNT(*) as unpaid_count, COALESCE(SUM(total_amount), 0) as unpaid_amount FROM bills WHERE payment_status != 'PAID'");

    // 2. Appointments by status
    const appByStatusRes = await query(
      `SELECT status, COUNT(*) as count 
       FROM appointments 
       GROUP BY status`
    );

    // 3. Today's appointments schedule
    const todayAppointmentsRes = await query(
      `SELECT a.*, p.first_name, p.last_name, p.patient_code, p.phone,
              u.full_name as doctor_name, d.specialization
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.appointment_date = $1
       ORDER BY a.start_time ASC`,
      [today]
    );

    // 4. Recent visits
    const recentVisitsRes = await query(
      `SELECT v.*, p.first_name, p.last_name, p.patient_code,
              u.full_name as doctor_name, d.specialization
       FROM visits v
       JOIN patients p ON v.patient_id = p.id
       JOIN doctors d ON v.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       ORDER BY v.created_at DESC
       LIMIT 5`
    );

    // 5. Recent payments
    const recentPaymentsRes = await query(
      `SELECT pay.*, b.bill_number, p.first_name, p.last_name
       FROM payments pay
       JOIN bills b ON pay.bill_id = b.id
       JOIN patients p ON b.patient_id = p.id
       ORDER BY pay.payment_date DESC
       LIMIT 5`
    );

    // 6. Doctor workload
    const doctorStatsRes = await query(
      `SELECT d.id, u.full_name, d.specialization,
              COUNT(DISTINCT a.id) as total_appointments,
              COUNT(DISTINCT v.id) as completed_visits
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN appointments a ON a.doctor_id = d.id
       LEFT JOIN visits v ON v.doctor_id = d.id
       GROUP BY d.id, u.full_name, d.specialization
       ORDER BY total_appointments DESC`
    );

    res.json({
      success: true,
      stats: {
        total_patients: parseInt(patientsCountRes.rows[0].count, 10),
        total_doctors: parseInt(doctorsCountRes.rows[0].count, 10),
        today_appointments: parseInt(todayAppRes.rows[0].count, 10),
        today_completed: parseInt(todayCompletedRes.rows[0].count, 10),
        total_revenue: parseFloat(revenueRes.rows[0].total_revenue),
        unpaid_bills_count: parseInt(pendingBillsRes.rows[0].unpaid_count, 10),
        unpaid_bills_amount: parseFloat(pendingBillsRes.rows[0].unpaid_amount),
      },
      appointments_by_status: appByStatusRes.rows,
      today_appointments: todayAppointmentsRes.rows,
      recent_visits: recentVisitsRes.rows,
      recent_payments: recentPaymentsRes.rows,
      doctor_stats: doctorStatsRes.rows,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: error.message });
  }
};
