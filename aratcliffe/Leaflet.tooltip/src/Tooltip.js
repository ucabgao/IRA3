/* @flow */
var L:any;
L.Tooltip = L.Class.extend({
	
	options: {
		width: 'auto',
		minWidth: '',
		maxWidth: '',
		padding: '2px 4px',
		showDelay: 500,
		hideDelay: 500,
		mouseOffset: L.point(0, 24),
		fadeAnimation: true,
		trackMouse: false		
	},

	initialize: function (options) {
		L.setOptions(this, options);

		this._createTip();
	},

	_createTip: function () {
		this._map = this.options.map;

		if (!this._map) {
			throw new Error('No map configured for tooltip');
		}

		this._container = L.DomUtil.create('div', 'leaflet-tooltip');
		this._container.style.position = 'absolute';
		this._container.style.width = this._isNumeric(this.options.width) ? this.options.width + 'px' : this.options.width;
		this._container.style.minWidth = this._isNumeric(this.options.minWidth) ? this.options.minWidth + 'px' : this.options.minWidth;
		this._container.style.maxWidth = this._isNumeric(this.options.maxWidth) ? this.options.maxWidth + 'px' : this.options.maxWidth;

		this._container.style.padding = this._isNumeric(this.options.padding) ? this.options.padding + 'px' : this.options.padding;

		if (this.options.html) {
			this.setHtml(this.options.html);
		}

 		if (this.options.target) {
			this.setTarget(this.options.target);
		}

		this._map._tooltipContainer.appendChild(this._container);
	},
	
	isVisible: function () {
		return this._showing;
	},

	setTarget: function (target) {
		if (target._icon) {
			target = target._icon;
		} else if (target._container) {
			target = target._container;
		}

		if (target === this._target) {
			return;
		}

		if (this._target) {
			this._unbindTarget(this._target);
		}

		this._bindTarget(target);

		this._target = target;
	},

	_bindTarget: function (target) {
		L.DomEvent
			.on(target, 'mouseover', this._onTargetMouseover, this)
		    .on(target, 'mouseout', this._onTargetMouseout, this)
		    .on(target, 'mousemove', this._onTargetMousemove, this);
	},

	_unbindTarget: function (target) {
		L.DomEvent
			.off(target, 'mouseover', this._onTargetMouseover, this)
		    .off(target, 'mouseout', this._onTargetMouseout, this)
		    .off(target, 'mousemove', this._onTargetMousemove, this);
	},

	setHtml: function (html) {
		if (typeof html === 'string') {
			this._container.innerHTML = html;	
		} else {
			while (this._container.hasChildNodes()) {
				this._container.removeChild(this._container.firstChild);
			}
			this._container.appendChild(this._content);			
		}
		
		this._sizeChanged = true;
	},

	setPosition: function (point) {
		var mapSize = this._map.getSize(),
		    container = this._container,
		    containerSize = this._getElementSize(this._container);

		point = point.add(this.options.mouseOffset);
		
		if (point.x + containerSize.x > mapSize.x) {
			container.style.left = 'auto';
			container.style.right = (mapSize.x - point.x + 2*(this.options.mouseOffset.x)) + 'px';
		} else {
			container.style.left = point.x + 'px';
			container.style.right = 'auto';
		}
		
		if (point.y + containerSize.y > mapSize.y) {
			container.style.top = 'auto';
            container.style.bottom = (mapSize.y - point.y + 2*(this.options.mouseOffset.y)) + 'px';
		} else {
			container.style.top = point.y + 'px';
			container.style.bottom = 'auto';
		}
	},

	remove: function () {
		this._container.parentNode.removeChild(this._container);
		delete this._container;

		if (this._target) {
			this._unbindTarget(this._target);
		}
	},

	show: function (point, html) {
		if (L.Tooltip.activeTip && L.Tooltip.activeTip != this) {
			L.Tooltip.activeTip._hide();
		}
		L.Tooltip.activeTip = this;		
		
		if (html) {
			this.setHtml(html);
		}

		this.setPosition(point);

		if (this.options.showDelay) {
			this._delay(this._show, this, this.options.hideDelay);
		} else {
			this._show();
		}
	},

	_show: function () {
		this._container.style.display = 'inline-block';		

		// Necessary to force re-calculation of the opacity value so transition will run correctly
		if (window.getComputedStyle) {
			window.getComputedStyle(this._container).opacity;
		}

		L.DomUtil.addClass(this._container, 'leaflet-tooltip-fade');

		this._showing = true;			
	},

	hide: function () {
		if (this.options.hideDelay) {
			this._delay(this._hide, this, this.options.hideDelay);
		} else {
			this._hide();
		}		
	},

	_hide: function () {	
		if (this._timeout) {
			clearTimeout(this._timeout);
		}
		
		L.DomUtil.removeClass(this._container, 'leaflet-tooltip-fade');
		this._container.style.display = 'none';
		
		this._showing = false;

		if (L.Tooltip.activeTip === this) {
			delete L.Tooltip.activeTip;
		}
	},

	_delay: function (func, scope, delay) {
		var me = this;

		if (this._timeout) {
			clearTimeout(this._timeout);
		}
		this._timeout = setTimeout(function () {
			func.call(scope);
			delete me._timeout;
		}, delay);
	},

	_isNumeric: function (val) {
		return !isNaN(parseFloat(val)) && isFinite(val);
	},

	_getElementSize: function (el) {		
		var size = this._size;

		if (!size || this._sizeChanged) {
			size = {};

			el.style.left = '-999999px';
			el.style.right = 'auto';
			el.style.display = 'inline-block';
			
			size.x = el.offsetWidth;
			size.y = el.offsetHeight;
			
			el.style.left = 'auto';
			el.style.display = 'none';
			
			this._sizeChanged = false;
		}
		return size;
	},

	_onTargetMouseover: function (e) {
		var point = this._map.mouseEventToContainerPoint(e);

		this.show(point);
	},

	_onTargetMousemove: function (e) {
		L.DomEvent.stopPropagation(e);

		if (this.options.trackMouse) {
			var point = this._map.mouseEventToContainerPoint(e);		
			this.setPosition(point);
		}
	},

	_onTargetMouseout: function (e) {
		this.hide();
	}
});

L.Map.addInitHook(function () {
	this._tooltipContainer = L.DomUtil.create('div', 'leaflet-tooltip-container', this._container);
});

L.tooltip = function (options) {
	return new L.Tooltip(options);
};

(function () {
	var originalOnAdd = L.Marker.prototype.onAdd,
	    originalOnRemove = L.Marker.prototype.onRemove,
	    originalSetIcon = L.Marker.prototype.setIcon;

	L.Marker.include({

		getTooltip: function () {
			return this._tooltip;
		},
		
		onAdd: function (map) {
			originalOnAdd.call(this, map);

			if (this.options.tooltip) {
				this._tooltip = L.tooltip(L.extend(this.options.tooltip, {target: this, map: map}));
			}
		},

		onRemove: function (map) {
			if (this._tooltip) {
				this._tooltip.remove();
			}
			originalOnRemove.call(this, map);
		},

		setIcon: function (icon) {			
			originalSetIcon.call(this, icon);
			
			if (this._tooltip) {
				this._tooltip.setTarget(this._icon);
			}
		}
	});	
})();
