
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

  // --- Interest toggle: robust buttons controlling hidden radios ---
  const interestButtons = document.querySelectorAll('.it-btn');

  // Helper: set selected interest across BOTH hidden radio groups
  const setInterestType = (value) => {
    // Update radios
    document.querySelectorAll('input[name="interest_type"]').forEach(r => {
      r.checked = (r.value === value);
    });
    // Update button highlight
    interestButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === value);
    });
    // Show/hide groups
    if (typeof toggleInterestFields === 'function') toggleInterestFields();
  };

  // Wire buttons (single click)
  interestButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setInterestType(btn.dataset.value);
    });
  });

  // Initial state from radios (default = percent)
  const initialRadio = document.querySelector('input[name="interest_type"]:checked');
  setInterestType(initialRadio ? initialRadio.value : 'percent');

  // --- Optional: visually disable RC amount when toggle is off ---
  const includeRc = document.getElementById('includeRc');
  const rcAmountInput = document.getElementById('rcAmount');
  const syncRcState = () => {
    const enabled = includeRc.checked;
    rcAmountInput.disabled = !enabled;
    rcAmountInput.classList.toggle('disabled', !enabled);
  };
  includeRc.addEventListener('change', syncRcState);
  syncRcState();

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
    const interestType = (document.querySelector('input[name="interest_type"]:checked')?.value) || 'percent';
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
