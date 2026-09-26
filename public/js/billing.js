/**
 * Billing & Payment Calculator
 */
function initBillingPage(totalBill) {
  const methodInputs = document.querySelectorAll('input[name="metode_pembayaran"]');
  const tunaiSection = document.getElementById('tunaiSection');
  const nonTunaiSection = document.getElementById('nonTunaiSection');
  const uangDiterimaInput = document.getElementById('uangDiterimaInput');
  const uangKembalianDisplay = document.getElementById('uangKembalianDisplay');
  const btnSubmitBayar = document.getElementById('btnSubmitBayar');

  function updateCalculation() {
    const isTunai = document.querySelector('input[name="metode_pembayaran"]:checked')?.value === 'tunai';
    
    if (tunaiSection) tunaiSection.style.display = isTunai ? 'block' : 'none';
    if (nonTunaiSection) nonTunaiSection.style.display = !isTunai ? 'block' : 'none';

    if (isTunai) {
      const received = parseFloat(uangDiterimaInput.value) || 0;
      const change = received - totalBill;

      if (uangKembalianDisplay) {
        if (change >= 0) {
          uangKembalianDisplay.textContent = 'Rp ' + change.toLocaleString('id-ID');
          uangKembalianDisplay.style.color = '#34d399';
          btnSubmitBayar.disabled = false;
        } else {
          uangKembalianDisplay.textContent = 'Kurang Rp ' + Math.abs(change).toLocaleString('id-ID');
          uangKembalianDisplay.style.color = '#f87171';
          btnSubmitBayar.disabled = true;
        }
      }
    } else {
      btnSubmitBayar.disabled = false;
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
