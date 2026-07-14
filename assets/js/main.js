// Use the shared Supabase client directly

// --- VEHICLE LOADING ---
async function loadVehicles(filter = 'all', search = '') {
  const grid = document.getElementById('vehicleGrid');
  if (!grid) return;

  console.log('Loading vehicles with filter:', filter, 'search:', search);
  grid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

  try {
    let query = window.supabaseClient
      .from('vehicles')
      .select(`
        *,
        vehicle_images (*)
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('type', filter);
    }
    if (search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    console.log('Executing query...');
    const { data: vehicles, error } = await query;
    console.log('Query result:', { vehicles, error });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!vehicles || vehicles.length === 0) {
      console.log('No vehicles found');
      grid.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-search display-1 text-muted"></i><h4 class="text-muted mt-3">No vehicles found</h4><p>Try adjusting your search or filter criteria.</p></div>';
      return;
    }

    console.log('Found', vehicles.length, 'vehicles');
    grid.innerHTML = '';
    vehicles.forEach(vehicle => {
      const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"%3E%3Crect width="800" height="500" fill="%23f3f4f8"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial,sans-serif" font-size="32"%3ENo Image Available%3C/text%3E%3C/svg%3E';
      
      // Get all valid images
      const validImages = vehicle.vehicle_images?.map(i => i.image_url).filter(Boolean) || [];
      if (!validImages.length) {
        console.warn('Vehicle has no images:', vehicle.id);
      }
      
      // Find primary image and prioritize it first
      const primaryImageObj = vehicle.vehicle_images?.find(i => i.is_primary);
      const primaryImg = primaryImageObj?.image_url || validImages[0] || placeholderImage;
      
      // Reorder images so primary comes first
      let allImages = validImages.length ? validImages : [primaryImg];
      if (primaryImageObj && validImages.length > 1) {
        allImages = [primaryImg, ...allImages.filter(img => img !== primaryImg)];
      }

      const col = document.createElement('div');
      col.className = 'col-lg-4 col-md-6';
      col.innerHTML = `
        <div class="vehicle-card" data-id="${vehicle.id}">
          <div class="vehicle-image-wrapper">
            <div class="vehicle-slider">
              ${allImages.map((img, idx) => `
                <div class="slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${img}')"></div>
              `).join('')}
            </div>
            ${allImages.length > 1 ? `
              <button class="slide-btn prev"><i class="bi bi-chevron-left"></i></button>
              <button class="slide-btn next"><i class="bi bi-chevron-right"></i></button>
              <div class="slide-dots">
                ${allImages.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
              </div>
            ` : ''}
            <div class="vehicle-badge">${vehicle.type}</div>
          </div>
          <div class="vehicle-info">
            <h5 class="vehicle-name">${vehicle.name}</h5>
            <div class="vehicle-specs">
              <span><i class="bi bi-calendar"></i> ${vehicle.year}</span>
              <span><i class="bi bi-speedometer2"></i> ${normalizeMileageDisplay(vehicle.mileage) || 'N/A'}</span>
              <span><i class="bi bi-fuel-pump"></i> ${vehicle.fuel_type || 'N/A'}</span>
              <span><i class="bi bi-gear"></i> ${vehicle.transmission || 'N/A'}</span>
            </div>
            <div class="vehicle-pricing">
              <div class="price-details">
                <span class="total-price">$${Number(vehicle.price).toLocaleString()}</span>
                <span class="monthly-price">$${Number(vehicle.monthly_payment).toLocaleString()}/mo</span>
              </div>
              <a href="apply.html?vehicle=${vehicle.id}" class="btn btn-primary btn-sm apply-btn">
                Apply Now <i class="bi bi-arrow-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      `;
      grid.appendChild(col);
    });

    initSliders();
    initVehicleDetailsModal(vehicles);
  } catch (error) {
    console.error('Error loading vehicles:', error);
    grid.innerHTML = '<div class="col-12 text-center py-5"><div class="alert alert-danger">Failed to load vehicles. Please try again later.</div></div>';
  }
}

