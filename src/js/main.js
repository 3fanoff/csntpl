import '@scss/main.app.scss';
import * as bootstrap from 'bootstrap';
import CarouselGallery from "./carouselGallery";

let carousels = null;
if ((carousels = document.querySelectorAll('.js-carousel-gallery')).length) {
  Array.prototype.slice.call(carousels).forEach((carousel) => {
    new CarouselGallery(carousel).init();
  });
}