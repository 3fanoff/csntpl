import '@scss/main.app.scss';
import * as bootstrap from 'bootstrap';
import CarouselGallery from "./carouselGallery";

let carousels = null;
if ((carousels = document.querySelectorAll('.js-carousel-gallery')).length) {
  Array.prototype.slice.call(carousels).forEach((carousel) => {
    new CarouselGallery(carousel).init();
  });
}

const tabEmulationNodes = document.querySelectorAll('[data-emulation-tab]')
Array.prototype.slice.call(tabEmulationNodes).forEach(emulationNode => {
  emulationNode.addEventListener('click', (e) => {
    e.preventDefault();
    const originalTabSelector = e.target.getAttribute('data-emulation-tab');
    const originalTabNode = document.querySelector(originalTabSelector);
    if (originalTabNode) originalTabNode.click();
  })

  /*emulationNode.addEventListener('show.bs.tab', function(event) {
    console.log(event.target) // newly activated tab
    console.log(bootstrap.Tab.getInstance(this)) // previous active tab
  })*/
});

const tabOriginalNodes = document.querySelectorAll('[data-bs-toggle="tab"]');
Array.prototype.slice.call(tabOriginalNodes).forEach(originalNode => {
  originalNode.addEventListener('show.bs.tab', (e) => {

    Array.prototype.slice.call(tabEmulationNodes).forEach(emulationNode => {
      let currentTabSelector = emulationNode.getAttribute('data-emulation-tab');
      if (currentTabSelector === '#' + e.target.id) {
        emulationNode.classList.add('active');
        return;
      }
      if (currentTabSelector === '#' + e.relatedTarget.id) {
        emulationNode.classList.remove('active');
      }
    })
    //console.log('#' + e.target.id);
    //console.log('#' + e.relatedTarget.id);
  })
});

const stickyHeader = document.getElementById('cs-header');
if (stickyHeader) {
  let headerIsShow = true;
  const stickyFading = () => {
    switch (true) {
      case headerIsShow && window.scrollY >= 100:
        stickyHeader.classList.remove('show');
        headerIsShow = false;
        break;
      case !headerIsShow && window.scrollY < 100:
        stickyHeader.classList.add('show');
        headerIsShow = true;
        break;
    }
  }
  window.addEventListener('scroll', stickyFading)
  stickyFading();
}