const rows = ['A', 'B', 'C', 'D'];
const cols = 6;
const PRICE_WEEKDAY = 25000;
const PRICE_WEEKEND = 30000;

let selectedSeats = [];
// Memastikan data lama selalu diambil dari penyimpanan browser (localStorage)
let bookings = JSON.parse(localStorage.getItem('cinemaBookings')) || [];

const seatingPlan = document.getElementById('seatingPlan');
const movieSelect = document.getElementById('movieSelect');
const daySelect = document.getElementById('daySelect');
const customerNameInput = document.getElementById('customerName');
const paymentMethodInput = document.getElementById('paymentMethod');

const infoSeats = document.getElementById('infoSeats');
const infoCategory = document.getElementById('infoCategory');
const infoPrice = document.getElementById('infoPrice');

// Fungsi inisialisasi yang berjalan otomatis saat halaman pertama kali dibuka
function init() {
  // Ambil ulang data terbaru untuk memastikan sinkronisasi
  const savedBookings = localStorage.getItem('cinemaBookings');
  if (savedBookings) {
    bookings = JSON.parse(savedBookings).filter(b => b && b.id);
  } else {
    bookings = [];
  }
  
  generateSeats();
  renderTable();
}

function getCurrentTicketPrice() {
  return daySelect.value.includes('Weekend') ? PRICE_WEEKEND : PRICE_WEEKDAY;
}

function changeShow() {
  selectedSeats = [];
  generateSeats();
}

function generateSeats() {
  seatingPlan.innerHTML = '';
  
  const currentMovie = movieSelect.value;
  const currentDay = daySelect.value;
  
  // Mengumpulkan data kursi yang sudah di-booking pada film dan hari yang sama
  let bookedSeatsForThisShow = [];
  bookings.forEach(b => {
    if (b.movie === currentMovie && b.day === currentDay) {
      bookedSeatsForThisShow = bookedSeatsForThisShow.concat(b.seats);
    }
  });

  rows.forEach(row => {
    for (let i = 1; i <= cols; i++) {
      const seatId = `${row}${i}`;
      const seatObj = document.createElement('div');
      seatObj.classList.add('seat');
      seatObj.innerText = seatId;

      // Jika kursi ada di daftar bookedSeats, kunci langsung dengan warna merah
      if (bookedSeatsForThisShow.includes(seatId)) {
        seatObj.classList.add('booked'); 
      } else {
        if (selectedSeats.includes(seatId)) {
          seatObj.classList.add('selected'); // Biru jika sedang dipilih oleh user sekarang
        } else {
          seatObj.classList.add('available'); // Abu-abu jika masih kosong
        }
        // Hanya kursi kosong yang bisa diberi klik event listener
        seatObj.addEventListener('click', () => toggleSeat(seatId));
      }
      seatingPlan.appendChild(seatObj);
    }
  });
  
  updatePaymentDisplay();
}

function toggleSeat(seatId) {
  if (selectedSeats.includes(seatId)) {
    selectedSeats = selectedSeats.filter(id => id !== seatId);
  } else {
    selectedSeats.push(seatId);
  }
  generateSeats();
}

function updatePaymentDisplay() {
  const pricePerTicket = getCurrentTicketPrice();
  const isWeekend = daySelect.value.includes('Weekend');
  
  infoCategory.innerText = isWeekend ? 'Weekend (Rp 30.000/kursi)' : 'Weekday (Rp 25.000/kursi)';
  
  if (selectedSeats.length > 0) {
    infoSeats.innerText = selectedSeats.join(', ');
    infoPrice.innerText = 'Rp ' + (selectedSeats.length * pricePerTicket).toLocaleString('id-ID');
  } else {
    infoSeats.innerText = '-';
    infoPrice.innerText = 'Rp 0';
  }
}

