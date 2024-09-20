const noop = function () {};
const isFunction = function (callback) {
    return typeof callback === 'function';
};

class TouchMoveEvents {
    touchStartX = null;
    touchStartY = null;
    touchEndX = null;
    touchEndY = null;
    startClientY = null;
    startClientX = null;
    direction = 'next';
    axis = TouchMoveEvents.AXIS.X;
    onTouchStart = noop;
    onTouchEnd = noop;
    onTouchMove = noop;

    static AXIS = {
        X: 'X',
        Y: 'Y'
    };

    static DIR_SCHEMA = {
        order: {
            left: 'next',
            right: 'prev',
            top: 'next',
            bottom: 'prev'
        },
        direction: {
            left: 'left',
            right: 'right',
            top: 'top',
            bottom: 'bottom'
        }
    };

    static OPTIONS = {
        preventAxis: TouchMoveEvents.AXIS.Y,
        preventDefaultActiveAxis: true,
        schema: 'order'
    };

    constructor(parentElement, options = {}) {
        this.parent = parentElement;
        this.options = Object.assign({}, TouchMoveEvents.OPTIONS, options);

        this.parent.addEventListener("touchstart", (e) => {
            let touch = e.touches[0];

            this.touchStartX = touch.pageX;
            this.touchStartY = touch.pageY;
            this.startClientY = touch.clientY;
            this.startClientX = touch.clientX;
            this.onTouchStart(this.touchStartX, this.touchStartY);
        });

        this.parent.addEventListener("touchmove", (e) => {
            const touch = e.touches[0];
            const schema = TouchMoveEvents.DIR_SCHEMA[this.options.schema];

            if (this.touchStartX !== null) {
                this.axis = Math.abs(touch.clientX - this.startClientX) > Math.abs(touch.clientY - this.startClientY) ? TouchMoveEvents.AXIS.X : TouchMoveEvents.AXIS.Y;

                if (!this.isPreventAxis()) {
                    this.options.preventDefaultActiveAxis && e.preventDefault();

                    this.touchEndX = touch.clientX - this.startClientX;
                    this.touchEndY = touch.clientY - this.startClientY;
                    this.direction = this.axis === TouchMoveEvents.AXIS.X ?
                        (this.touchEndX < 0 ? schema.left : schema.right) :
                        (this.touchEndY < 0 ? schema.top : schema.bottom);

                    this.onTouchMove(this.touchStartX, this.touchEndX, this.touchStartY, this.touchEndY);
                }
            }
        });

        this.parent.addEventListener("touchend", () => {
            this.onTouchEnd(this.touchStartX, this.touchEndX, this.touchStartY, this.touchEndY);
            this.touchStartX =
            this.touchStartY =
            this.touchEndX =
            this.touchEndY =
            this.startClientY =
            this.startClientX = null;
        });
    }

    isPreventAxis() {
        return this.axis === this.options.preventAxis;
    }

    addOnTouchStart(callback) {
        if (isFunction(callback)) {
            this.onTouchStart = callback;
        }
        return this;
    }

    addOnTouchMove(callback) {
        if (isFunction(callback)) {
            this.onTouchMove = callback;
        }
        return this;
    }

    addOnTouchEnd(callback) {
        if (isFunction(callback)) {
            this.onTouchEnd = callback;
        }
        return this;
    }
}

export default TouchMoveEvents;