async function loadTestimonials() {
  const container = document.getElementById('testimonialCards');
  if (!container || !window.supabaseClient) return;
  try {
    const { data, error } = await window.supabaseClient
      .from('testimonials')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(6);
    if (error) throw error;
    renderTestimonialCards(data || []);
  } catch (err) {
    // Provide structured logging to help diagnose Supabase / network errors
    console.error('Error loading testimonials:', err);
    try {
      // Supabase returns an object with helpful fields
      if (err && typeof err === 'object') {
        console.error('Supabase error details: status=', err.status, 'message=', err.message, 'details=', err.details, 'hint=', err.hint);
      }
    } catch (logErr) {
      console.error('Failed to extract error details:', logErr);
    }

    // Show a clearer message to users and hint at a missing DB table when applicable
    const userMessage = (err && err.status === 404)
      ? 'Reviews not available (database table may be missing).'
      : (err && err.message) ? `Unable to load reviews: ${err.message}` : 'Unable to load reviews right now.';

    container.innerHTML = `<div class="col-12 text-center py-5 text-danger"><i class="bi bi-exclamation-triangle-fill fs-1"></i><p class="mt-3 mb-0">${userMessage}</p></div>`;
  }
}

function renderTestimonialCards(testimonials) {
  const container = document.getElementById('testimonialCards');
  if (!container) return;
  if (!testimonials.length) {
    container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-star-half fs-1"></i><p class="mt-3 mb-0">No reviews are published yet.</p></div>';
    return;
  }
  container.innerHTML = testimonials.map(testimonial => {
    const stars = Array.from({ length: 5 }, (_, index) => `
      <i class="bi ${index < testimonial.rating ? 'bi-star-fill' : 'bi-star'} text-warning"></i>
    `).join('');
    return `
      <div class="col-md-6">
        <div class="testimonial-card p-4 bg-white rounded-4 shadow-sm h-100">
          <div class="stars mb-3">${stars}</div>
          <p class="mb-4">"${testimonial.comment.replace(/</g, '&lt;').replace(/>/g, '&gt;')}"</p>
          <div class="d-flex align-items-center">
            <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width:45px;height:45px;font-weight:bold;">${testimonial.name.trim().split(' ').map(n => n[0]?.toUpperCase()).slice(0,2).join('')}</div>
            <div class="ms-3">
              <h6 class="mb-0">${testimonial.name}</h6>
              <small class="text-muted">${new Date(testimonial.created_at).toLocaleDateString()}</small>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function initTestimonialForm() {
  const form = document.getElementById('testimonialForm');
  const messageEl = document.getElementById('testimonialMessage');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!window.supabaseClient) return;

    const name = document.getElementById('testimonialName')?.value.trim();
    const rating = parseInt(document.getElementById('testimonialRating')?.value, 10);
    const comment = document.getElementById('testimonialComment')?.value.trim();

    if (!name || !rating || !comment) {
      if (messageEl) {
        messageEl.textContent = 'Please complete all fields before submitting.';
        messageEl.classList.remove('d-none');
        messageEl.classList.add('text-danger');
      }
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button?.innerHTML;
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...';
    }

    try {
      const { error } = await window.supabaseClient
        .from('testimonials')
        .insert([{ name, rating, comment, status: 'pending_review' }]);
      if (error) throw error;
      form.reset();
      if (messageEl) {
        messageEl.textContent = 'Thank you! Your review has been submitted for approval.';
        messageEl.classList.remove('d-none', 'text-danger');
        messageEl.classList.add('text-success');
      }
    } catch (err) {
      console.error('Error submitting testimonial:', err);
      if (messageEl) {
        messageEl.textContent = 'Unable to submit your review. Please try again later.';
        messageEl.classList.remove('d-none');
        messageEl.classList.add('text-danger');
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = originalLabel || 'Submit Review';
      }
    }
  });
}

// --- VEHICLE DETAILS MODAL ---
function initVehicleDetailsModal(vehicles) {
  const vehicleMap = {};
  vehicles.forEach(v => {
    vehicleMap[v.id] = v;
  });

  document.querySelectorAll('.vehicle-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking on Apply button
      if (e.target.closest('.apply-btn')) return;
      
      const vehicleId = card.dataset.id;
      const vehicle = vehicleMap[vehicleId];
      if (vehicle) {
        showVehicleDetails(vehicle);
      }
    });
  });
}

function showVehicleDetails(vehicle) {
  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"%3E%3Crect width="800" height="500" fill="%23f3f4f8"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial,sans-serif" font-size="32"%3ENo Image Available%3C/text%3E%3C/svg%3E';
  
  // Get all valid images
  const validImages = vehicle.vehicle_images?.map(i => i.image_url).filter(Boolean) || [];
  
  // Find primary image and prioritize it first
  const primaryImageObj = vehicle.vehicle_images?.find(i => i.is_primary);
  const primaryImg = primaryImageObj?.image_url || validImages[0] || placeholderImage;
  
  // Reorder images so primary comes first
  let allImages = validImages.length ? validImages : [placeholderImage];
  if (primaryImageObj && validImages.length > 1) {
    allImages = [primaryImg, ...allImages.filter(img => img !== primaryImg)];
  }

  // Populate modal content
  document.getElementById('vehicleDetailsTitle').textContent = vehicle.name;
  document.getElementById('detailVehicleName').textContent = vehicle.name;
  document.getElementById('detailVehicleType').textContent = vehicle.type;
  document.getElementById('detailVehicleYear').textContent = vehicle.year;
  document.getElementById('detailYear').textContent = vehicle.year;
  document.getElementById('detailMileage').textContent = normalizeMileageDisplay(vehicle.mileage);
  document.getElementById('detailFuelType').textContent = vehicle.fuel_type || 'N/A';
  document.getElementById('detailTransmission').textContent = vehicle.transmission || 'N/A';
  document.getElementById('detailSeats').textContent = (vehicle.seats || 'N/A') + ' seats';
  
  document.getElementById('detailPriceDisplay').textContent = '$' + Number(vehicle.price).toLocaleString();
  document.getElementById('detailMonthlyDisplay').textContent = '$' + Number(vehicle.monthly_payment).toLocaleString() + '/month';

  // Update description if available
  const descRow = document.getElementById('descriptionRow');
  if (vehicle.description) {
    document.getElementById('detailDescription').textContent = vehicle.description;
    descRow.style.display = 'block';
  } else {
    descRow.style.display = 'none';
  }

  // Populate images
  const sliderContainer = document.getElementById('detailSlider');
  sliderContainer.innerHTML = allImages.map((img, idx) => 
    `<div class="slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${img}')" data-index="${idx}"></div>`
  ).join('');

  const thumbnailsContainer = document.getElementById('detailThumbnails');
  thumbnailsContainer.innerHTML = allImages.map((img, idx) => 
    `<img src="${img}" alt="Image ${idx + 1}" class="detail-thumbnail ${idx === 0 ? 'active' : ''}" data-index="${idx}">`
  ).join('');

  // Add thumbnail click handlers
  document.querySelectorAll('.detail-thumbnail').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.index);
      showDetailSlide(idx);
    });
  });
  
  // Add swipe functionality to detail slider
  if (!sliderContainer.__detailSwipeInitialized) {
    let touchStartX = 0;
    let touchEndX = 0;

    const onDetailTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const onDetailTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleDetailSwipe();
    };

    const handleDetailSwipe = () => {
      const slides = sliderContainer.querySelectorAll('.slide');
      const activeSlide = sliderContainer.querySelector('.slide.active');
      const currentIdx = parseInt(activeSlide?.dataset.index) || 0;

      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && currentIdx < slides.length - 1) {
          showDetailSlide(currentIdx + 1);
        } else if (diff < 0 && currentIdx > 0) {
          showDetailSlide(currentIdx - 1);
        }
      }
    };

    sliderContainer.addEventListener('touchstart', onDetailTouchStart, false);
    sliderContainer.addEventListener('touchend', onDetailTouchEnd, false);
    sliderContainer.__detailSwipeInitialized = true;
  }

  // Update apply button link
  document.getElementById('detailApplyBtn').href = `apply.html?vehicle=${vehicle.id}`;

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('vehicleDetailsModal'));
  
  // Push history state for back button support
  history.pushState({ vehicleDetailsOpen: true }, '', window.location.href);
  
  // Handle back button
  const handlePopState = (e) => {
    if (e.state?.vehicleDetailsOpen) {
      // This is our modal state, don't do anything (we'll handle it on next back)
      return;
    }
    // Back button pressed, close modal
    modal.hide();
    window.removeEventListener('popstate', handlePopState);
  };
  
  window.addEventListener('popstate', handlePopState);
  
  // Clean up event listener when modal closes
  document.getElementById('vehicleDetailsModal').addEventListener('hidden.bs.modal', () => {
    window.removeEventListener('popstate', handlePopState);
  }, { once: true });
  
  modal.show();
}

// Helper function to update detail slide
function showDetailSlide(idx) {
  const sliderContainer = document.getElementById('detailSlider');
  const slides = sliderContainer.querySelectorAll('.slide');
  const thumbnails = document.querySelectorAll('.detail-thumbnail');
  
  slides.forEach(s => s.classList.remove('active'));
  thumbnails.forEach(t => t.classList.remove('active'));
  
  if (slides[idx]) slides[idx].classList.add('active');
  if (thumbnails[idx]) thumbnails[idx].classList.add('active');
}

// --- IMAGE SLIDER ---
function initSliders() {
  document.querySelectorAll('.vehicle-card').forEach(card => {
    const slides = card.querySelectorAll('.slide');
    const dots = card.querySelectorAll('.dot');
    const prevBtn = card.querySelector('.prev');
    const nextBtn = card.querySelector('.next');
    let current = 0;

    if (!slides.length) return;

    function showSlide(index) {
      slides.forEach(s => s.classList.remove('active'));
      dots.forEach(d => d.classList.remove('active'));
      slides[index].classList.add('active');
      if (dots[index]) dots[index].classList.add('active');
      current = index;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showSlide(current === 0 ? slides.length - 1 : current - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showSlide(current === slides.length - 1 ? 0 : current + 1);
      });
    }
    dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        showSlide(parseInt(dot.dataset.index));
      });
    });
  });
}

// --- FILTER & SEARCH ---
document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('searchInput');

  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const searchVal = searchInput ? searchInput.value : '';
        loadVehicles(btn.dataset.filter, searchVal);
      });
    });
  }

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const activeFilter = document.querySelector('.filter-btn.active');
        const filter = activeFilter ? activeFilter.dataset.filter : 'all';
        loadVehicles(filter, searchInput.value);
      }, 300);
    });
  }

  loadVehicles();
  initApplicationForm();
  initStatusCheck();
  loadTestimonials();
  initTestimonialForm();
  renderApplicationNumberOnSuccess();
  trackWebsiteVisit();
});

async function trackWebsiteVisit() {
  if (!window.supabaseClient) return;

  const tokenKey = 'sbt_visitor_token';
  const countedKey = 'sbt_visit_session_counted';
  const tabStorageKey = 'sbt_visit_tab_data';
  let visitorToken = localStorage.getItem(tokenKey);

  const navEntry = performance?.getEntriesByType?.('navigation')?.[0];
  const navigationType = navEntry?.type || (performance?.navigation?.type === 1 ? 'reload' : 'navigate');
  const isReload = navigationType === 'reload';
  const isBackForward = navigationType === 'back_forward';

  let tabData = {};
  if (window.name) {
    try {
      tabData = JSON.parse(window.name) || {};
    } catch (err) {
      tabData = {};
    }
  }

  const alreadyCounted = Boolean(
    tabData[countedKey] || localStorage.getItem(countedKey) || sessionStorage.getItem(countedKey)
  );

  if (alreadyCounted && !isReload) {
    return;
  }

  if (!visitorToken) {
    visitorToken = crypto?.randomUUID?.() || `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(tokenKey, visitorToken);
  }

  // Track once per tab session across page navigations and file-based origins.
  if (!isReload) {
    localStorage.setItem(countedKey, '1');
    sessionStorage.setItem(countedKey, '1');
    tabData[countedKey] = true;
    try {
      window.name = JSON.stringify(tabData);
    } catch (err) {
      // Ignore failures from window.name serialization.
    }
  }

  try {
    const { error } = await window.supabaseClient
      .from('website_visits')
      .insert({
        visitor_token: visitorToken,
        page_path: window.location.pathname,
        user_agent: navigator.userAgent
      });

    if (error) {
      if (error.status === 404 || String(error.message).toLowerCase().includes('not found')) {
        console.warn('Visitor tracking failed because the website_visits table is not available in Supabase.');
      } else {
        console.warn('Visitor tracking failed:', error.message || error);
      }
    }
  } catch (err) {
    console.warn('Visitor tracking failed:', err.message || err);
  }
}

function generateApplicationNumber() {
  const prefix = 'SBT';
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

function renderApplicationNumberOnSuccess() {
  const appNumberElement = document.getElementById('successApplicationNumber');
  const successText = document.getElementById('successHelpText');
  if (!appNumberElement) return;

  const params = new URLSearchParams(window.location.search);
  const applicationNumber = params.get('number');
  if (applicationNumber) {
    appNumberElement.textContent = applicationNumber;
    if (successText) {
      successText.textContent = 'Use this ID on the customer dashboard to track your application status.';
    }
  } else {
    appNumberElement.textContent = 'Not available';
    if (successText) {
      successText.textContent = 'If you do not see an application ID, please try again or contact support.';
    }
  }
}

function initStatusCheck() {
  const statusForm = document.getElementById('statusForm');
  const resultCard = document.getElementById('statusResult');
  const resultMessage = document.getElementById('statusMessage');
  const statusBadge = document.getElementById('statusBadge');
  const statusVehicle = document.getElementById('statusVehicle');
  const statusCreatedAt = document.getElementById('statusCreatedAt');
  const appRef = document.getElementById('statusApplicationNumber');

  if (!statusForm) return;

  statusForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const applicationNumber = document.getElementById('applicationNumberInput').value.trim();
    if (!applicationNumber) {
      alert('Please enter your application ID.');
      return;
    }

    try {
      const { data, error } = await window.supabaseClient
        .from('applications')
        .select('*')
        .ilike('application_number', applicationNumber)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        resultCard.classList.add('d-none');
        resultMessage.textContent = 'No application found with that ID. Please check your application number and try again.';
        return;
      }

      let vehicleName = 'Vehicle details unavailable';
      if (data.vehicle_id) {
        const { data: vehicleData } = await window.supabaseClient
          .from('vehicles')
          .select('name')
          .eq('id', data.vehicle_id)
          .single();
        if (vehicleData?.name) vehicleName = vehicleData.name;
      }

      resultMessage.textContent = '';
      resultCard.classList.remove('d-none');
      appRef.textContent = data.application_number;
      statusVehicle.textContent = vehicleName;
      statusBadge.textContent = data.status;
      statusBadge.className = 'badge ' + (data.status === 'approved' ? 'bg-success' : data.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark');
      const createdAtDate = new Date(data.created_at);
      statusCreatedAt.textContent = createdAtDate.toLocaleString();

      // If approved, show next steps and payment schedule
      const approvalSection = document.getElementById('approvalSection');
      const paymentsSection = document.getElementById('paymentsSection');
      const firstPaymentDueEl = document.getElementById('firstPaymentDue');
      const paymentsWrapper = document.getElementById('paymentsTableWrapper');

      if (data.status === 'approved') {
        approvalSection.classList.remove('d-none');
        paymentsSection.classList.remove('d-none');

        const firstDue = new Date(data.created_at);
        firstDue.setDate(firstDue.getDate() + 30);
        firstPaymentDueEl.textContent = firstDue.toLocaleDateString();

        // build payments summary
        let monthly = 0;
        if (data.vehicle_id) {
          const { data: vehicleData } = await window.supabaseClient
            .from('vehicles')
            .select('monthly_payment')
            .eq('id', data.vehicle_id)
            .single();
          if (vehicleData?.monthly_payment) monthly = Number(vehicleData.monthly_payment);
        }

        const adminPaid = !!data.admin_fee_paid;
        const installments = Array.isArray(data.installments_paid) ? data.installments_paid.slice() : (data.installments_paid || []);
        while (installments.length < 18) installments.push(false);

        let html = '<div class="mb-2"><strong>Administration Fee</strong> — US $30.00 — <span class="fw-semibold">' + (adminPaid ? 'Paid' : 'Pending') + '</span></div>';
        html += '<table class="table table-sm mt-2"><thead><tr><th>Installment</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead><tbody>';
        for (let i = 0; i < 18; i++) {
          const due = new Date(firstDue);
          due.setMonth(due.getMonth() + i);
          html += `<tr><td>Month ${i+1}</td><td>US $${Number(monthly).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td><td>${due.toLocaleDateString()}</td><td>${installments[i] ? 'Paid' : 'Pending'}</td></tr>`;
        }
        html += '</tbody></table>';
        paymentsWrapper.innerHTML = html;
      } else {
        approvalSection.classList.add('d-none');
        paymentsSection.classList.add('d-none');
      }
    } catch (err) {
      console.error('Status lookup error:', err);
      resultCard.classList.add('d-none');
      resultMessage.textContent = 'Unable to retrieve application status. Please check the ID and try again.';
    }
  });
}

