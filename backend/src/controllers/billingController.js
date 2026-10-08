const { query, pool } = require('../config/database');

async function generateBillNumber() {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT bill_number FROM bills 
     WHERE bill_number LIKE 'INV-${year}-%' 
     ORDER BY id DESC LIMIT 1`
  );
  if (result.rows.length === 0) {
    return `INV-${year}-000101`;
  }
  const lastCode = result.rows[0].bill_number;
  const parts = lastCode.split('-');
  const numPart = parseInt(parts[parts.length - 1], 10);
  const nextNum = isNaN(numPart) ? 101 : numPart + 1;
  return `INV-${year}-${String(nextNum).padStart(6, '0')}`;
}

// Create new Bill
exports.createBill = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      patient_id,
      appointment_id,
      subtotal,
      discount = 0,
      tax = 0,
      notes,
      initial_payment_amount,
      payment_method,
      transaction_reference,
    } = req.body;

    if (!patient_id || subtotal === undefined || subtotal === null) {
      return res.status(400).json({ success: false, message: 'Patient ID and subtotal are required' });
    }

    const sub = parseFloat(subtotal);
    const disc = parseFloat(discount) || 0;
    const tx = parseFloat(tax) || 0;
    const totalAmount = Math.max(0, sub - disc + tx);

    const initPay = parseFloat(initial_payment_amount) || 0;
    let paymentStatus = 'UNPAID';
    if (totalAmount === 0) {
      paymentStatus = 'PAID'; // Free revisit / follow-up has no balance
    } else if (initPay >= totalAmount && totalAmount > 0) {
      paymentStatus = 'PAID';
    } else if (initPay > 0) {
      paymentStatus = 'PARTIAL';
    }

    const billNumber = await generateBillNumber();

    await client.query('BEGIN');

    const billRes = await client.query(
      `INSERT INTO bills (patient_id, appointment_id, bill_number, subtotal, discount, tax, total_amount, payment_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        patient_id,
        appointment_id || null,
        billNumber,
        sub,
        disc,
        tx,
        totalAmount,
        paymentStatus,
        notes || null,
      ]
    );
    const bill = billRes.rows[0];

    // If initial payment provided
    let createdPayment = null;
    if (initPay > 0) {
      const payRes = await client.query(
        `INSERT INTO payments (bill_id, amount, payment_method, transaction_reference, received_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          bill.id,
          initPay,
          payment_method || 'CASH',
          transaction_reference || null,
          req.user ? req.user.id : null,
        ]
      );
      createdPayment = payRes.rows[0];
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      bill: {
        ...bill,
        payments: createdPayment ? [createdPayment] : [],
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating bill:', error);
    res.status(500).json({ success: false, message: 'Failed to create bill', error: error.message });
  } finally {
    client.release();
  }
};

// List Bills
exports.getAllBills = async (req, res) => {
  try {
    const { patient_id, payment_status, search } = req.query;

    let queryText = `
      SELECT b.*,
             p.patient_code, p.first_name, p.last_name, p.phone as patient_phone,
             a.appointment_date,
             u.full_name as doctor_name,
             COALESCE(SUM(pay.amount), 0) as total_paid,
             (b.total_amount - COALESCE(SUM(pay.amount), 0)) as balance_due
      FROM bills b
      JOIN patients p ON b.patient_id = p.id
      LEFT JOIN appointments a ON b.appointment_id = a.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN payments pay ON pay.bill_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (patient_id) {
      params.push(patient_id);
      queryText += ` AND b.patient_id = $${params.length}`;
    }

    if (payment_status) {
      params.push(payment_status);
      queryText += ` AND b.payment_status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      queryText += ` AND (
        b.bill_number ILIKE $${params.length} OR 
        p.first_name ILIKE $${params.length} OR 
        p.last_name ILIKE $${params.length} OR 
        p.patient_code ILIKE $${params.length}
      )`;
    }

    queryText += ` GROUP BY b.id, p.id, a.id, u.full_name ORDER BY b.created_at DESC`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      bills: result.rows,
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bills', error: error.message });
  }
};

// Get single Bill by ID with detailed payments
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const billRes = await query(
      `SELECT b.*,
              p.patient_code, p.first_name, p.last_name, p.phone as patient_phone,
              p.email as patient_email, p.address as patient_address,
              a.appointment_date, a.start_time,
              u.full_name as doctor_name, d.specialization as doctor_specialization,
              d.consultation_fee
       FROM bills b
       JOIN patients p ON b.patient_id = p.id
       LEFT JOIN appointments a ON b.appointment_id = a.id
       LEFT JOIN doctors d ON a.doctor_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (billRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const bill = billRes.rows[0];

    // Fetch payments
    const paymentsRes = await query(
      `SELECT pay.*, u.full_name as received_by_name
       FROM payments pay
       LEFT JOIN users u ON pay.received_by = u.id
       WHERE pay.bill_id = $1
       ORDER BY pay.payment_date ASC`,
      [id]
    );

    const payments = paymentsRes.rows;
    const totalPaid = payments.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const balanceDue = Math.max(0, parseFloat(bill.total_amount) - totalPaid);

    res.json({
      success: true,
      bill: {
        ...bill,
        total_paid: totalPaid,
        balance_due: balanceDue,
        payments,
      },
    });
  } catch (error) {
    console.error('Error fetching bill details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bill', error: error.message });
  }
};

// Record payment on bill
exports.addPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params; // bill_id
    const { amount, payment_method = 'CASH', transaction_reference } = req.body;

    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive payment amount required' });
    }

    await client.query('BEGIN');

    // Get current bill info and existing payments
    const billRes = await client.query('SELECT * FROM bills WHERE id = $1 FOR UPDATE', [id]);
    if (billRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    const bill = billRes.rows[0];

    const currentPayments = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE bill_id = $1',
      [id]
    );
    const existingPaid = parseFloat(currentPayments.rows[0].total_paid);
    const newTotalPaid = existingPaid + payAmount;
    const billTotal = parseFloat(bill.total_amount);

    let newStatus = 'PARTIAL';
    if (newTotalPaid >= billTotal) {
      newStatus = 'PAID';
    }

    // Insert payment
    const paymentRes = await client.query(
      `INSERT INTO payments (bill_id, amount, payment_method, transaction_reference, received_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, payAmount, payment_method, transaction_reference || null, req.user ? req.user.id : null]
    );

    // Update bill payment status
    await client.query(
      `UPDATE bills SET payment_status = $1 WHERE id = $2`,
      [newStatus, id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment: paymentRes.rows[0],
      new_payment_status: newStatus,
      total_paid: newTotalPaid,
      balance_due: Math.max(0, billTotal - newTotalPaid),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding payment:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment', error: error.message });
  } finally {
    client.release();
  }
};

// Calculate consultation fee based on doctor fee and revisit/follow-up check
exports.calculateFee = async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_id } = req.query;

    let targetDoctorId = doctor_id;
    let targetPatientId = patient_id;

    if (appointment_id) {
      const appRes = await query(
        `SELECT a.patient_id, a.doctor_id, a.appointment_date, 
                d.consultation_fee, u.full_name as doctor_name, d.specialization
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u ON d.user_id = u.id
         WHERE a.id = $1`,
        [appointment_id]
      );
      if (appRes.rows.length > 0) {
        targetDoctorId = appRes.rows[0].doctor_id;
        targetPatientId = appRes.rows[0].patient_id;
      }
    }

    if (!targetDoctorId || !targetPatientId) {
      return res.status(400).json({ success: false, message: 'Patient ID and Doctor ID are required' });
    }

    // Get doctor info
    const docRes = await query(
      `SELECT d.id, d.consultation_fee, d.specialization, u.full_name as doctor_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [targetDoctorId]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const doctor = docRes.rows[0];
    const standardFee = parseFloat(doctor.consultation_fee) || 0;

    // Check for prior visits with this doctor for this patient
    const priorVisitRes = await query(
      `SELECT v.id, v.created_at, v.follow_up_date, v.diagnosis
       FROM visits v
       WHERE v.patient_id = $1 AND v.doctor_id = $2
       ORDER BY v.created_at DESC
       LIMIT 1`,
      [targetPatientId, targetDoctorId]
    );

    let isRevisit = false;
    let revisitReason = '';
    let recommendedFee = standardFee;

    if (priorVisitRes.rows.length > 0) {
      const lastVisit = priorVisitRes.rows[0];
      const lastVisitDate = new Date(lastVisit.created_at);
      const today = new Date();
      const diffTime = Math.abs(today - lastVisitDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Follow-up valid if within follow_up_date or within 14 days
      let withinFollowUpDate = false;
      if (lastVisit.follow_up_date) {
        const fDate = new Date(lastVisit.follow_up_date);
        withinFollowUpDate = today <= fDate;
      }
      const within14Days = diffDays <= 14;

      if (withinFollowUpDate || within14Days) {
        isRevisit = true;
        recommendedFee = 0.00;
        revisitReason = withinFollowUpDate
          ? `Follow-up visit within prescribed follow-up date (${new Date(lastVisit.follow_up_date).toLocaleDateString()}) - No Doctor Fee charged`
          : `Revisit within 14-day validity window (${diffDays} day(s) ago for ${lastVisit.diagnosis}) - No Doctor Fee charged`;
      }
    }

    res.json({
      success: true,
      patient_id: parseInt(targetPatientId, 10),
      doctor_id: doctor.id,
      doctor_name: doctor.doctor_name,
      specialization: doctor.specialization,
      standard_doctor_fee: standardFee,
      is_revisit: isRevisit,
      revisit_reason: revisitReason,
      recommended_fee: recommendedFee,
      subtotal: recommendedFee,
      discount: 0.00,
      tax: 0.00,
      total_amount: recommendedFee,
      notes: isRevisit
        ? `Doctor Follow-up Consultation (Revisit - Free) - ${doctor.doctor_name}`
        : `Doctor Consultation Fee - ${doctor.doctor_name} (${doctor.specialization})`,
    });
  } catch (error) {
    console.error('Error calculating fee:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate fee', error: error.message });
  }
};
