import TouchMoveEvents from './TouchMoveEvents';
import {executeAfterTransition} from 'bootstrap/js/src/util';


const noStyle = '';
const CLASS_NOTRANSITION = 'no-transition';
const CSS_TRANSFORM = 'transform';
const CSS_MARGINLEFT = 'marginLeft';
const CSS_WIDTH = 'width';
const MILLISECONDS_MULTIPLIER = 1000;
const nodesLikeArray = function (nodeList) {
    if (nodeList instanceof NodeList) {
        return Array.prototype.slice.call(nodeList);
    }
    return [];
};

class CarouselGallery {

    static breakpoints = {
        xs: window.matchMedia('(max-width:767.8px)'),
        sm: window.matchMedia('(min-width:768px) and (max-width:1023.8px)'),
        md: window.matchMedia('(min-width:1024px)')
    };

    breakpoint = 'md';
    defaultOffsetX = 1;
    offsetX = 1;
    activeIndex = 0;// firstIndex by default
    lastIndex = 1;
    clonedNodes = [];
    visible = true;
    carouselHasActions = false;
    _isTransitioning = false;
    _autoplayTimeout = null;
    _autoplayInterval = null;

    /**
     * @options.offset - на сколько сдвигается на каждом экране {md: 2, sm: 1}
     * @options.viewport - сколько отображается на каждом экране {md: 4, sm: 2, xs: 1}
     * @options.autoplay - true/false - автопрокрутка
     * @options.autoplayInterval - время в сек. между прокрутками
     * @options.autoplayTimeout - время в сек. до перво прокрутки
     */
    constructor(carouselElement, options = {}) {
        this.carousel = carouselElement;
        this.options = JSON.parse(this.carousel.dataset.options);
        this.wrapper = carouselElement.querySelector('.js-carousel-gallery__wrap');
        this.arrows = nodesLikeArray(carouselElement.querySelectorAll('.js-carousel-gallery__arrow'));
        this.points = nodesLikeArray(carouselElement.querySelectorAll('.js-carousel-gallery__point'));
        this.carouselItems = nodesLikeArray(carouselElement.querySelectorAll('.js-carousel-gallery__item'));
        this.lastIndex = this.carouselItems.length - 1;
        this.touchEvents = new TouchMoveEvents(this.wrapper);
    }

    init() {
        Object.keys(CarouselGallery.breakpoints).forEach((bp) => {
            this.onMediaQueryChange(CarouselGallery.breakpoints[bp], bp);
            CarouselGallery.breakpoints[bp].addListener((e) => {
                this.onMediaQueryChange(e, bp);
            })
        });

        this.arrows.forEach((arrow) => {
            arrow.addEventListener('click', (e) => {
                e.preventDefault();
                if (this._inTransitioning) return;

                this.stopAutoplay().setAutoplay();

                switch (e.currentTarget.dataset.type) {
                    case 'prev':
                        this.toLeftByXPos(this.offsetX);
                        this.togglePointClassName(this.getActiveIndexByOffset(this.offsetX, 'prev'), this.activeIndex);
                        this.setActiveIndexByOffset(this.offsetX, 'prev');
                        break;
                    case 'next':
                        this.nextItemAction();
                        break;
                }
            })
        });

        this.points.forEach((point) => {
            point.addEventListener('click', (e) => {
                e.preventDefault();
                if (this._inTransitioning) return;

                this.stopAutoplay().setAutoplay();

                let index = parseInt(e.currentTarget.dataset.index);
                let newOffsetX = 0;
                if (index === this.activeIndex) return;
                if (index < this.activeIndex) {
                    newOffsetX = this.activeIndex - index;
                    this.toLeftByXPos(newOffsetX);
                } else {
                    newOffsetX = index - this.activeIndex;
                    this.toRightByXPos(newOffsetX);
                }

                this.togglePointClassName(index, this.activeIndex);
                this.setActiveIndex(index);
            });
        });

        this.touchEvents.addOnTouchStart(() => {
            this.stopAutoplay();
            this.wrapper.classList.add(CLASS_NOTRANSITION);
        });

        this.touchEvents.addOnTouchMove((startX, endX) => {
            this.setWrapperCSS(CSS_TRANSFORM, 'translateX(' + endX + 'px)');
        });

        this.touchEvents.addOnTouchEnd((startX, endX) => {
            let itemPixelSize = this.wrapper.clientWidth / this.options.viewport[this.breakpoint];
            let multiplier = this.touchEvents.direction === 'next' ? -1 : 1;
            let offsetX = Math.round(endX / itemPixelSize * multiplier);

            if (this.options.viewport[this.breakpoint] === 1 && offsetX === 0) {
                offsetX = (endX / itemPixelSize * multiplier > 0.2 ? 1 : 0);
            }

            this.wrapper.classList.remove(CLASS_NOTRANSITION);

            executeAfterTransition(() => {
                this.setAutoplay();
                this.wrapper.classList.add(CLASS_NOTRANSITION);
                this.setWrapperCSS(CSS_TRANSFORM);
                let i = 0;
                switch (this.touchEvents.direction) {
                    case 'prev':
                        while (i < offsetX) {
                           this.wrapper.insertBefore(this.wrapper.lastElementChild, this.wrapper.firstElementChild);
                            i++;
                        }
                        break;
                    case "next":
                        while (i < offsetX) {
                            this.wrapper.appendChild(this.wrapper.firstElementChild);
                            i++;
                        }
                      break;
                }
            }, this.wrapper, true);

            this.setWrapperCSS(CSS_TRANSFORM, 'translateX(' + (multiplier * offsetX * itemPixelSize) + 'px)');
            this.togglePointClassName(this.getActiveIndexByOffset(offsetX, this.touchEvents.direction), this.activeIndex);
            this.setActiveIndexByOffset(offsetX, this.touchEvents.direction);
        });

        this.setAutoplay();

        document.addEventListener('visibilitychange', () => {
            this.visible = document.hidden === false;
            if (this.options.autoplay !== false) {
                if (!this.visible) {
                    this.stopAutoplay()
                } else {
                    this.setAutoplay();
                }
            }
        });

      return this;
    }

