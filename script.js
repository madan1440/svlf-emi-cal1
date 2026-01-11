
// Format numbers in en-IN with 2 decimals
function formatINR(n) {
  if (!isFinite(n)) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');

  // --- Blue highlight for %/yr and ₹/yr buttons ---
  const updateInterestButtons = () => {
    document.querySelectorAll('.interest-toggle label').forEach(label => {
      const input = label.querySelector('input');
      const span  = label.querySelector('span');
      if (!span) return;
      span.classList.toggle('active', !!input.checked);
    });
  };

  // Ensure clicking the "button" (label) sets the radio and updates UI
  document.querySelectorAll('.interest-toggle .interest-option').forEach(option => {
    option.addEventListener('click', (e) => {
      const input = option.querySelector('input');
      if (!input) return;
      input.checked = true;
      updateInterestButtons();
      if (typeof toggleInterestFields === 'function') toggleInterestFields();
      e.preventDefault(); // prevent text selection glitches on double tap
    });
  });

  // Also update on native radio change (keyboard, etc.)
  document.querySelectorAll('input[name="interest_type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateInterestButtons();
      if (typeof toggleInterestFields === 'function') toggleInterestFields();
    });
  });

  // Initial state
  updateInterestButtons();

  // Optional: visually disable RC amount when toggle is off (non-functional change)
  const includeRc = document.getElementById('includeRc');
  const rcAmountInput = document.getElementById('rcAmount');
  const syncRcState = () => {
    const enabled = includeRc.checked;
    rcAmountInput.disabled = !enabled;
    rcAmountInput.classList.toggle('disabled', !enabled);
  };
  includeRc.addEventListener('change', syncRcState);
  syncRcState(); // initialize

  // --- Main calculation logic (unchanged) ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Read inputs safely
    const loan      = parseFloat(form.loan.value ?? '0');
    const months    = parseInt(form.months.value ?? '0', 10);
    const pcPercent = parseFloat(form.pc_percent.value ?? '0');

    // Basic validation
    if (!months || months < 1) {
      alert('Please enter a valid tenure (months ≥ 1).');
      return;
    }
    if (loan < 0) {
      alert('Loan amount cannot be negative.');
      return;
    }

    // Processing charges amount
    const processingAmount = loan * (pcPercent / 100);

    // Interest type
    const interestType = form.querySelector('input[name="interest_type"]:checked').value;
    let annualInterestPercent = 0;
    if (interestType === 'percent') {
      annualInterestPercent = parseFloat(form.interest_percent.value ?? '0');
    } else {
      const annualInterestRupees = parseFloat(form.interest_rupees.value ?? '0');
      // Mapping per your hint: 1 ₹ = 12% per annum
      annualInterestPercent = annualInterestRupees * 12;
    }

    // R.C
    const rcAmount  = parseFloat(form.rc_amount.value ?? '0');
    const rcInclude = form.rc_include.checked;

    // Financed amount: Loan + Processing + (R.C if included)
    const financedAmount = loan + processingAmount + (rcInclude ? rcAmount : 0);

    // Flat-rate interest over tenure
    const totalInterest = financedAmount * (annualInterestPercent / 100) * (months / 12);

    // Monthly EMI (flat)
    const emi = (financedAmount + totalInterest) / months;

    // Total payable
    const totalPayable = financedAmount + totalInterest;

    // Render results
    setText('emi', formatINR(emi));
    setText('totalPayable', formatINR(totalPayable));
    setText('totalInterest', formatINR(totalInterest));
    setText('processingAmount', formatINR(processingAmount));
    setText('rcAmount', formatINR(rcAmount));
    setText('financedAmount', formatINR(financedAmount));

    // Show result box
    document.getElementById('resultBox').classList.remove('d-none');
  });
});

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
