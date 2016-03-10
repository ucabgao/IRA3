Crafty.c("Cell", {
	
	//-----------------------------------------------------------------------------
	//	Attributes
	//-----------------------------------------------------------------------------
	
	center: { x: 0, y: 0 },
	id: 0,
	elem: null,
	lowerCell: false,
	upperCell: false,
	
	//-----------------------------------------------------------------------------
	//	Init
	//-----------------------------------------------------------------------------
	
	init: function() {
		this.requires('2D, DOM');
		return this;
	},
	
	//-----------------------------------------------------------------------------
	//	Constructor
	//-----------------------------------------------------------------------------
	
	cell : function(ref) {
		this.center = {x:this._x+ this._w/2, y:this._y + this._h/2};
		this.id		= ref;
		return this;
	},
});