    nextItemAction() {
        if (this._inTransitioning) return;
        this.toRightByXPos(this.offsetX);
        this.togglePointClassName(this.getActiveIndexByOffset(this.offsetX, 'next'), this.activeIndex);
        this.setActiveIndexByOffset(this.offsetX, 'next');
    }

    setAutoplay() {
        if (this.options.autoplay) {
            const interval = isNaN(this.options.autoplayInterval) ? 4 : this.options.autoplayInterval;
            const timeout = isNaN(this.options.autoplayTimeout) ? 2 : this.options.autoplayInterval;

            this._autoplayTimeout = setTimeout(() => {
                this._autoplayInterval = setInterval(() => {
                    this.nextItemAction();
                }, interval * MILLISECONDS_MULTIPLIER);
            }, timeout * MILLISECONDS_MULTIPLIER);
        }

        return this;
    }

    stopAutoplay() {
        clearTimeout(this._autoplayTimeout);
        clearInterval(this._autoplayInterval);
        return this;
    }

    setActiveIndex(index) {
        this.activeIndex = index > this.lastIndex ? 0 : (index < 0 ? this.lastIndex : index);
        return this;
    }

    getActiveIndexByOffset(offsetX, direction) {
        switch (direction) {
            case 'prev':
                if (this.activeIndex - offsetX < 0) {
                    return (this.lastIndex + 1) + (this.activeIndex - offsetX);
                }
                return this.activeIndex - offsetX;
            case 'next':
                if (this.activeIndex + offsetX > this.lastIndex) {
                    return 0;
                }
                return this.activeIndex + offsetX;
        }
        return 0;
    }

    setActiveIndexByOffset(offsetX, direction) {
        return this.setActiveIndex(this.getActiveIndexByOffset(offsetX, direction))
    }

    togglePointClassName(newIndex, oldIndex) {
        if (this.points.length) {
            this.points[oldIndex].classList.remove('active');
            this.points[newIndex].classList.add('active');
        }
        return this;
    }