// --- APPLICATION FORM ---
async function initApplicationForm() {
  const form = document.getElementById('applicationForm');
  if (!form) return;

  // Load vehicle dropdown and hidden vehicle ID
  const vehicleSelect = document.getElementById('vehicleSelect');
  const vehicleIdInput = document.getElementById('vehicleIdInput');
  const selectedVehicleDisplay = document.getElementById('selectedVehicleDisplay');
  const params = new URLSearchParams(window.location.search);
  const vehicleId = params.get('vehicle');

  if (vehicleSelect) {
    try {
      const { data: vehicles, error } = await window.supabaseClient
        .from('vehicles')
        .select('id, name, type, year, monthly_payment')
        .eq('status', 'available');

      if (!error && vehicles) {
        vehicles.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.id;
          opt.textContent = `${v.name} (${v.year}) - $${Number(v.monthly_payment).toLocaleString()}/mo`;
          vehicleSelect.appendChild(opt);

          if (vehicleId && String(v.id) === String(vehicleId)) {
            if (selectedVehicleDisplay) {
              selectedVehicleDisplay.textContent = `Applying for ${v.name} (${v.year})`;
            }
          }
        });

        // Pre-select vehicle from URL params
        if (vehicleId) {
          vehicleSelect.value = vehicleId;
          if (vehicleIdInput) vehicleIdInput.value = vehicleId;
        }

        vehicleSelect.addEventListener('change', () => {
          if (vehicleIdInput) vehicleIdInput.value = vehicleSelect.value;
        });
      }
    } catch (err) {
      console.error('Error loading vehicles:', err);
      if (vehicleId && vehicleIdInput) {
        vehicleIdInput.value = vehicleId;
      }
    }
  } else if (vehicleId && vehicleIdInput) {
    vehicleIdInput.value = vehicleId;
    if (selectedVehicleDisplay) {
      selectedVehicleDisplay.textContent = 'Applying for selected vehicle';
    }
  }

  // Multi-step navigation
  const steps = document.querySelectorAll('.form-step');
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const nextBtns = document.querySelectorAll('.btn-next');
  const prevBtns = document.querySelectorAll('.btn-prev');
  const progressFill = document.getElementById('progressFill');
  let currentStep = 0;

  function showStep(index) {
    steps.forEach((s, i) => {
      s.classList.toggle('active', i === index);
      s.classList.toggle('d-none', i !== index);
    });
    stepIndicators.forEach((s, i) => {
      s.classList.toggle('active', i === index);
      s.classList.toggle('completed', i < index);
    });
    if (progressFill) {
      progressFill.style.width = `${((index + 1) / steps.length) * 100}%`;
    }
    currentStep = index;
  }

  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        showStep(Math.min(currentStep + 1, steps.length - 1));
      }
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showStep(Math.max(currentStep - 1, 0));
    });
  });

  function validateStep(step) {
    const currentStepEl = steps[step];
    const inputs = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
    let valid = true;

    inputs.forEach(input => {
      if (!input.value.trim()) {
        input.classList.add('is-invalid');
        valid = false;
      } else {
        input.classList.remove('is-invalid');
      }
      // National ID validation
      if (input.name === 'national_id' && input.value.trim().length < 5) {
        input.classList.add('is-invalid');
        valid = false;
      }
      // Contact validation
      if (input.name === 'contact_number' && input.value.trim().length < 8) {
        input.classList.add('is-invalid');
        valid = false;
      }
    });

    if (!valid) {
      const firstInvalid = currentStepEl.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
    }

    return valid;
  }

  // File upload handling
  const fileInput = document.getElementById('documentUpload');
  const uploadArea = document.querySelector('.upload-area');
  const fileNameDisplay = document.getElementById('fileName');
  const fileSizeDisplay = document.getElementById('fileSize');
  const filePreview = document.getElementById('filePreview');
  const removeFileButton = document.getElementById('removeFile');

  if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateFileDisplay(fileInput.files[0]);
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        updateFileDisplay(fileInput.files[0]);
      }
    });

    if (removeFileButton) {
      removeFileButton.addEventListener('click', () => {
        fileInput.value = '';
        if (filePreview) filePreview.classList.add('d-none');
        if (fileNameDisplay) fileNameDisplay.textContent = 'file.pdf';
        if (fileSizeDisplay) fileSizeDisplay.textContent = '0.0 MB';
      });
    }

    function updateFileDisplay(file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File is too large. Maximum size is 10MB.');
        fileInput.value = '';
        if (filePreview) filePreview.classList.add('d-none');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, and PDF files are allowed.');
        fileInput.value = '';
        if (filePreview) filePreview.classList.add('d-none');
        return;
      }
      if (fileNameDisplay) {
        fileNameDisplay.textContent = `📎 ${file.name}`;
      }
      if (fileSizeDisplay) {
        fileSizeDisplay.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
      }
      if (filePreview) {
        filePreview.classList.remove('d-none');
      }
    }
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';

    try {
      // Collect form data
      const formData = new FormData(form);
      const file = formData.get('document');

      let documentUrl = null;

      // Upload document to Supabase Storage
      if (file && file.size > 0) {
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
          .from('documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = window.supabaseClient.storage
          .from('documents')
          .getPublicUrl(fileName);

        documentUrl = urlData.publicUrl;
      }

      // Insert application into database
      const applicationNumber = generateApplicationNumber();
      const insertData = {
        application_number: applicationNumber,
        vehicle_id: parseInt(formData.get('vehicle_id')),
        first_name: formData.get('first_name'),
        surname: formData.get('surname'),
        national_id: formData.get('national_id'),
        dob: formData.get('dob'),
        occupation: formData.get('occupation'),
        contact_number: formData.get('contact_number'),
        residential_address: formData.get('residential_address'),
        marital_status: formData.get('marital_status'),
        gender: formData.get('gender'),
        religion: formData.get('religion'),
        kin_name: formData.get('kin_name'),
        kin_surname: formData.get('kin_surname'),
        kin_contact: formData.get('kin_contact'),
        kin_address: formData.get('kin_address'),
        status: 'pending',
        admin_fee_paid: false
      };

      if (documentUrl) {
        insertData.document_url = documentUrl;
      }

      const { error: insertError } = await window.supabaseClient
        .from('applications')
        .insert(insertData);

      if (insertError) throw insertError;

      // Redirect to success page with the application number
      window.location.href = `application-success.html?number=${encodeURIComponent(applicationNumber)}`;

    } catch (error) {
      console.error('Submission error:', error);
      alert('There was an error submitting your application. Please try again.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Application';
    }
  });
}

function normalizeMileageDisplay(raw) {
  if (!raw) return 'N/A';
  try {
    const s = String(raw).trim();
    // If already contains km, return normalized number + ' km'
    if (/km/i.test(s)) {
      return s.replace(/\s+/g, ' ');
    }
    // If contains miles/mi, extract number and convert
    const miMatch = s.match(/([\d,\.]+)/);
    if (miMatch) {
      let num = parseFloat(miMatch[1].replace(/,/g, ''));
      if (/mi|mile/i.test(s)) {
        const km = Math.round(num * 1.60934);
        return `${km.toLocaleString()} km`;
      }
      // If just a number assume it's already km
      return `${Math.round(num).toLocaleString()} km`;
    }
    return s + ' km';
  } catch (e) {
    return String(raw);
  }
}