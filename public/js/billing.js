/**
 * Billing & Payment Calculator
 */
function initBillingPage(totalBill) {
  const methodInputs = document.querySelectorAll('input[name="metode_pembayaran"]');
  const tunaiSection = document.getElementById('tunaiSection');
  const nonTunaiSection = document.getElementById('nonTunaiSection');
  const debitSection = document.getElementById('debitSection');
  const uangDiterimaInput = document.getElementById('uangDiterimaInput');
  const uangKembalianDisplay = document.getElementById('uangKembalianDisplay');
  const btnSubmitBayar = document.getElementById('btnSubmitBayar');

  function updateCalculation() {
    const selectedMethod = document.querySelector('input[name="metode_pembayaran"]:checked')?.value || 'tunai';
    
    if (tunaiSection) tunaiSection.style.display = (selectedMethod === 'tunai') ? 'block' : 'none';
    if (nonTunaiSection) nonTunaiSection.style.display = (selectedMethod === 'non_tunai') ? 'block' : 'none';
    if (debitSection) debitSection.style.display = (selectedMethod === 'debit') ? 'block' : 'none';

    if (selectedMethod === 'tunai') {
      const received = parseFloat(uangDiterimaInput ? uangDiterimaInput.value : totalBill) || 0;
      const change = received - totalBill;

      if (uangKembalianDisplay) {
        if (change >= 0) {
          uangKembalianDisplay.textContent = 'Rp ' + change.toLocaleString('id-ID');
          uangKembalianDisplay.style.color = '#34d399';
          if (btnSubmitBayar) btnSubmitBayar.disabled = false;
        } else {
          uangKembalianDisplay.textContent = 'Kurang Rp ' + Math.abs(change).toLocaleString('id-ID');
          uangKembalianDisplay.style.color = '#f87171';
          if (btnSubmitBayar) btnSubmitBayar.disabled = true;
        }
      }
    } else {
      if (btnSubmitBayar) btnSubmitBayar.disabled = false;
    }
  }

  methodInputs.forEach(input => {
    input.addEventListener('change', updateCalculation);
  });

  if (uangDiterimaInput) {
    uangDiterimaInput.addEventListener('input', updateCalculation);
  }

  // Quick Amount Buttons
  window.setQuickCash = function(amount) {
    if (uangDiterimaInput) {
      uangDiterimaInput.value = amount;
      updateCalculation();
    }
  };

  updateCalculation();
}
