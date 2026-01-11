
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
      if (!span || !input) return;
      span.classList.toggle('active', input.checked);
    });
  };

  // ✅ Single-click reliable handler: programmatically click radio and dispatch change
  document.querySelectorAll('.interest-toggle .interest-option').forEach(option => {
    option.addEventListener('click', () => {
      const input = option.querySelector('input');
      if (!input) return;

      // Only act if we are actually changing the selection
      if (!input.checked) {
        input.checked = true;

        // Fire a native-like change event so listeners run immediately
        const evt = new Event('change', { bubbles: true });
        input.dispatchEvent(evt);
      }

      // Update UI highlight
      updateInterestButtons();

      // Show/Hide the relevant interest row
      if (typeof toggleInterestFields === 'function') toggleInterestFields();
    });
  });

  // Also keep support for keyboard/assistive technology
  document.querySelectorAll('input[name="interest_type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateInterestButtons();
      if (typeof toggleInterestFields === 'function') toggleInterestFields();
    });
  });

  // Initial state
  updateInterestButtons();

  // --- Optional RC visual disable (unchanged) ---
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

    const loan      = parseFloat(form.loan.value ?? '0');
    const months    = parseInt(form.months.value ?? '0', 10);
    const pcPercent = parseFloat(form.pc_percent.value ?? '0');

    if (!months || months < 1) {
      alert('Please enter a valid tenure (months ≥ 1).');
      return;
    }
    if (loan < 0) {
      alert('Loan amount cannot be negative.');
      return;
    }

    const processingAmount = loan * (pcPercent / 100);

    const interestType = form.querySelector('input[name="interest_type"]:checked').value;
    let annualInterestPercent = 0;
    if (interestType === 'percent') {
      annualInterestPercent = parseFloat(form.interest_percent.value ?? '0');
    } else {
      const annualInterestRupees = parseFloat(form.interest_rupees.value ?? '0');
      annualInterestPercent = annualInterestRupees * 12;
    }

    const rcAmount  = parseFloat(form.rc_amount.value ?? '0');
    const rcInclude = form.rc_include.checked;

    const financedAmount = loan + processingAmount + (rcInclude ? rcAmount : 0);
    const totalInterest = financedAmount * (annualInterestPercent / 100) * (months / 12);
    const emi = (financedAmount + totalInterest) / months;
    const totalPayable = financedAmount + totalInterest;

    setText('emi', formatINR(emi));
    setText('totalPayable', formatINR(totalPayable));
    setText('totalInterest', formatINR(totalInterest));
    setText('processingAmount', formatINR(processingAmount));
    setText('rcAmount', formatINR(rcAmount));
    setText('financedAmount', formatINR(financedAmount));
    document.getElementById('resultBox').classList.remove('d-none');
  });
});

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
