// ==================== NAVIGATION ====================

// Animated selector function
function updateHoriSelector() {
  var tabsNewAnim = $('#navbarSupportedContent');
  var activeItemNewAnim = tabsNewAnim.find('.active');
  var activeWidthNewAnimHeight = activeItemNewAnim.innerHeight();
  var activeWidthNewAnimWidth = activeItemNewAnim.innerWidth();
  var itemPosNewAnimTop = activeItemNewAnim.position();
  var itemPosNewAnimLeft = activeItemNewAnim.position();
  $(".hori-selector").css({
    "top": itemPosNewAnimTop.top + "px",
    "left": itemPosNewAnimLeft.left + "px",
    "height": activeWidthNewAnimHeight + "px",
    "width": activeWidthNewAnimWidth + "px"
  });
}

// Initialize on document ready
$(document).ready(function() {
  setTimeout(function() {
    updateHoriSelector();
  }, 100);

  // Handle navigation clicks
  $("#navbarSupportedContent").on("click", "li", function(e) {
    e.preventDefault();

    // Get the page from data attribute
    const page = $(this).find('.nav-link').data('page');

    // Update active state
    $('#navbarSupportedContent ul li').removeClass("active");
    $(this).addClass('active');

    // Update selector position
    var activeWidthNewAnimHeight = $(this).innerHeight();
    var activeWidthNewAnimWidth = $(this).innerWidth();
    var itemPosNewAnimTop = $(this).position();
    var itemPosNewAnimLeft = $(this).position();
    $(".hori-selector").css({
      "top": itemPosNewAnimTop.top + "px",
      "left": itemPosNewAnimLeft.left + "px",
      "height": activeWidthNewAnimHeight + "px",
      "width": activeWidthNewAnimWidth + "px"
    });

    // Load the page
    loadPage(page);
  });

  // Load initial page
  loadPage('recipes');
});

// Handle window resize
$(window).on('resize', function() {
  setTimeout(function() {
    updateHoriSelector();
  }, 500);
});

// Handle mobile menu toggle
$(".navbar-toggler").click(function() {
  $(".navbar-collapse").slideToggle(300);
  setTimeout(function() {
    updateHoriSelector();
  });
});

async function loadPage(pageName) {
  const container = document.getElementById('page-container');

  try {
    const response = await fetch(`pages/${pageName}.html`);
    container.innerHTML = await response.text();

    // Initialize page-specific functionality
    if (pageName === 'recipes' && typeof initRecipesPage === 'function') {
      initRecipesPage();
    }
    if (pageName === 'map' && typeof initMapPage === 'function') {
      setTimeout(() => initMapPage(), 100);
    }
  } catch (error) {
    console.error('Error loading page:', error);
    container.innerHTML = '<div class="container mt-4"><div class="alert alert-danger">Error loading page</div></div>';
  }
}