function saveBooking() {
  const name = customerNameInput.value.trim();
  const movie = movieSelect.value;
  const day = daySelect.value;
  const method = paymentMethodInput.value;

  if (!name) { alert('Silakan masukkan nama pemesan!'); return; }
  if (selectedSeats.length === 0) { alert('Silakan pilih minimal 1 kursi!'); return; }

  const totalPrice = selectedSeats.length * getCurrentTicketPrice();

  const newBooking = {
    id: '_' + Math.random().toString(36).substr(2, 9),
    name: name,
    movie: movie,
    day: day,
    seats: selectedSeats,
    price: totalPrice,
    method: method
  };
  
  // Masukkan data baru ke array global
  bookings.push(newBooking);
  
  // Simpan permanen ke localStorage biar tidak hilang saat halaman di-refresh
  localStorage.setItem('cinemaBookings', JSON.stringify(bookings));
  
  showPaymentModal(newBooking);
  resetForm();
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('bookingTableBody');
  tbody.innerHTML = '';

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #888; padding: 20px;">Belum ada riwayat transaksi.</td></tr>`;
    return;
  }

  bookings.forEach(b => {
    const displayMovie = b.movie || "Avengers";
    const displayDay = b.day ? b.day.split(' ')[0] : "Senin";
    const displayPrice = b.price ? b.price.toLocaleString('id-ID') : "0";

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${b.name || 'Tanpa Nama'}</strong></td>
      <td>${displayMovie}</td>
      <td>${displayDay}</td>
      <td><span style="color: #00adb5; font-weight:bold;">${b.seats ? b.seats.join(', ') : '-'}</span></td>
      <td>Rp ${displayPrice}</td>
      <td>
        <button class="btn-action" onclick="openEditModal('${b.id}')">Edit</button>
        <button class="btn-action btn-danger" onclick="deleteBooking('${b.id}')">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openEditModal(id) {
  const booking = bookings.find(b => b.id === id);
  if (!booking) return;

  document.getElementById('editBookingId').value = booking.id;
  document.getElementById('editCustomerName').value = booking.name || '';
  document.getElementById('editPaymentMethod').value = booking.method || 'Gopay';
  
  document.getElementById('editInfoMovie').innerText = booking.movie || '-';
  document.getElementById('editInfoDay').innerText = booking.day || '-';
  document.getElementById('editInfoSeats').innerText = booking.seats ? booking.seats.join(', ') : '-';
  document.getElementById('editInfoPrice').innerText = 'Rp ' + (booking.price || 0).toLocaleString('id-ID');

  document.getElementById('editModal').classList.add('active');
}

function updateBooking() {
  const id = document.getElementById('editBookingId').value;
  const newName = document.getElementById('editCustomerName').value.trim();
  const newMethod = document.getElementById('editPaymentMethod').value;

  if (!newName) { alert('Nama tidak boleh kosong!'); return; }

  bookings = bookings.map(b => b.id === id ? { 
    ...b, name: newName, method: newMethod 
  } : b);

  localStorage.setItem('cinemaBookings', JSON.stringify(bookings));
  closeEditModal();
  renderTable();
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

function deleteBooking(id) {
  const booking = bookings.find(b => b.id === id);
  if (!booking) return;

  document.getElementById('deleteBookingId').value = booking.id;
  document.getElementById('delInfoName').innerText = booking.name || 'Tanpa Nama';
  document.getElementById('delInfoSeats').innerText = booking.seats ? booking.seats.join(', ') : '-';

  document.getElementById('deleteModal').classList.add('active');
}

function confirmDelete() {
  const id = document.getElementById('deleteBookingId').value;
  bookings = bookings.filter(b => b.id !== id);
  localStorage.setItem('cinemaBookings', JSON.stringify(bookings));
  
  closeDeleteModal();
  generateSeats();
  renderTable();
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('active');
}

function resetForm() {
  customerNameInput.value = '';
  paymentMethodInput.value = 'Gopay';
  selectedSeats = [];
  generateSeats();
}

function showPaymentModal(data) {
  document.getElementById('mdlName').innerText = data.name;
  document.getElementById('mdlMovie').innerText = data.movie;
  document.getElementById('mdlDay').innerText = data.day;
  document.getElementById('mdlSeats').innerText = data.seats.join(', ');
  document.getElementById('mdlMethod').innerText = data.method;
  document.getElementById('mdlPrice').innerText = 'Rp ' + data.price.toLocaleString('id-ID');

  document.getElementById('paymentModal').classList.add('active');
}

function closeModal() {
  document.getElementById('paymentModal').classList.remove('active');
}

// Menjalankan fungsi sinkronisasi data saat aplikasi dimuat pertama kali
init();