    toLeftByXPos(offsetX) {
        this.wrapper.classList.remove(CLASS_NOTRANSITION);
        executeAfterTransition(() => {
            let i = 0;
            while (i < offsetX) {
                this.wrapper.insertBefore(this.wrapper.lastElementChild, this.wrapper.firstElementChild);
                i++;
            }
            this.wrapper.classList.add(CLASS_NOTRANSITION);
            this.setWrapperCSS(CSS_TRANSFORM);
            this._inTransitioning = false;
        }, this.wrapper, true);

        this._inTransitioning = true;
        this.setWrapperCSS(CSS_TRANSFORM, 'translateX(' + 100 / this.options.viewport[this.breakpoint] * offsetX + '%)');
    }

    toRightByXPos(offsetX) {
        this.wrapper.classList.remove(CLASS_NOTRANSITION);
        executeAfterTransition(() => {
            let i = 0;
            while (i < offsetX) {
                this.wrapper.appendChild(this.wrapper.firstElementChild);
                i++;
            }
            this.wrapper.classList.add(CLASS_NOTRANSITION);
            this.setWrapperCSS(CSS_TRANSFORM);
            this._inTransitioning = false;
        }, this.wrapper, true);

        this._inTransitioning = true;
        this.setWrapperCSS(CSS_TRANSFORM, 'translateX(-' + 100 / this.options.viewport[this.breakpoint] * offsetX + '%)');
    }

    getClonedNodesList(nodeClass) {
        return this.carouselItems.map((node) => {
            const clonedElement = node.cloneNode(true);
            clonedElement.classList.add(nodeClass);
            this.clonedNodes.push(clonedElement);
            return clonedElement;
        });
    }

    prependClonedNodes() {
        let docFrag = document.createDocumentFragment();
        this.getClonedNodesList('clone-before').forEach((item) => {
            docFrag.appendChild(item);
        });
        this.wrapper.insertBefore(docFrag, this.wrapper.firstElementChild);
        return this;
    }

    appendClonedNodes() {
        let docFrag = document.createDocumentFragment();
        this.getClonedNodesList('clone-after').forEach((item) => {
            docFrag.appendChild(item);
        });

        this.wrapper.appendChild(docFrag);
        return this;
    }

    onMediaQueryChange(mediaQuery, breakpointName) {
        if (mediaQuery instanceof MediaQueryList || mediaQuery instanceof MediaQueryListEvent) {
            if (mediaQuery.matches) {
                this.breakpoint = breakpointName;
                this.carouselHasActions = this.lastIndex + 1 > this.options.viewport[breakpointName];
                this.offsetX = this.options.offset[breakpointName] || this.defaultOffsetX;

                if (this.carouselHasActions && !this.clonedNodes.length) {
                  this.prependClonedNodes()
                    .appendClonedNodes()
                }

                this.setWrapperOffsetMargin(breakpointName);

                this.clonedNodes.forEach((node) => node.style.display = this.carouselHasActions ? noStyle : 'none');

                if (this.arrows.length) {
                    this.arrows.forEach((arrow) => arrow.style.visibility = this.carouselHasActions ? noStyle : 'hidden');
                }

                if (this.points.length) {
                    this.points.forEach((point) => point.style.visibility = this.carouselHasActions ? noStyle : 'hidden');
                }
            }
        }
    }

    setWrapperCSS(attr, value = '') {
        this.wrapper.style[attr] = value;
        return this;
    }

    setWrapperOffsetMargin(breakpoint = "md") {
        this.setWrapperCSS(CSS_WIDTH)
          .setWrapperCSS(CSS_MARGINLEFT);

        if (!this.carouselHasActions) return this;

        let viewportSize = this.options.viewport[breakpoint];
        let carouselLength = this.carouselItems.length;
        let totalMargin = '';

        const css = window.getComputedStyle(this.wrapper);

        this.setWrapperCSS(CSS_WIDTH, 'calc(100% - (' + css.marginLeft + ' + ' + css.marginRight + '))');

        if (viewportSize === carouselLength) {
            totalMargin = 'calc((100% - (' + css.marginLeft + ' + ' + css.marginRight + '))/' + -1 + ' + ' + css.marginLeft + ')';
        } else {
            totalMargin = 'calc((100% - (' + css.marginLeft + ' + ' + css.marginRight + '))/' + viewportSize + ' * ' + -carouselLength + ' + ' + css.marginLeft + ')';
        }
        this.setWrapperCSS(CSS_MARGINLEFT, totalMargin);

        return this;
    }

}

export default CarouselGallery;